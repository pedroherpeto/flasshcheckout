const queueProcess = {};
const mongo = require('../repository/mongo');
var queueManager = require('../queue/manager');
const constants = require('../constants.json');
const SR_APIKEY = process.env.SOCIALROCKET_API_KEY || constants.SOCIALROCKET_API_KEY;
const axios = require("axios");
const crypto = require('crypto');

queueProcess.addMoney = (request) => {

    return new Promise( (resolve, reject) => {

    console.log("UPDATE SOCIALROCKET", JSON.stringify(request));

    console.log('ADD MONEY START');

    const paymentMetadata = request.payment.metadata;

    // calculo de valores para os planos na socialrocket
    let price = paymentMetadata.price;
    if(request.payment.plan.name.indexOf("Trimestral") > -1){
        price = parseFloat(paymentMetadata.price) * 1.0;
    }
    if(request.payment.plan.name.indexOf("Anual") > -1){
        price = parseFloat(paymentMetadata.price) * 1.0;
    }

    const data = {user_id: paymentMetadata.userId, amount: parseFloat(price).toFixed(2)};
    const hash = crypto.createHmac('sha256', SR_APIKEY).update(JSON.stringify(data)).digest('hex'); 
    const options = {
        "url": "https://app.socialrocket.com.br/api-socialrocket/add-money",
        "method": "POST",
        "responseType": "json",
        "headers": {
        'Sig-Key': hash
        },
        "data": data
    };

    console.log(JSON.stringify(data));

    axios.post(options.url, options.data, { headers: options.headers })
        .then(function(response) {
            if(response.status == 200){
                console.log('ADD MONEY END');
                console.log('User id', response.data.result.user_id);
                
                request.payment.QueueStatus = 'addDays';                
                queueManager.publish('', 'payment', new Buffer(JSON.stringify({payment: request.payment})));

                return resolve(true);
            }
            else {
                console.log('ADD MONEY END');
                console.log('Ops!! Status:', response.status);

                request.payment.STATUS = 'ERROR ADD MONEY';
                queueProcess.mongoInsert(request);

                return reject({message: response.data, stack: response}, request);
            }
        })
        .catch(err => {
            console.log('ADD MONEY END');
            console.log('Error: ', err.message);
            console.log(JSON.stringify(err.response.data));

            request.payment.STATUS = 'ERROR ADD MONEY';
            queueProcess.mongoInsert(request);
            return reject(err, request);
        });
    });
}


queueProcess.addDays = (request) => {

    return new Promise( (resolve, reject) => {
    console.log('ADD DAYS START');
    const paymentMetadata = request.payment.metadata;
    const api_key = 'adkjc46fbjva73bvake7529ccshjf36';
    const data = [ { "account_id": paymentMetadata.accountId, "add": queueProcess.addFeature(paymentMetadata.name), "price": request.payment.metadata.price} ];
    const hash = crypto.createHmac('sha256', api_key).update(JSON.stringify(data)).digest('hex');
  
    const options = {
      "url": "https://app.socialrocket.com.br/api-socialrocket/add-days",
      "method": "POST",
      "responseType": "json",
      "headers": {
        'Sig-Key': hash
      },
      "data": data
    };
  
    axios
      .post(options.url, options.data, { headers: options.headers })
      .then(function(response) {
        if(response.status == 200){
          console.log('ADD DAYS END');
          console.log('Dias inserido com sucesso');
          console.log('User id', JSON.stringify(response.data.result));

            request.payment.STATUS = 'FINISHED';
            queueProcess.mongoInsert(request);

          return resolve(true);
          
        }
        else {
            console.log('ADD DAYS END');
            console.log('Ops!! Status:', response.status);
            console.log(JSON.stringify(response.data));

            request.payment.STATUS = 'ERROR ADD DAYS';
            queueProcess.mongoUpdate(request);

            return reject({message: response.data, stack: response}, request);
        }
      })
      .catch(err => {
        console.log('ADD DAYS END');
        console.log('Error: ', err.message);
        console.log(JSON.stringify(err.response.data));

        request.payment.STATUS = 'ERROR ADD DAYS';
        queueProcess.mongoUpdate(request);
        return reject(err, request);
      });
    
    });
}


queueProcess.mongoInsert = (request) => {

    try {
        console.log('MONGO START');
        request.payment.idSocialRocket = request.payment.id + request.payment.customer.id;

        mongo.insertOne('payment', request.payment)
        .then(data => {
            console.log('MONGO END');
            console.log('MONGO OK', request.payment.STATUS);
        })
        .catch(err => {
            console.log('MONGO END');
            console.log('ERROR MONGO', request.payment.STATUS);
        });

    } catch (err) {
        console.log('MONGO END');
        console.log('Error', request.payment.STATUS)
    }
}

queueProcess.mongoUpdate = (request) => {

    try {
        console.log('MONGO START');
        console.log('Queue start:', request.payment.id);

        mongo.updateOne('payment', request.payment, {idSocialRocket: request.payment.id + request.payment.customer.id})
        .then(data => {
            console.log('MONGO END');
            console.log('MONGO OK', request.payment.STATUS);
        })
        .catch(err => {
            console.log('MONGO END');
            console.log('ERROR MONGO', request.payment.STATUS);
        });

    } catch (err) {
        console.log('MONGO END');
        console.log('Error', request.payment.STATUS)
    }
}



queueProcess.addFeature = (featureName) => {
   
    switch (featureName) {
      case "Mensal":
          return { "promo": 30 };
      case "Mensal+Direct":
          return { "promo": 30, "direct": 30 };
      case "Mensal+Gerenciador":
          return { "promo": 30, "tracker": 30 };
      case "Mensal+Pro":
          return { "promo": 30, "posting": 30 };
      case "Mensal+Direct+Gerenciador":
          return { "promo": 30, "direct": 30, "tracker": 30 };
      case "Mensal+Direct+Pro":
          return { "promo": 30, "direct": 30, "posting": 30 };
      case "Mensal+Gerenciador+Pro":
          return { "promo": 30, "tracker": 30, "posting": 30 };
      case "Mensal+Direct+Gerenciador+Pro":
          return { "promo": 30, "direct": 30, "tracker": 30, "posting": 30 };
      case "Trimestral":
          return { "promo": 90 };
      case "Trimestral+Direct":
          return { "promo": 90, "direct": 90 };
      case "Trimestral+Gerenciador":
          return { "promo": 90, "tracker": 90 };
      case "Trimestral+Pro":
          return { "promo": 90, "posting": 90 };
      case "Trimestral+Direct+Gerenciador":
          return { "promo": 90, "direct": 90, "tracker": 90 };
      case "Trimestral+Direct+Pro":
          return { "promo": 90, "direct": 90, "posting": 90 };
      case "Trimestral+Gerenciador+Pro":
          return { "promo": 90, "tracker": 90, "posting": 90 };
      case "Trimestral+Direct+Gerenciador+Pro":
          return { "promo": 90, "tracker": 90, "posting": 90 };
      case "Anual":
          return { "promo": 360 };
      case "Anual+Direct":
          return { "promo": 360, "direct": 360 };
      case "Anual+Gerenciador":
          return { "promo": 360, "tracker": 360 };
      case "Anual+Pro":
          return { "promo": 360, "posting":360 };
      case "Anual+Direct+Gerenciador":
          return { "promo": 360, "direct": 360, "tracker": 360 };
      case "Anual+Direct+Pro":
          return { "promo": 360, "direct": 360, "posting":360 };
      case "Anual+Gerenciador+Pro":
          return { "promo": 360, "tracker": 360, "posting":360 };
      case "Anual+Direct+Gerenciador+Pro":
          return { "promo": 360, "direct": 360, "tracker": 360, "posting":360 };
    }
  
  }
  
  



module.exports = queueProcess;