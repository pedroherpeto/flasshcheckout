const amqp = require('amqplib/callback_api');
const queueManager = {};
const constants = require('../constants.json');
const RABBITMQ_URL = process.env.CLOUDAMQP_URL || constants.CLOUDAMQP_URL;

queueManager.amqpConn = null;
queueManager.pubChannel = null;
queueManager.offlinePubQueue = [];

queueManager.start = (startFunctions, q, callback) => {
	amqp.connect(RABBITMQ_URL + "?heartbeat=60", (err, conn) => {
		if (err) {
			console.error("[AMQP]", err.message);
			return setTimeout(queueManager.start, 1000);
		}
		conn.on("error", (err) => {
			if (err.message !== "Connection closing") {
				console.error("[AMQP] conn error", err.message);
			}
		});
		conn.on("close", () => {
			console.error("[AMQP] reconnecting");
			return setTimeout(queueManager.start, 1000);
		});

		console.log("[AMQP] connected");

		queueManager.amqpConn = conn;

		if (startFunctions) {
			startFunctions.forEach(f => {
				f(q, callback);	
			});
		}
	});
};

queueManager.closeOnErr = (err)=> {
	if (!err) return false;
	console.error("[AMQP] error", err);
	queueManager.amqpConn.close();
	return true;
}

queueManager.startPublisher = (q, callback) => {
	
	queueManager.amqpConn.createConfirmChannel( (err, ch)=> {
		if (queueManager.closeOnErr(err)) return;
		
		ch.on("error", (err) => {
			console.error("[AMQP] channel error", err.message);
		});
		
		ch.on("close", () => {
			console.log("[AMQP] channel closed");
		});

		queueManager.pubChannel = ch;

		while (true) {
			var m = queueManager.offlinePubQueue.shift();
			if (!m) break;
			queueManager.publish(m[0], m[1], m[2]);
		}
	});
};

queueManager.publish = (exchange, routingKey, content) => {
	try {
		queueManager.pubChannel.publish(exchange, routingKey, content, { persistent: true },
          (err, ok) => {
            if (err) {
              console.error("[AMQP] publish", err);
              queueManager.offlinePubQueue.push([exchange, routingKey, content]);
              queueManager.pubChannel.connection.close();
            }
          });
	} catch (e) {
		console.error("[AMQP] publish", e.message);
		queueManager.offlinePubQueue.push([exchange, routingKey, content]);
	}
};

queueManager.startWorker = (q, callback)=> {
	queueManager.amqpConn.createChannel((err, ch) => {
		if (queueManager.closeOnErr(err)) return;

		ch.on("error", (err) => {
			console.error("[AMQP] channel error", err.message);
		});

		ch.on("close", () => {
			console.log("[AMQP] channel closed");
		});

		ch.prefetch(10);
		
		ch.assertQueue(q, { durable: true }, (err, _ok) => {
			if (queueManager.closeOnErr(err)) return;
			ch.consume(q, processMsg, { noAck: false });
			console.log("Worker is started");
		});

		function processMsg(msg) {
			callback(msg, (ok) => {
				try {
					if (ok)
						ch.ack(msg);
					else
						ch.reject(msg, true);
				} catch (e) {
				  	queueManager.closeOnErr(e);
				}
			});
	    }
	});
};

module.exports = queueManager;