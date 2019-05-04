var express = require('express');
var router = express.Router();
const mongo = require('../repository/mongo');

var request = require('request');
var queueManager = require('../queue/manager');
const constants = require('../constants.json');
const VINDI_APIKEY = process.env.VINDI_API_KEY || constants.VINDI_API_KEY;

var Vindi = require('vindi-js');
var client = new Vindi(VINDI_APIKEY);

function validateString(request) {
    return request != undefined && request !== '';
}

function validateInt(request) {
    return request != undefined && parseInt(request) > 0;
}

function validateBool(request) {
    return request != undefined;
}

function listByCollection(request) {
    return mongo.findDocuments(request, {}, { id: -1 });
}

function getLatestId(request) {
    var id = 1;
    if (request.length >= 1) {
        id = request[0].id + 1;
    }

    return id;
}

function findByDescription(request) {
    return mongo.findDocuments('coupon', { "description": request });
}

function add(request) {
    return mongo.insertOne('coupon', request);
}

router.post('/', function (req, res, next) {

    //--- validar se a description esta sendo passado no request
    if (!validateString(req.body.description)) {
        res.status(400).json({ successful: false, message: "description é obrigatório" });
        res.end();
    }

    //--- validar se o campo enabled esta sendo passado no request
    if (!validateBool(req.body.enabled)) {
        res.status(400).json({ successful: false, message: "enabled é obrigatório" });
        res.end();
    }

    //--- validar se 0 valor de desconto esta sendo passado no request
    if (!validateInt(req.body.discount)) {
        res.status(400).json({ successful: false, message: "discount é obrigatório ou esta inválido" });
        res.end();
    }

    //--- lista todos os registros do cupom
    listByCollection("coupon").then(listByCollectionResponse => {

        //--- busca o id
        var id = getLatestId(listByCollectionResponse);

        //--- pesquisa com a description do coupon
        findByDescription(req.body.description).then(findByDescriptionResponse => {

            //--- se não encontrou nenhum registro adiciona
            if (findByDescriptionResponse.length !== 1) {

                req.body.id = id;

                //--- adiciona o cupom
                add(req.body).then(addResponse => {
                    res.status(200).json({ successful: true, message: "cupom adicionado com sucesso" });
                    res.end();
                }).catch(err => {
                    console.log('erro para validar se o registro já existe', err);
                });
            } else {
                res.status(400).json({ successful: false, message: "cupom já cadastrado" });
                res.end();
            }

        }).catch(findByDescriptionError => {
            res.status(500).json({ successful: false, message: "falha ao adicionar o cupom", findByDescriptionError });
            res.end();
        });

    }).catch(listByCollectionError => {
        res.status(500).json({ successful: false, message: "falha ao adicionar o cupom" }, listByCollectionError);
        res.end();
    });
});

router.put('/', function (req, res, next) {

    //--- validar se o id esta sendo passado no  request
    if (!validateInt(req.body.id)) {
        res.status(400).json({ successful: false, message: "id é obrigatório" });
        res.end();
    }

    //--- validar se a description esta sendo passado no  request
    if (!validateString(req.body.description)) {
        res.status(400).json({ successful: false, message: "description é obrigatório" });
        res.end();
    }

    //--- validar se a description esta sendo passado no request
    if (!validateBool(req.body.enabled)) {
        res.status(400).json({ successful: false, message: "enabled é obrigatório" });
        res.end();
    }

    //--- validar se 0 valor de desconto esta sendo passado no request
    if (!validateInt(req.body.discount)) {
        res.status(400).json({ successful: false, message: "discount é obrigatório ou esta inválido" });
        res.end();
    }

    //--- pesquisa com a description do coupon
    findByDescription(req.body.description).then(findByDescriptionResponse => {

        if (findByDescriptionResponse.length == 1 && findByDescriptionResponse[0].id !== req.body.id) {
            res.status(400).json({ successful: false, message: "cupom já cadastrado" });
            res.end();
        }

        //--- atualiza o cupom
        mongo.updateOne('coupon', { "id": req.body.id }, req.body).then(data => {
            res.status(200).json({ successful: true, message: "cupom atualizado com sucesso" });
            res.end();
        }).catch(err => {
            res.status(500).json({ successful: false, message: err });
            res.end();
        });
    });
});

router.get("/", function (req, res, next) {
    //--- lista todos os cupons
    mongo.getAllDocumentsFromCollection("coupon").then(response => {
        res.status(200).json(response);
        res.end();
    }).catch(err => {
        res.status(500).json({ successful: false, message: err });
        res.end();
    });
});

router.get("/:description", function (req, res, next) {

    //--- obter cupom por id
    mongo.findDocuments("coupon", { "description": req.params.description }).then(response => {
        res.status(200).json(response);
        res.end();
    }).catch(err => {
        res.status(500).json({ successful: false, message: err });
        res.end();
    });
});

module.exports = router;