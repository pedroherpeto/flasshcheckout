var express = require('express');
var router = express.Router();
const cpf = require('cpf_cnpj').CPF;
const cnpj = require("cpf_cnpj").CNPJ;
const constants = require('../constants.json');
var moment = require('moment');

const VINDI_APIKEY = process.env.VINDI_API_KEY || constants.VINDI_API_KEY;

var Vindi = require('vindi-js');
var client = new Vindi(VINDI_APIKEY);


router.get('/', function (req, res, next) {
  res.render('plan', { customerID: req.query.account });
});

router.get('/customer', function (req, res, next) {
  res.render('customer');
});

router.get('/payment', function (req, res, next) {
  res.render('payment');
});

router.get('/confirmation', function (req, res, next) {
  res.render('confirmation');
});

router.get('/waiting', function (req, res, next) {
  res.render('waiting');
});

router.get('/waiting-payment', function (req, res, next) {
  res.render('waiting-boleto', { boletoUrl: req.session.body.boletoUrl });
});

router.get('/payment-history', function (req, res, next) {

  try {
    const query = req.query;
    client.get({ uri: 'customers' }, "code=" + query.account).then((customer) => {
      client.get({ uri: 'subscriptions' }, "customer_id=" + customer.customers[0].id).then((data) => {

        data.subscriptions.forEach(subscription => {
          subscription.totalAmount = 0;
          subscription.product_items.forEach(item => {
            subscription.totalAmount += parseInt(item.pricing_schema.price);
          });
        });

        res.render('payment-history', { subscriptions: data.subscriptions, moment: moment });
        res.end();

      }).catch((err) => {
        console.error('error', err);
        res.render('payment-history-error');
        res.end();
      });

    }).catch((err) => {
      console.error('error', err);
      res.render('payment-history-error');
      res.end();
    });

  } catch (err) {
    res.render('payment-history-error');
    res.end();
  }



});

router.post('/assinatura', function (req, res, next) {
  // Avalia se o usuário já tem uma assinatura ativa no perfil atual
  let bodyObj = req.body;
  const query = `code=${bodyObj.customer.account}`;
  const profile = bodyObj.customer.profile;
  console.log("Checando assinatura...");

  client.get({ uri: 'customers' }, query).then((userData) => {
    console.log(userData.customers.length);
    if (userData.customers.length == 1) {
      const cust_id = userData.customers[0].id;
      console.log("\nCustomer:", userData.customers[0]);
      client.get({ uri: 'subscriptions' }, `customer_id=${cust_id}`).then((subData) => {
        let activeSub = false;
        subData.subscriptions.forEach((sub) => {
          if (sub.metadata.profile == profile && sub.status == "active") {
            console.log("Active sub: ");
            activeSub = true;
            return
          }
          if (sub.metadata.profile == profile) console.log(sub);
        });
        res.status(200).json({ activeSub: activeSub });
        res.end();
      }).catch((err) => {
        console.log("Error: ", err);
        res.status(500).json({ err: JSON.stringify(err) });
        res.end();
      });
    }
    else{
      res.status(200).json({ activeSub: false });
      res.end();
    }
  }).catch((err) => {
    console.log("Error: ", err);
    res.status(500).json({ err: JSON.stringify(err) });
    res.end();
  });
});

router.post('/cpf', function (req, res, next) {
  let customer_cpf = req.body.cpf;
  if (!(cpf.isValid(customer_cpf) || cnpj.isValid(customer_cpf))) {
    res.status(200).json({ valido: false, error: 'CPF/CNPJ inválido' })
    res.end();
    return
  }
  res.status(200).json({ valido: true })
  res.end();
  return
})

router.post('/', function (req, res, next) {
  try {
    let bodyObj = req.body;

    if (bodyObj.customer.id == undefined) {
      errorHandler('Campo usuário indefinido', res);
      return;
    }

    if (bodyObj.plan == undefined) {
      errorHandler('Campo plano indefinido', res);
      return;
    }

    if (bodyObj.customer.email == undefined) {
      errorHandler('Campo Email indefinido', res);
      return;
    }

    if (bodyObj.customer.profile == undefined) {
      errorHandler('Campo Perfil Selecionado indefinido', res);
      return;
    }

    if (cpf.isValid(bodyObj.customer.document_number) || cnpj.isValid(bodyObj.customer.document_number)) {
      console.log('CPF ou CNPJ válidos');
    }
    else {
      if (!cpf.isValid(bodyObj.customer.document_number)) {
        errorHandler('CPF inválido', res);
        return;
      }

      if (!cnpj.isValid(bodyObj.customer.document_number)) {
        errorHandler('CPNJ inválido', res);
        return;
      }
    }

    req.session.body = bodyObj;

    const query = "code=" + bodyObj.customer.account;
    console.log(`\nQuery: ${query}\n`);



    client.get({ uri: 'customers' }, query).then((data) => {
      if (data.customers.length > 0) {
        console.log('Usuário já cadastrado');

        subscriptions(data.customers[0], bodyObj, res, req);
      }
      else {
        console.log('Cadastrando o usuário');
        let phone = bodyObj.customer.phone.replace("(", '').replace(")", '').replace(" ", '').replace("-", '');

        const newCustomer = {
          code: bodyObj.customer.account,
          name: bodyObj.customer.name,
          email: bodyObj.customer.email,
          registry_code: bodyObj.customer.document_number.replace(/[.-]+/g, "").trim(),
          "address": {
            "street": bodyObj.customer.address.street,
            "number": bodyObj.customer.address.number,
            "zipcode": bodyObj.customer.address.zipcode,
            "city": bodyObj.customer.address.city,
            "state": bodyObj.customer.address.state,
            "neighborhood": bodyObj.customer.address.neighborhood,
            "additional_details": bodyObj.customer.address.additional_details,
            "country": "BR"
          },
          "phones": [
            {
              "phone_type": "mobile",
              "number": "55" + phone,
            }
          ]
        };

        client.post({ uri: 'customers' }, newCustomer).then((data) => {
          console.log("Usuário criado com sucesso", JSON.stringify(data));

          subscriptions(data.customer, bodyObj, res, req);

        }).catch((err) => {
          console.log("Error ao criar o usuário", JSON.stringify(err));
          res.status(500).json({ errorList: JSON.stringify(err.errors), error: JSON.stringify(err.errors) });
          res.end();
        });

      }
      console.log('success', data);

      const cust_id = data.customers[0].id;
      console.log(cust_id);
      // TODO: Problema 1
      client.get({ uri: 'subscriptions' }, `customer_id=${cust_id}`).then((xdata) => {
        console.log(xdata.subscriptions[0].metadata);
      }).catch((xerr) => {
        console.error("Xerror:", xerr);
      });
    }).catch((err) => {
      console.error('error', err);
    });


  } catch (err) {
    errorHandler(err, res);
  }


});



subscriptions = (customer, bodyObj, res, req) => {
  const sub = {
    "metadata": {
      "userId": bodyObj.customer.id,
      "accountId": bodyObj.customer.account,
      "profile": bodyObj.customer.profile,
      "name": bodyObj.plan.Name,
      "price": bodyObj.plan.Price,
      "cupom": bodyObj.plan.discountName
    },
    "plan_id": bodyObj.plan.IdPagarme,
    "customer_id": customer.id,
    "installments": bodyObj.card.installments,
    "payment_method_code": bodyObj.card.number != "" ? "credit_card" : "bank_slip",
  };

  //--- aplica o desconto se o usuário colocou o cupom
  if (bodyObj.plan.discount !== undefined && bodyObj.plan.discount > 0) {
    sub["product_items"] = [
      {
        "product_id": bodyObj.plan.IdProduct,
        "discounts": [{
          "discount_type": "percentage",
          "percentage": bodyObj.plan.discount
        }]
      }
    ];
  }

  if (sub.payment_method_code == "credit_card") {
    sub.payment_profile = {
      "holder_name": bodyObj.card.holderName,
      "card_expiration": bodyObj.card.expirationDate,
      "card_number": bodyObj.card.number,
      "card_cvv": bodyObj.card.cvv,
      "installments": bodyObj.card.installments,
      "payment_company_code": bodyObj.card.payment_company_code
    }
  }

  console.log("bodyObj: ", JSON.stringify(bodyObj));
  console.log("\nBREAK\n");

  client.post({ uri: 'subscriptions' }, sub).then((data) => {
    console.log('Assinatura realizada com sucesso');
    console.log("Assinatura: ", JSON.stringify(data));

    if (data.bill.status == "pending" && sub.payment_method_code == "credit_card") {
      res.status(200).json(data.bill.charges[0].last_transaction.status);
      res.end();
      return;
    }

    //redirect to >>>
    var page = data.bill.status != 'paid' ? '/waiting' : '/confirmation';

    if (sub.payment_method_code == "bank_slip") {
      page = "/waiting-payment";
      req.session.body.boletoUrl = data.bill.charges[0].print_url;
    }

    res.status(200).json({ successful: true, page });
    res.end();


  }).catch((err) => {
    console.log("Error", JSON.stringify(err));

    if (err.message) {
      res.status(500).json({ error: JSON.stringify(err) });
      res.end();
      return;
    };

    var errorList = [];
    err.errors.forEach(error => {
      if (error.parameter == 'payment_method_code') {
        errorList.push('Por favor preencha os dados corretamente.');
      }

      if (error.parameter == 'card_number') {
        errorList.push('Número do cartão inválido.');
      }

      if (error.parameter == 'holder_name') {
        errorList.push('Nome Impresso no cartão não pode ficar em branco.');
      }

      if (error.parameter == 'card_expiration') {
        errorList.push('Data de vencimento do cartão expirada.');
      }

      if (error.parameter == 'card_cvv') {
        errorList.push('Cód. Segurança inválido.');
      }

    });

    res.status(500).json({ errorList: JSON.stringify(err.errors), error: errorList });
    res.end();

  });

};

module.exports = router;
