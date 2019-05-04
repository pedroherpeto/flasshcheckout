var express = require('express');
var router = express.Router();
var request = require('request');
var queueManager = require('../queue/manager');
const constants = require('../constants.json');
const VINDI_APIKEY = process.env.VINDI_API_KEY || constants.VINDI_API_KEY;

var Vindi = require('vindi-js');
var client = new Vindi(VINDI_APIKEY);

router.post('/', function(req, res, next) {
    console.log(JSON.stringify(req.body));

    console.log("Adicionou a fila o ID: ", req.body.event.data.bill.id);
    let id = req.body.event.data.bill.subscription.id;
  
    client.get({uri: 'subscriptions/' + id}).then((data) => {
        data.subscription.QueueStatus = 'addMoney';
        console.log(JSON.stringify(data));
        queueManager.publish('', 'payment', new Buffer(JSON.stringify({payment: data.subscription})));

        res.status(200).json({ successful: true });
        res.end();

    }).catch((err) => {
        console.error('error', err);
        res.status(200).json({ successful: false });
        res.end();
    });  

});
 


module.exports = router;


// DAYS: 30, 90, 180, 360
  // "promo": DAYS,  PLANO
  // "direct": DAYS  --- DIRECT
  // "tracker": DAYS --- GERENCIADOR DE COMENTÁRIOS
  // "posting": DAYS --- AGENDAMENTO PRO