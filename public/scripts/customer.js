$(function () {

    // PAGE 2 -->
    var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
    if (lstorage.customer.id == undefined || lstorage.customer.profile == undefined) {
        window.location.href = "https://app.socialrocket.com.br/dashboard";
    }

    if (lstorage.plan.IdPagarme == undefined) {
        window.location.href = '/?id=' + lstorage.customer.id + '&account=' + lstorage.customer.account + '&profile=' + lstorage.customer.profile;
    }

    $('.plan_extra').text(lstorage.planName);
    $('#selected-rec-price').text(lstorage.planRecPrice);
    $('#selected-price').text(lstorage.planPrice);
    $('#perfil').val(lstorage.customer.profile);

    $("#cep").mask('00000-000', { reverse: false });
    $("#phone").mask('(00) 00000-0000', { reverse: false });


    $("#cep").focusout(function () {
        //Aqui vai o código     
    });


    $("#cep").focusout(function () {
        //Início do Comando AJAX
        $.ajax({
            //O campo URL diz o caminho de onde virá os dados
            //É importante concatenar o valor digitado no CEP
            url: 'https://viacep.com.br/ws/' + $(this).val() + '/json/unicode/',
            //Aqui você deve preencher o tipo de dados que será lido,
            //no caso, estamos lendo JSON.
            dataType: 'json',
            //SUCESS é referente a função que será executada caso
            //ele consiga ler a fonte de dados com sucesso.
            //O parâmetro dentro da função se refere ao nome da variável
            //que você vai dar para ler esse objeto.
            success: function (resposta) {
                $("#endereco").attr("readonly", true);
                $("#bairro").attr("readonly", true);
                $("#cidade").attr("readonly", true);
                $("#uf").attr("readonly", true);
                if (resposta.erro == true) {
                    $.notify({
                        title: "Erro: ",
                        message: "CEP Inválido"
                    }, {
                            type: 'danger'
                        });
                }
                else if (resposta.logradouro == "" || resposta.bairro == "") {
                    $("#endereco").attr("readonly", false);
                    $("#bairro").attr("readonly", false);
                    $("#cidade").attr("readonly", false);
                    $("#uf").attr("readonly", false);
                }
                else {
                    //Agora basta definir os valores que você deseja preencher
                    //automaticamente nos campos acima.
                    $("#endereco").val(resposta.logradouro);
                    // $("#comp").val(resposta.complemento);
                    $("#bairro").val(resposta.bairro);
                    $("#cidade").val(resposta.localidade);
                    $("#uf").val(resposta.uf);
                    //Vamos incluir para que o Número seja focado automaticamente
                    //melhorando a experiência do usuário
                    $("#number").focus();
                }
            }
        });
    });

    $("#cpf").keydown(function (e) {
        try {
            if (e.keyCode == 9) return;
            $("#cpf").unmask();
        } catch (e) { }

        var tamanho = $("#cpf").val().length;

        if (tamanho < 12) {
            $("#cpf").mask("999.999.999-99999");
        } else {
            $("#cpf").mask("99.999.999/9999-99");
        }

        // ajustando foco
        var elem = this;
        setTimeout(function () {
            // mudo a posição do seletor
            elem.selectionStart = elem.selectionEnd = 10000;
        }, 0);
        // reaplico o valor para mudar o foco
        var currentValue = $(this).val();
        $(this).val('');
        $(this).val(currentValue);
    });

    $("#cep").blur(function () {
        var cep = this.value.replace(/[^0-9]/, "");
        if (cep.length != 8) {
            return false;
        }

        $.getJSON("http://viacep.com.br/ws/" + cep + "/json/", function (dadosRetorno) {
            try {
                $("#endereco").val(dadosRetorno.logradouro);
                $("#bairro").val(dadosRetorno.bairro);
                $("#cidade").val(dadosRetorno.localidade);
                $("#uf").val(dadosRetorno.uf);
            } catch (ex) { }
        });
    });

    $('#email').blur(function (e) {
        konduto(e.target.value);
    })

    $(".form").validate({
        rules: {
            name: {
                required: true,
            },
            cpf: {
                required: true,
                pattern: /(((\d{3}\.){2})\d{3}-\d{2})|(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/
            },
            email: {
                required: true,
                email: true
            },
            cep: {
                required: true,
                minlength: 9
            },
            phone: {
                required: true,
                minlength: 14
            },
            endereco: {
                required: true,
            },
            number: {
                required: true,
            },
            bairro: {
                required: true,
            },
            uf: {
                required: true,
                maxlength: 2
            },
            cidade: {
                required: true,
            }
        },
        messages: {
            name: {
                required: 'Campo obrigatório'
            },
            cpf: {
                required: 'Campo obrigatório',
                pattern: 'CPF/CNPJ inválido'
            },
            email: {
                required: 'Campo obrigatório',
                email: 'E-mail inválido'
            },
            cep: {
                required: 'Campo obrigatório',
                minlength: 'CEP inválido'
            },
            phone: {
                required: 'Campo obrigatório',
                minlength: 'Número inválido'
            },
            endereco: {
                required: 'Campo obrigatório'
            },
            number: {
                required: 'Campo obrigatório'
            },
            bairro: {
                required: 'Campo obrigatório'
            },
            uf: {
                required: 'Campo obrigatório',
            },
            cidade: {
                required: 'Campo obrigatório'
            }
        },
        submitHandler: function (form) {
            var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
            var formData = $('form.form').serializeArray().reduce(function (obj, item) {
                obj[item.name] = item.value;
                return obj;
            }, {});

            let cpf_obj = { 'cpf': formData.cpf };

            $.post('/cpf', cpf_obj, function (data) {
                if (data.valido == false) {
                    $.notify({
                        title: "Ops!!! ",
                        message: data.error
                    }, {
                            type: 'danger'
                        });
                } else {
                    lstorage.customer.name = formData.name;
                    lstorage.customer.document_number = formData.cpf;
                    lstorage.customer.email = formData.email;
                    lstorage.customer.phone = formData.phone;
                    lstorage.customer.address = {
                        neighborhood: formData.bairro,
                        street: formData.endereco,
                        number: formData.number,
                        zipcode: formData.cep.replace('-', ''),
                        city: formData.cidade,
                        state: $('#uf').val(),
                        additional_details: formData.comp
                    };

                    localStorage.setItem('srcheckout', JSON.stringify(lstorage));
                    window.location.href = "/payment";
                }
            });
        }
    });

    $(".step-2").click(function () {
        $('.form').submit();
    });

    $(".return-page").click(function () {
        var lstorage = JSON.parse(localStorage.getItem('srcheckout'));
        window.location.href = '/?id=' + lstorage.customer.id + '&account=' + lstorage.customer.account + '&profile=' + lstorage.customer.profile;
    });

});

function formatReal(int) {
    return int.toFixed(2).replace('.', ',');
}

function konduto(email) {
    var customerID = email; // define o ID do cliente 
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

}