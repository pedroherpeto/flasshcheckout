$(function () {

    $(document).ready(function () {
        $.post('/assinatura', JSON.parse(localStorage.getItem('srcheckout')), function(data) {
            console.log(data);
            if (data.activeSub == true) {
                $('#subBlockBG').removeClass('hide');
                $('#subBlockInfo').removeClass('hide');
                $('#subBlockAssinatura').addClass("hide");
            }
            else {
                // $('.step-0')[0].attributes.disabled.value = "false";
                // $('.step-0')[0].attributes.style.value = "";
                // $('.step-0')[0].href = "#";
                $('#subBlockAssinatura').addClass("hide");
                $('#subBlockBG').addClass('hide');
            }

        }).catch(function(err){
            console.log("Erro Assinatura: ", err);
            // $('.step-0')[0].attributes.disabled.value = "false";
            // $('.step-0')[0].attributes.style.value = "";
            // $('.step-0')[0].href = "#";
            $('#subBlockAssinatura').addClass("hide");
            $('#subBlockBG').addClass('hide');
            window.location.reload(false);
        });
    });

    $(".help").click(function () {
        $('#jivo-iframe-container').css("cssText", "height: 407px !important;");
        $('#jivo_action').css('display', 'block');
        $('#jivo-drag-handle').css('display', 'block');

        // $('#jivo_action').addClass('testejivo');
    });

    if (window.location.pathname == '/') {
        var search = searchToObject();

        if (search.id == undefined || search.profile == undefined || search.account == undefined) {
            window.location.href = "https://app.socialrocket.com.br/dashboard";
        }

        localStorage.setItem('srcheckout', JSON.stringify({ customer: search }));
        var activeThisPlan = planConfig.filter(function(i){return i.Name == 'Trimestral';})[0];


        $('#selected-plan').text(activeThisPlan.Name);
        $('#selected-rec-price').text(formatReal(activeThisPlan.RecPrice));
        $('#selected-price').text(formatReal(activeThisPlan.Price));
        $('#trimestal.price').text(formatReal(activeThisPlan.Price));

        $('#mensal .pre-price .value').text(formatReal(planConfig.filter(function(i){return i.Name == 'Mensal'})[0].Price));
        $('#anual .pre-price .value').text(formatReal(planConfig.filter(function(i){return i.Name == 'Anual'})[0].Price));

        $('#mensal .price').text(formatReal(planConfig.filter(function(i){return i.Name == 'Mensal'})[0].RecPrice));
        $('#anual .price').text(formatReal(planConfig.filter(function(i){return i.Name == 'Anual'})[0].RecPrice));

        // Active plan
        activeThisPlan.Active = true;
    }


    var customerID = searchToObject().account || JSON.parse(localStorage.getItem('srcheckout')).customer.account; // define o ID do cliente 
    (function () {
        var period = 300;
        var limit = 20 * 1e3;
        var nTry = 0;
        var intervalID = setInterval(function () { // loop para retentar o envio         
            var clear = limit / period <= ++nTry;
            if ((typeof (Konduto) !== "undefined") &&
                (typeof (Konduto.setCustomerID) !== "undefined")) {
                window.Konduto.setCustomerID(customerID); // envia o ID para a Konduto             
                clear = true;
            }
            if (clear) {
                clearInterval(intervalID);
            }
        }, period);
    })(customerID);




    $('.pln').click(function () {
        $('.plans.active').removeClass('active');
        $(this).parent().addClass('active');

        //Disable last plan
        planConfig.filter(function(i) {return i.Active == true})[0].Active = false;

        // PLANO
        var plan = $(this).parent().find('.h5').contents()[0];
        var activeThisPlan = planConfig.filter(function(i) {return i.Name == plan.data})[0];

        $(this).parent().find('input').prop('checked', true);

        $('#selected-plan').text(activeThisPlan.Name);
        $('#selected-rec-price').text(formatReal(activeThisPlan.RecPrice));
        $('#selected-price').text(formatReal(activeThisPlan.Price));


        //Active plan
        activeThisPlan.Active = true;

        $('#Direct .price').text(formatReal(activeThisPlan.extraPlan.filter(function(i) {return i.Name == (activeThisPlan.Name + '+' + 'Direct')})[0].Price - activeThisPlan.Price));
        $('#Gerenciador .price').text(formatReal(activeThisPlan.extraPlan.filter(function(i) {return i.Name == (activeThisPlan.Name + '+' + 'Gerenciador')})[0].Price - activeThisPlan.Price));
        $('#Pro .price').text(formatReal(activeThisPlan.extraPlan.filter(function(i) {return i.Name == (activeThisPlan.Name + '+' + 'Pro')})[0].Price - activeThisPlan.Price));
        // $('#Prime .price').text(formatReal(activeThisPlan.extraPlan.filter(function(i) {return i.Name == (activeThisPlan.Name + '+' + 'Prime')})[0].Price - activeThisPlan.Price));


        if (activeThisPlan.Name == "Mensal") {
            $('#Direct .month').text('por mês');
            $('#Gerenciador .month').text('por mês');
            $('#Pro .month').text('por mês');
            if (($('.extra-show').attr('data-click-state') == 1)) {
                $('#Prime').show();
            }
        }

        if (activeThisPlan.Name == "Trimestral") {
            $('#Direct .month').html('por <br> trimestre');
            $('#Gerenciador .month').html('por trimestre');
            $('#Pro .month').html('por <br> trimestre');
            $('#Prime').hide();
        }

        if (activeThisPlan.Name == "Anual") {
            $('#Direct .month').text('por ano');
            $('#Gerenciador .month').text('por ano');
            $('#Pro .month').text('por ano');
            $('#Prime').hide();        
        }

        activeThisPlan.extraPlan.forEach(i => {
            i.Active = false;
        });

        $('#Direct').removeClass('active');
        $('#Gerenciador').removeClass('active');
        $('#Pro').removeClass('active');
        $('#Prime').removeClass('active');


    });




    $('.turbine').click(function () {
        var box = $(this).parent();

        var activePlan = planConfig.filter(function(i){return i.Active == true})[0];


        // setar todos planos como false
        activePlan.extraPlan.filter(function(f){return f.Active = false});


        if (box.hasClass('active')) {
            box.removeClass('active');
            box.find('input').prop('checked', false);
        }
        else {

            box.find('input').prop('checked', true);
            box.addClass('active');
        }

        var extraPlanActive = '';
        $('.extra-plans.active').each(function (index, ele) {
            extraPlanActive += index >= 1 ? '+' + ele.id : ele.id
        });

        if(extraPlanActive.indexOf("Prime") !== -1){
            extraPlanActive = "Prime";
        }

        if (extraPlanActive) {
            activePlan.extraPlan.filter(function(i) {return i.Name == activePlan.Name + '+' + extraPlanActive})[0].Active = true
        }

        var recValue = 1;
        if (activePlan.Name == 'Trimestral') {
            recValue = 3;
        }

        if (activePlan.Name == 'Anual') {
            recValue = 12;
        }

        var extraPlan = activePlan.extraPlan.filter(function(i){return i.Active == true});
        if (extraPlan.length > 0) {
            $('#selected-price').text(formatReal(activePlan.extraPlan.filter(function(f){return f.Active == true})[0].Price));
            $('#selected-rec-price').text(formatReal(activePlan.extraPlan.filter(function(f){return f.Active == true})[0].Price / recValue));
        }
        else {
            $('#selected-price').text(formatReal(activePlan.Price));
            $('#selected-rec-price').text(formatReal(activePlan.RecPrice));
        }

        $('#selected-plan').text(extraPlan.length > 0 ? extraPlan.map(function(n){return n.Description})[0] : activePlan.Name);

    });



    $(".extra-show").click(function () {

        $('.extra-plans').toggle();
        if (planConfig.filter(function(i){return i.Active == true})[0].Name !== "Mensal"){
            $("#Prime").hide();
        }
        // $('.turbine-box').css('height','111px');
        if ($(this).attr('data-click-state') == 1) {
            $(this).attr('data-click-state', 0);
            $('.turbine-box').css('height', '0px');
        } else {
            $(this).attr('data-click-state', 1);
            $('.turbine-box').css('height', '111px');
        }

    });


    $(".step-0").click(function () {
        // if (!($(".step-0")[0].attributes.disabled.value == "true")) {
            var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
            var activePlan = planConfig.filter(function(i){return i.Active == true})[0];
            var hasExtraPlan = activePlan.extraPlan.filter(function(i){return i.Active == true});

            lstorage.plan = hasExtraPlan.length > 0 ? hasExtraPlan[0] : activePlan;
            lstorage.planName = hasExtraPlan.length > 0 ? hasExtraPlan[0].Description : activePlan.Name;
            lstorage.planRecPrice = $('#selected-rec-price').text();
            lstorage.planPrice = $('#selected-price').text();
            localStorage.setItem('srcheckout', JSON.stringify(lstorage));

            window.location.href = "/customer";
        // }
    });

});

var planConfig = [
    {
        "IdProduct": 271504,
        "IdPagarme": 72550,
        "Name": "Mensal",
        "Active": false,
        "RecPrice": 99.00,
        "Price": 99.00,
        "extraPlan": [
            {
                "IdProduct": 309242,
                "IdPagarme": 72551,
                "Name": "Mensal+Direct",
                "Description": "Mensal e Direct",
                "Price": 154.00,
            }, {
                "IdProduct": 309247,
                "IdPagarme": 72552,
                "Name": "Mensal+Gerenciador",
                "Description": "Mensal e Gerenciador",
                "Price": 124.00,
            }, {
                "IdProduct": 309241,
                "IdPagarme": 72554,
                "Name": "Mensal+Pro",
                "Description": "Mensal e Agendamento Pro",
                "Price": 129.00,
            }, {
                "IdProduct": 309245,
                "IdPagarme": 72555,
                "Name": "Mensal+Direct+Gerenciador",
                "Description": "Mensal, Direct e Gerenciador",
                "Price": 179.00,
            }, {
                "IdProduct": 309243,
                "IdPagarme": 72556,
                "Name": "Mensal+Direct+Pro",
                "Description": "Mensal, Direct e Agendamento Pro",
                "Price": 184.00,
            }, {
                "IdProduct": 309248,
                "IdPagarme": 72559,
                "Name": "Mensal+Gerenciador+Pro",
                "Description": "Mensal, Gerenciador e Agendamento Pro",
                "Price": 154.00,
            }, {
                "IdProduct": 309246,
                "IdPagarme": 72557,
                "Name": "Mensal+Direct+Gerenciador+Pro",
                "Description": "Mensal, Direct, Gerenciador e Agendamento Pro",
                "Price": 209.00,
            },
            {
                "IdProduct": 403424,
                "IdPagarme": 93304,
                "Name": "Mensal+Prime",
                "Description": "Socialrocket Prime",
                "Price": 499.00,
            }
        ]
    },
    {
        "IdProduct": 271510,
        "IdPagarme": 72563,
        "Name": "Trimestral",
        "Active": true,
        "RecPrice": 89.10,
        "Price": 267.30,
        "extraPlan": [
            {
                "IdProduct": 309257,
                "IdPagarme": 72564,
                "Name": "Trimestral+Direct",
                "Description": "Trimestral e Direct",
                "Price": 415.80,
            }, {
                "IdProduct": 309263,
                "IdPagarme": 72568,
                "Name": "Trimestral+Gerenciador",
                "Description": "Trimestral e Gerenciador",
                "Price": 334.80,
            }, {
                "IdProduct": 309256,
                "IdPagarme": 72569,
                "Name": "Trimestral+Pro",
                "Description": "Trimestral e Agendamento Pro",
                "Price": 348.30,
            }, {
                "IdProduct": 309260,
                "IdPagarme": 72572,
                "Name": "Trimestral+Direct+Gerenciador",
                "Description": "Trimestral, Direct e Gerenciador",
                "Price": 483.30,
            }, {
                "IdProduct": 309258,
                "IdPagarme": 72571,
                "Name": "Trimestral+Direct+Pro",
                "Description": "Trimestral, Direct e Agendamento Pro",
                "Price": 496.80,
            }, {
                "IdProduct": 309264,
                "IdPagarme": 72574,
                "Name": "Trimestral+Gerenciador+Pro",
                "Description": "Trimestral, Gerenciador e Agendamento Pro",
                "Price": 415.80,
            }, {
                "IdProduct": 309265,
                "IdPagarme": 72570,
                "Name": "Trimestral+Direct+Gerenciador+Pro",
                "Description": "Trimestral, Direct, Gerenciador e Agendamento Pro",
                "Price": 564.30,
            }
            // {
            //     "IdProduct": 403424,
            //     "IdPagarme": 93304,
            //     "Name": "Socialrocket Prime",
            //     "Description": "Socialrocket Prime",
            //     "Price": 499.00,
            // }
        ]
    },
    {
        "IdProduct": 271517,
        "IdPagarme": 72575,
        "Name": "Anual",
        "Active": false,
        "RecPrice": 74.25,
        "Price": 891.00,
        "extraPlan": [
            {
                "IdProduct": 309267,
                "IdPagarme": 72576,
                "Name": "Anual+Direct",
                "Description": "Anual e Direct",
                "Price": 1386.00,
            }, {
                "IdProduct": 313517,
                "IdPagarme": 72577,
                "Name": "Anual+Gerenciador",
                "Description": "Anual e Gerenciador",
                "Price": 1116.00,
            }, {
                "IdProduct": 309266,
                "IdPagarme": 72578,
                "Name": "Anual+Pro",
                "Description": "Anual e Agendamento Pro",
                "Price": 1161.00,
            }, {
                "IdProduct": 309269,
                "IdPagarme": 72579,
                "Name": "Anual+Direct+Gerenciador",
                "Description": "Anual, Direct e Gerenciador",
                "Price": 1611.00,
            }, {
                "IdProduct": 309268,
                "IdPagarme": 72582,
                "Name": "Anual+Direct+Pro",
                "Description": "Anual, Direct e Agendamento Pro",
                "Price": 1656.10,
            }, {
                "IdProduct": 309275,
                "IdPagarme": 72584,
                "Name": "Anual+Gerenciador+Pro",
                "Description": "Anual, Gerenciador e Agendamento Pro",
                "Price": 1386.00,
            }, {
                "IdProduct": 309270,
                "IdPagarme": 72585,
                "Name": "Anual+Direct+Gerenciador+Pro",
                "Description": "Anual, Direct, Gerenciador e Agendamento Pro",
                "Price": 1881.00,
            }
            // {
            //     "IdProduct": 403424,
            //     "IdPagarme": 93304,
            //     "Name": "Socialrocket Prime",
            //     "Description": "Socialrocket Prime",
            //     "Price": 499.00,
            // }
        ]
    }
];




function searchToObject() {
    var pairs = window.location.search.substring(1).split("&"),
        obj = {},
        pair,
        i;

    for (i in pairs) {
        if (pairs[i] === "") continue;

        pair = pairs[i].split("=");
        obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return obj;
}

function formatReal(int) {
    return int.toFixed(2).replace('.', ',');
}


