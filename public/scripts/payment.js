$(function () {

    var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
    if (lstorage.customer.id == undefined || lstorage.customer.profile == undefined) {
        window.location.href = "https://app.socialrocket.com.br/dashboard";
    }

    if (lstorage.plan.IdPagarme == undefined) {
        window.location.href = '/?id=' + lstorage.customer.id + '&profile=' + lstorage.customer.profile;
    }

    $('.plan_extra').text(lstorage.planName);
    $('#selected-rec-price').text(lstorage.planRecPrice);
    $('#selected-price').text(lstorage.planPrice);
    $('#perfil').val(lstorage.customer.profile);

    var parcelas = 0;
    var paymentType = 'card';
    var parcelasDescription = [];

    if (lstorage.planName.indexOf('Anual') != -1) {
        parcelas = 12;
    }
    if (lstorage.planName.indexOf('Trimestral') != -1) {
        parcelas = 3;
    }

    for (var i = 1; i <= parcelas; i++) {
        var value = lstorage.planPrice.replace(',', '.') / i;
        parcelasDescription.push({ val: i, text: i + 'x de R$ ' + value.toFixed(2).replace('.', ',') });
    }

    if (parcelas > 0) {
        $('.parcelamento').show();
    }

    var sel = $('<select name="parcelamento">').appendTo('.parcelamento .select');
    $(parcelasDescription).each(function () {
        sel.append($("<option>").attr('value', this.val).text(this.text));
    });


    // PAGE 3 -->
    $(".form2").validate({
        rules: {
            cardnumber: {
                required: '#payment[value="card"]:checked',
                minlength: 19
            },
            cardname: {
                required: '#payment[value="card"]:checked',
            },
            month: {
                required: '#payment[value="card"]:checked',
            },
            year: {
                required: '#payment[value="card"]:checked',
            },
            cvv: {
                required: '#payment[value="card"]:checked',
            }
        },
        messages: {
            cardnumber: {
                required: 'Campo obrigatório',
                minlength: 'Número do cartão inválido'
            },
            cardname: {
                required: 'Campo obrigatório'
            },
            month: {
                required: 'Campo obrigatório'
            },
            year: {
                required: 'Campo obrigatório'
            },
            cvv: {
                required: 'Campo obrigatório',
            }
        },
        submitHandler: function (form) {
            var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
            var formData = $('form.form2').serializeArray().reduce(function (obj, item) {
                obj[item.name] = item.value;
                return obj;
            }, {});

            lstorage.card = {
                number: formData.payment != 'Boleto' ? formData.cardnumber : undefined,
                holderName: formData.payment != 'Boleto' ? formData.cardname : undefined,
                expirationDate: formData.payment != 'Boleto' ? formData.month + '-' + formData.year : undefined,
                cvv: formData.payment != 'Boleto' ? formData.cvv : undefined,
                installments: formData.parcelamento,
                payment_company_code: formData.payment_company_code
            };

            $('#load').hide();
            $('#loading').show();
            $.post('/', lstorage, function (data) {
                if (data.successful == true) {
                    window.location.href = data.page;
                }
                else {
                    // $('#loading').hide();
                    // $('#load').show();
                    // $.notify({
                    //     title: "Ops!!! ",
                    //     message: data == "rejected" ? "Pagamento não autorizado, entre em contato com o time da Socialrocket." : data
                    // }, {
                    //         type: 'danger'
                    //     });
                    window.location.replace("/waiting");
                }
            }).catch(function (e) {
                /* $('#loading').hide();
                $('#load').show();
                e.responseJSON.error.forEach(error => {
                    $.notify({
                        title: "Error: ",
                        message: error
                    }, {
                            type: 'danger'
                        });
                }); */
                window.location.replace("/waiting");


            });
        }
    });

    $('#card').click(function () {
        $(this).addClass('active2');
        $('#boleto').removeClass('active2');
        $('#card-payment').show();

    });

    $('#boleto').click(function () {
        $(this).addClass('active2');
        $('#card').removeClass('active2');
        $('#card-payment').hide();
        $('#card-number').val('');
        $('#card-name').val('');
        $('#cvv').val('');
        paymentType = 'Boleto';
    });

    $(".efetuarPag").click(function () {
        if (paymentType == 'card') {
            var card_number_value = document.querySelector('#card-number').value;
            var card_name_value = document.querySelector('#card-name').value;
            var card_cvv_value = document.querySelector('#cvv').value;
            if (card_number_value == "" || card_name_value == "" || card_cvv_value == "") {
                $.notify({
                    title: "Ops!!! ",
                    message: "Por favor preencha os dados do cartão corretamente."
                }, {
                        type: 'danger'
                    });

                return;
            }
        }
        $('#myModal').modal("show");
    })

    $(".step-3").click(function () {

        $('.form2').submit();
    });

    function showMessageCouponNotFind() {
        $.notify({
            message: "Cupom não encontrado",
            type: 'danger'
        });
    };


    function showMessageCouponSuccess() {
        $.notify({
            title: "Parabéns! ",
            message: "Cupom aplicado com sucesso",
            type: 'success'
        });
    };

    function disabledButtonCoupon() {
        $(".cupom-button").prop('disabled', true)
        $(".cupom-button").text("Ativando");
    }

    function enabledButtonCoupon() {
        $(".cupom-button").prop('disabled', false)
        $(".cupom-button").text("Ativar");
    }

    function recalculateTotalValueWithDiscount(discount) {
        var totalValue = lstorage.planPrice.replace(',', '.');
        var totalValueWithDiscount = totalValue - ((totalValue * discount) / 100);
        var total = totalValueWithDiscount.toFixed(2);
        $('#selected-price').text(total.replace('.', ','));
    }

    function recalculatePaymentWithDiscount(discount) {
        var parcelas = 0;
        var parcelasDescription = [];

        if (lstorage.planName.indexOf('Anual') != -1) {
            parcelas = 12;
        }
        if (lstorage.planName.indexOf('Trimestral') != -1) {
            parcelas = 3;
        }

        var totalValue = lstorage.planPrice.replace(',', '.');
        var totalValueWithDiscount = totalValue - ((totalValue * discount) / 100);
        for (var i = 1; i <= parcelas; i++) {
            var value = totalValueWithDiscount / i;
            parcelasDescription.push({ val: i, text: i + 'x de R$ ' + value.toFixed(2) });
        }

        if (parcelas > 0) {
            $('.parcelamento').show();
        }

        $('.select').html('');

        var sel = $('<select name="parcelamento">').appendTo('.parcelamento .select');
        $(parcelasDescription).each(function () {
            sel.append($("<option>").attr('value', this.val).text(this.text));
        });
    }

    $(".cupom-button").click(function () {

        //--- recupera o cupom digitado
        var coupon = $('.cupom').val();

        //--- verifica se esta sendo passado o cupom
        if (coupon === '') {
            return;
        }

        //--- loading
        disabledButtonCoupon();

        //--- busca no banco o cupom digitado
        $.get('/coupon/' + coupon, function (data) {

            //--- se o cupom esta válido, exibe o desconto, caso contrário exibe a mensagem de cupom inválido
            if (data.length == 1 && data[0].enabled === true) {

                //--- exibir o desconto na tela
                $('.discount').text('Desconto: ' + parseFloat(data[0].discount) + '%');

                //--- recalcula o valor total com o desconto
                recalculateTotalValueWithDiscount(parseFloat(data[0].discount));

                //--- recalcula a forma de pagamento
                recalculatePaymentWithDiscount(parseFloat(data[0].discount));

                //--- adiciona o valor de desconto no localstorage
                lstorage["plan"]["discountName"] = coupon;
                lstorage["plan"]["discount"] = parseFloat(data[0].discount);
                localStorage.setItem('srcheckout', JSON.stringify(lstorage));

                //--- mostra a mensagem de cupom aplicado com sucesso
                showMessageCouponSuccess();
            }
            else {
                //-- volta para o valor sem cupom
                $('#selected-price').text(lstorage.planPrice);
                $('.discount').text('');

                //--- recalcula a forma de pagamento sem desconto
                recalculatePaymentWithDiscount(0);

                //--- adiciona o valor de desconto no localstorage
                lstorage["plan"]["discount"] = 0;
                localStorage.setItem('srcheckout', JSON.stringify(lstorage));

                //--- exibe a mensagem de cupom inválido quando der erro    
                showMessageCouponNotFind();
            }

            //--- habilita o botão de ativar cupom
            enabledButtonCoupon();

        }).catch(function (e) {

            //-- volta para o valor sem cupom
            $('.discount').text('');
            $('#selected-price').text(lstorage.planPrice);

            //--- recalcula a forma de pagamento sem desconto
            recalculatePaymentWithDiscount(0);

            //--- exibe a mensagem de cupom inválido quando der erro
            showMessageCouponNotFind();

            //--- adiciona o valor de desconto no localstorage
            lstorage["plan"]["discount"] = 0;
            localStorage.setItem('srcheckout', JSON.stringify(lstorage));

            //--- habilita o botão de ativar cupom
            enabledButtonCoupon();
        });
    });
});

$('.button-payment-card a').click(function () {
    $('#payment.active2').removeClass('active2');
    $(this).closest().addClass('active2');
});


function mascara(o, f) {
    v_obj = o
    v_fun = f
    setTimeout("execmascara()", 1)
}

function execmascara() {
    v_obj.value = v_fun(v_obj.value)
}

function mcc(v) {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{4})(\d)/g, "$1.$2");
    v = v.replace(/^(\d{4})\.(\d{4})(\d)/g, "$1.$2.$3");
    v = v.replace(/^(\d{4})\.(\d{4})\.(\d{4})(\d)/g, "$1.$2.$3.$4");
    return v;
}

function id(el) {
    return document.getElementById(el);
}

window.onload = function () {
    if (!id('card-number')) return;
    id('card-number').onkeypress = function () {
        mascara(this, mcc);
    }
}
$(".return-page").click(function () {
    var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
    window.location.href = '/customer';
});

function formatReal(int) {
    return int.toFixed(2).replace('.', ',');
}
