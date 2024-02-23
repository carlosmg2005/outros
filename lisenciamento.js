/// <reference path="se_Helpers.js" />
function checkLiberacao(onSave) {

    var responsavel = null;
    var formatosLicenciamento = {
        "CLIENTE": 1,
        "INTEGRADORCLIENTE": 2,
        "DISTRIBCLIENTE": 3,
        "DISTRIBINTEGRADORCLIENTE": 4,
        "CLIENTEHOSPEDADO": 5
    }
    var NotificaionLevel = "ERROR";
    var NotificationIDDataFaturamento = "datafaturamento";
    // Xrm.Page.ui.clearFormNotification(NotificationIDDataFaturamento);    
    var ODataQuery = "";
    var formatoLicenciamento = Xrm.Page.getAttribute("se_formatodolicenciamento").getValue();
    var tipoVerificao = null;

    if (formatoLicenciamento == formatosLicenciamento.CLIENTE) {
        responsavel = Xrm.Page.getAttribute("se_contaid").getValue();
        tipoVerificao = "Cliente"
    }
    if (formatoLicenciamento == formatosLicenciamento.INTEGRADORCLIENTE) {
        responsavel = Xrm.Page.getAttribute("se_integradorid").getValue();
        tipoVerificao = "Integrador"
    }
    if (formatoLicenciamento == formatosLicenciamento.CLIENTEHOSPEDADO) {
        responsavelField = getResponsavelClienteHospedado();
        responsavel = responsavelField.getValue();
        tipoVerificao = getTipoVerificacaoClienteHospedado();
    }

    if (responsavel != null) {
        Xrm.Page.ui.clearFormNotification(NotificationIDDataFaturamento);
        hasDataFaturamento = HasDataFaturamento(responsavel);

        if (!hasDataFaturamento) {
            Xrm.Page.ui.setFormNotification("É preciso definir a data de faturamento do " + tipoVerificao + " " + responsavelName + " antes de prosseguir.", NotificaionLevel, NotificationIDDataFaturamento);
            if (formatoLicenciamento != formatosLicenciamento.CLIENTEHOSPEDADO) {
                if (tipoVerificao == "Cliente") {
                    Xrm.Page.getAttribute("se_contaid").setValue(null);
                }
                if (tipoVerificao == "Integrador") {
                    Xrm.Page.getAttribute("se_integradorid").setValue(null);
                }
                if (tipoVerificao == "Distribuidor") {
                    Xrm.Page.getAttribute("se_distribuidorid").setValue(null);
                }
            }
            else {
                if (onSave) {
                    responsavelField.setValue(null);
                }
            }
            return false;
        }
    }
    return true;
}

function getResponsavelClienteHospedado() {
    responsavel = Xrm.Page.getAttribute("se_distribuidorid");
    if (responsavel.getValue() == null) {
        responsavel = Xrm.Page.getAttribute("se_integradorid");
        if (responsavel.getValue() == null) {
            responsavel = Xrm.Page.getAttribute("se_contaid");
        }
    }
    return responsavel;
}

function getTipoVerificacaoClienteHospedado() {
    tipoVerificacao = "Distribuidor";
    responsavel = Xrm.Page.getAttribute("se_distribuidorid");
    if (responsavel.getValue() == null) {
        tipoVerificacao = "Integrador";
        responsavel = Xrm.Page.getAttribute("se_integradorid");
        if (responsavel.getValue() == null) {
            tipoVerificacao = "Cliente";
            responsavel = Xrm.Page.getAttribute("se_contaid");
        }
    }
    else {

    }
    return tipoVerificacao;
}


function HasDataFaturamento(responsavel) {
    responsavelId = responsavel[0].id;
    responsavelName = responsavel[0].name
    ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca,Se_cobrancadia1,Se_cobrancacancelada,Se_cobrancadia15,Se_cobrancaimediata&$filter=AccountId eq guid'" + responsavelId + "'";
    var info_conta = GetCrmEntityRecords(ODataQuery);
    return (
			info_conta.results[0].Se_cobrancadia1 == true ||
			info_conta.results[0].Se_cobrancadia15 == true ||
			info_conta.results[0].Se_cobrancaimediata == true ||
			info_conta.results[0].Se_cobrancacancelada == true);
}

function OnSaveCliente() {
    checkLiberacao();
    var NotificaionLevel = "ERROR";
    var NotificationIDLiberacao = "faturamentocliente";
    var ODataQuery = "";
    Xrm.Page.ui.clearFormNotification("1");

    var lookupConta = new Array;
    lookupConta = Xrm.Page.getAttribute("se_contaid").getValue();

    if (lookupConta != null) {
        // VERIFICAÇÃO DE CLIENTE:
        // LINCENÇA LIBERADA: SIM/NÃO
        //BUSCA DE INFORMAÇÕES DO CLIENTE
        var cliente = lookupConta[0].id;
        var nomeCliente = lookupConta[0].name

        ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca,Se_cobrancadia1,Se_cobrancacancelada,Se_cobrancadia15,Se_cobrancaimediata&$filter=AccountId eq guid'" + cliente + "'";
        var info_conta = GetCrmEntityRecords(ODataQuery);

        is_liberado = info_conta.results[0].Se_liberalicenca;
		cnpj = Xrm.Page.getAttribute("se_cnpj").getValue();
        if (!is_liberado) {
            Xrm.Page.ui.clearFormNotification("1");
            Xrm.Page.ui.setFormNotification("ATENÇÃO! O cliente " + nomeCliente + " NÃO ESTÁ liberado para criação de licenças. Por favor, verifique a conta para validar a liberação.", NotificaionLevel, "1");
            Xrm.Page.getAttribute("se_contaid").setValue(null);
            Xrm.Page.getAttribute("se_cnpj").setValue(null);
            return;
        }

		var cnpjAux = info_conta.results[0].Se_Cnpj;       
		
		if(cnpj != cnpjAux)
		{
			cnpj = info_conta.results[0].Se_Cnpj;
			Xrm.Page.getAttribute("se_cnpj").setSubmitMode("always");
			Xrm.Page.getAttribute("se_cnpj").setValue(CNPJ_CPF(cnpj));
		}        
    }

}

function OnChangeCliente() {

    checkLiberacao();
    var NotificaionLevel = "ERROR";
    var NotificationIDLiberacao = "faturamentocliente";
    var ODataQuery = "";
    Xrm.Page.ui.clearFormNotification("1");

    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_contaid").getValue();

    if (fieldCliente == lookupContaHistorico) {
        return;
    }
    else {
        fieldCliente = lookupContaHistorico;
    }

    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
        // Xrm.Page.ui.clearFormNotification(1);
		
        if (InfoCobranca.results.length != 0) {
            //DescricaoAcordo = InfoCobranca[0].getValue('se_descricaodeacordo');
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
			if(statecode.Value == 0)
			{
				alert("Histórico de Acordo - CLIENTE\n\n" + DescricaoAcordo);
			}
            //Xrm.Page.ui.setFormNotification(DescricaoAcordo,"INFO","1");
            //window.setTimeout(function () {
            //    Alert.show("Histórico de Acordo - CLIENTE", null, null, null, 1000, 500);
            //    var $frame = parent.$("#InlineDialog_Iframe");
            //    $frame.load(function () {
            //    if ($frame[0].contentWindow != null) {
            //        var $message = $($frame[0].contentWindow.document).find("#message");
            //        $message.empty().append('<br/><textarea readonly="true" id="k2m_HistoricoDeAcordo" style="width:950px;height:380px" />');
            //        var $txtArea = $($frame[0].contentWindow.document).find("#k2m_HistoricoDeAcordo");
            //        //$(execResponse.Trace).each(function () {
            //        //   $txtArea.append(this + "\n");
            //        //});
            //        var strDescricaoAcordo = DescricaoAcordo.replace(/(?:\r\n|\r|\n)/g, '<br />');
            //        $txtArea.empty().append(DescricaoAcordo);
            //        }
            //    });
            //}, 300);
        }
    }

    var lookupConta = new Array;
    lookupConta = Xrm.Page.getAttribute("se_contaid").getValue();

    if (lookupConta != null) {
        // VERIFICAÇÃO DE CLIENTE:
        // LINCENÇA LIBERADA: SIM/NÃO
        //BUSCA DE INFORMAÇÕES DO CLIENTE
        var cliente = lookupConta[0].id;
        var nomeCliente = lookupConta[0].name

        ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca,Se_cobrancadia1,Se_cobrancacancelada,Se_cobrancadia15,Se_cobrancaimediata&$filter=AccountId eq guid'" + cliente + "'";
        var info_conta = GetCrmEntityRecords(ODataQuery);

        is_liberado = info_conta.results[0].Se_liberalicenca;
		cnpj = Xrm.Page.getAttribute("se_cnpj").getValue();
		
        if (!is_liberado) {
            Xrm.Page.ui.clearFormNotification("1");
            Xrm.Page.ui.setFormNotification("ATENÇÃO! O cliente " + nomeCliente + " NÃO ESTÁ liberado para criação de licenças. Por favor, verifique a conta para validar a liberação.", NotificaionLevel, "1");
            Xrm.Page.getAttribute("se_contaid").setValue(null);
            Xrm.Page.getAttribute("se_cnpj").setValue(null);
            return;
        }

		var cnpjAux = info_conta.results[0].Se_Cnpj;       
		
		if(cnpj != cnpjAux)
		{
			cnpj = info_conta.results[0].Se_Cnpj;
			Xrm.Page.getAttribute("se_cnpj").setSubmitMode("always");
			Xrm.Page.getAttribute("se_cnpj").setValue(CNPJ_CPF(cnpj));
		}
    }

}

function hasHistoricoDeAcordo() {

    var ODataQuery = "";

    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_contaid").getValue();

    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
        // Xrm.Page.ui.clearFormNotification(1);
        if (InfoCobranca.results.length != 0) {
            return true;
        }
    }
    return false;
}

function displayHistoricoDeAcordo() {
    var ODataQuery = "";
    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_contaid").getValue();	
	
    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
        // Xrm.Page.ui.clearFormNotification(1);
        if (InfoCobranca.results.length != 0) {
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
			if(statecode.Value == 0)
			{			
				alert("Histórico de Acordo - DISTRIBUIDOR\n\n" + DescricaoAcordo);
			}
         
            //window.setTimeout(function () {
            //    Alert.show("Histórico de Acordo", null, null, null, 1000, 500);
            //    var $frame = parent.$("#InlineDialog_Iframe");
            //    $frame.load(function () {
            //        if ($frame[0].contentWindow != null) {
            //            var $message = $($frame[0].contentWindow.document).find("#message");
            //            $message.append('<br/><textarea readonly="true" id="k2m_HistoricoDeAcordo" style="width:950px;height:380px" />');
            //            var $txtArea = $($frame[0].contentWindow.document).find("#k2m_HistoricoDeAcordo");
            //            var strDescricaoAcordo = DescricaoAcordo.replace(/(?:\r\n|\r|\n)/g, '<br />');
            //            $txtArea.append(DescricaoAcordo);
            //        }
            //    });
            //}, 300);
        }
    }
}


function Form_onLoad() {
    // onChange_se_formatodolicenciamento();
    FieldValidadeLicenca();
    ValidaHistoricoAcordo();
    DisableFieldsOnLoad();
    setBlockedFields();
    //document.getElementById("se_cnpj_i").readOnly = true;
}

function ValidaHistoricoAcordo() {

    var Cliente = Xrm.Page.getAttribute("se_contaid").getValue();
    var Integrador = Xrm.Page.getAttribute("se_integradorid").getValue();
    var Distribuidor = Xrm.Page.getAttribute("se_distribuidorid").getValue();

    if (Cliente != null) {
        OnLoadCliente();
    }

    if (Integrador != null) {
        OnLoadIntegrador();
    }

    if (Distribuidor != null) {
        OnLoadDistribuidor();
    }
}
function DisableFieldsOnLoad() {

    //Form create
    if (Xrm.Page.ui.getFormType() != 1) return;

    DisableField("se_grupolicenca_gateway"); //Grupo de Licença Gateway
    DisableField("se_grupolicenca_sitef"); //Grupo de Licença SiTef
    DisableField("se_modalidadesitef"); //Modalidade SiTef
    DisableField("se_cnpj"); //CNPJ    
}

function Form_onSave(econtext) {
    var eventArgs = econtext.getEventArgs();
    console && console.log(econtext);

    if (!checkLiberacao(true)) {
        eventArgs.preventDefault();
        return;
    }


    var conta = Xrm.Page.getAttribute("se_contaid").getValue()[0].name;
    var result = Xrm.Page.getAttribute("se_tipodelicenciamento").getText();
    if (conta != null && result != null) {
        Xrm.Page.getAttribute("se_name").setValue(conta + " | " + result);
    }
}

function onChange_se_formatodolicenciamento() {
    if (Xrm.Page.getAttribute("se_formatodolicenciamento").getValue() == 0) {
        Xrm.Page.getControl("se_contaid").setDisabled(false);
        Xrm.Page.getControl("se_distribuidorid").setDisabled(false);
        Xrm.Page.getControl("se_integradorid").setDisabled(false);
    } else if (Xrm.Page.getAttribute("se_formatodolicenciamento").getValue() == 1) {
        Xrm.Page.getControl("se_contaid").setDisabled(false);
        Xrm.Page.getControl("se_distribuidorid").setDisabled(true);
        Xrm.Page.getControl("se_integradorid").setDisabled(true);
    } else if (Xrm.Page.getAttribute("se_formatodolicenciamento").getValue() == 2) {
        Xrm.Page.getControl("se_contaid").setDisabled(false);
        Xrm.Page.getControl("se_distribuidorid").setDisabled(true);
        Xrm.Page.getControl("se_integradorid").setDisabled(false);
    } else if (Xrm.Page.getAttribute("se_formatodolicenciamento").getValue() == 3) {
        Xrm.Page.getControl("se_contaid").setDisabled(false);
        Xrm.Page.getControl("se_distribuidorid").setDisabled(false);
        Xrm.Page.getControl("se_integradorid").setDisabled(true);
    } else {
        Xrm.Page.getControl("se_contaid").setDisabled(false);
        Xrm.Page.getControl("se_distribuidorid").setDisabled(false);
        Xrm.Page.getControl("se_integradorid").setDisabled(false);
    }

    checkLiberacao();

}


function OnChangeFormato() {

    //limpa campos
    Xrm.Page.getAttribute("se_integradorid").setValue(null);
    Xrm.Page.getAttribute("se_distribuidorid").setValue(null);
    Xrm.Page.getAttribute("se_contaid").setValue(null);
    Xrm.Page.getAttribute("se_cnpj").setValue(null);
    Xrm.Page.getAttribute("se_emailsolicitante").setValue(null);

    checkLiberacao();

}


var fieldCliente;

var cnpj = "";

function CNPJ_CPF(v) {
    if (cnpj.length != 14) { //verifica quantos digitos existem 
        //CNPJ
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
        return v;
    } else {
        //CPF
        v = v.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    }
}


function OnChangeModalidadeSiTef() {

    if (Xrm.Page.getAttribute("se_modalidadesitef").getValue() == null) {
        EnableField("se_qtdeloja");
    }
    else if (Xrm.Page.getAttribute("se_modalidadesitef").getSelectedOption().text != "Mono-Loja (Por PDV)") {
        EnableField("se_qtdeloja");
        Xrm.Page.getAttribute("se_qtdeloja").setValue(null);
    }
}

function OnLoadCliente() {
    var ODataQuery = "";

    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_contaid").getValue();
	
    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
        if (InfoCobranca.results.length != 0) {
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
			if(statecode.Value == 0)
			{
				alert("Histórico de Acordo - CLIENTE\n\n" + DescricaoAcordo);
			}

        }
    }
}
function OnLoadIntegrador() {
    var ODataQuery = "";

    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_integradorid").getValue();
	
    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
        if (InfoCobranca.results.length != 0) {
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
			if(statecode.Value == 0)
			{
				alert("Histórico de Acordo - INTEGRADOR\n\n" + DescricaoAcordo);
			}

        }
    }
}
function OnLoadDistribuidor() {
    var ODataQuery = "";

    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_distribuidorid").getValue();
	
    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
        if (InfoCobranca.results.length != 0) {
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
			if(statecode.Value == 0)
			{
				alert("Histórico de Acordo - DISTRIBUIDOR\n\n" + DescricaoAcordo);
			}

        }
    }
}

function OnSaveIntegrador() {
    checkLiberacao();
    var ODataQuery = "";

    var lookupConta = new Array;
    lookupConta = Xrm.Page.getAttribute("se_contaid").getValue();

    if (lookupConta != null) {

        // VERIFICAÇÃO DE CLIENTE:
        // LINCENÇA LIBERADA: SIM/NÃO
        //BUSCA DE INFORMAÇÕES DO CLIENTE
        var cliente = lookupConta[0].id;

        ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca&$filter=AccountId eq guid'" + cliente + "'";
        var info_conta = GetCrmEntityRecords(ODataQuery);
        is_liberado = info_conta.results[0].Se_liberalicenca;
        var nomeCliente = lookupConta[0].name
        // Xrm.Page.ui.clearFormNotification();
        if (!is_liberado) {
            Xrm.Page.ui.setFormNotification('ATENÇÃO!\n\n O cliente ' + nomeCliente + ' NÃO ESTÁ liberado para criação de licenças.\n\nPor favor, verifique a conta para validar a liberação.', "ERROR", "1");
            Xrm.Page.getAttribute("se_contaid").setValue(null);

        }
    }
}

function OnChangeIntegrador() {

    checkLiberacao();
    var ODataQuery = "";

    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_integradorid").getValue();

    if (fieldCliente == lookupContaHistorico) {
        return;
    }
    else {
        fieldCliente = lookupContaHistorico;
    }

    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
		
        // Xrm.Page.ui.clearFormNotification(1);
        if (InfoCobranca.results.length != 0) {
            //DescricaoAcordo = InfoCobranca[0].getValue('se_descricaodeacordo');
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
            //Xrm.Page.ui.setFormNotification(DescricaoAcordo,"INFO","1");
			if(statecode.Value == 0)
			{
				alert("Histórico de Acordo - INTEGRADOR\n\n" + DescricaoAcordo);
			}

            //window.setTimeout(function () {
            //    Alert.show("Histórico de Acordo - INTEGRADOR", null, null, null, 1000, 500);
            //    var $frame = parent.$("#InlineDialog_Iframe");
            //    $frame.load(function () {
            //        if ($frame[0].contentWindow != null) {
            //            var $message = $($frame[0].contentWindow.document).find("#message");
            //            $message.empty().append('<br/><textarea readonly="true" id="k2m_HistoricoDeAcordo" style="width:950px;height:380px" />');
            //            var $txtArea = $($frame[0].contentWindow.document).find("#k2m_HistoricoDeAcordo");
            //            var strDescricaoAcordo = DescricaoAcordo.replace(/(?:\r\n|\r|\n)/g, '<br />');
            //            $txtArea.empty().append(DescricaoAcordo);
            //        }
            //    });
            //}, 300);
        }
    }


    var lookupConta = new Array;
    lookupConta = Xrm.Page.getAttribute("se_contaid").getValue();

    if (lookupConta != null) {

        // VERIFICAÇÃO DE CLIENTE:
        // LINCENÇA LIBERADA: SIM/NÃO
        //BUSCA DE INFORMAÇÕES DO CLIENTE
        var cliente = lookupConta[0].id;

        ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca&$filter=AccountId eq guid'" + cliente + "'";
        var info_conta = GetCrmEntityRecords(ODataQuery);
        is_liberado = info_conta.results[0].Se_liberalicenca;
        var nomeCliente = lookupConta[0].name
        // Xrm.Page.ui.clearFormNotification();
        if (!is_liberado) {
            Xrm.Page.ui.setFormNotification('ATENÇÃO!\n\n O cliente ' + nomeCliente + ' NÃO ESTÁ liberado para criação de licenças.\n\nPor favor, verifique a conta para validar a liberação.', "ERROR", "1");
            Xrm.Page.getAttribute("se_contaid").setValue(null);

        }
    }
}

function FieldValidadeLicenca() {

    var dataAtual = new Date();
    var dataPadrao = new Date(dataAtual.getFullYear(), 2, 1, 0, 0, 0, 0);

    var dataResult = new Date();
    var EmailCadastrado = Xrm.Page.getAttribute("se_emailsolicitante").getValue();

    if (EmailCadastrado == null) {
        if (dataAtual >= dataPadrao) {
            dataResult = new Date((dataAtual.getFullYear() + 1), 2, 31, 0, 0, 0, 0);
        }
        else {
            dataResult = new Date(dataAtual.getFullYear(), 2, 31, 0, 0, 0, 0);
        }
        Xrm.Page.getAttribute("se_validadelicenca").setValue(dataResult);
    }
}

function OnSaveDistribuidor() {
    var ODataQuery = "";

    var lookupConta = new Array;
    lookupConta = Xrm.Page.getAttribute("se_distribuidorid").getValue();

    if (lookupConta != null) {

        // VERIFICAÇÃO DE CLIENTE:
        // LINCENÇA LIBERADA: SIM/NÃO

        //BUSCA PELOS PRODUTOS DO CLIENTE
        var cliente = lookupConta[0].id;

        ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca&$filter=AccountId eq guid'" + cliente + "'";
        var info_conta = GetCrmEntityRecords(ODataQuery);
        var nomeCliente = lookupConta[0].name
        //CAPTURA INFO DO CLIENTE 
        is_liberado = info_conta.results[0].Se_liberalicenca;
        //FIM INFO DO CLIENTE
        // Xrm.Page.ui.clearFormNotification;
        if (!is_liberado) {

            Xrm.Page.ui.setFormNotification('ATENÇÃO!\n\n O cliente ' + nomeCliente + ' NÃO ESTÁ liberado para criação de licenças.\n\nPor favor, verifique a conta para validar a liberação.', "ERROR", "1");
            Xrm.Page.getAttribute("se_distribuidorid").setValue(null);
        }
    }
}

function OnChangeDistribuidor() {
    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var ODataQuery = "";
    //VERIFICA SE CLIENTE POSSUI ACORDO COM O SETOR COMERCIAL
    var lookupContaHistorico = new Array;
    lookupContaHistorico = Xrm.Page.getAttribute("se_distribuidorid").getValue();

    if (fieldCliente == lookupContaHistorico) {
        return;
    }
    else {
        fieldCliente = lookupContaHistorico;
    }

    if (lookupContaHistorico != null) {
        var ClienteHistorico = lookupContaHistorico[0].id;

        ODataQuery = "Se_historicodeacordosSet?$select=Se_DescricaodeAcordo,Se_name,statecode&$filter=Se_ContaId/Id eq guid'" + ClienteHistorico + "'";
        var InfoCobranca = GetCrmEntityRecords(ODataQuery);
		
        // Xrm.Page.ui.clearFormNotification(1);
        if (InfoCobranca.results.length != 0) {
            //DescricaoAcordo = InfoCobranca[0].getValue('se_descricaodeacordo');
            DescricaoAcordo = InfoCobranca.results[0].Se_DescricaodeAcordo;
			statecode = InfoCobranca.results[0].statecode;
            //Xrm.Page.ui.setFormNotification(DescricaoAcordo,"INFO","1");
			if(statecode.Value == 0)
			{
				alert("Histórico de Acordo - DISTRIBUIDOR\n\n" + DescricaoAcordo);
			}

            //window.setTimeout(function () {
            //    Alert.show("Histórico de Acordo - DISTRIBUIDOR", null, null, null, 1000, 500);
            //    var $frame = parent.$("#InlineDialog_Iframe");
            //    $frame.load(function () {
            //        if ($frame[0].contentWindow != null) {
            //            var $message = $($frame[0].contentWindow.document).find("#message");
            //            $message.empty().append('<br/><textarea readonly="true" id="k2m_HistoricoDeAcordo" style="width:950px;height:380px" />');
            //            var $txtArea = $($frame[0].contentWindow.document).find("#k2m_HistoricoDeAcordo");
            //            var strDescricaoAcordo = DescricaoAcordo.replace(/(?:\r\n|\r|\n)/g, '<br />');
            //            $txtArea.empty().append(DescricaoAcordo);
            //        }
            //    });
            // }, 300);
        }
    }


    var lookupConta = new Array;
    lookupConta = Xrm.Page.getAttribute("se_distribuidorid").getValue();

    if (lookupConta != null) {

        // VERIFICAÇÃO DE CLIENTE:
        // LINCENÇA LIBERADA: SIM/NÃO

        //BUSCA PELOS PRODUTOS DO CLIENTE
        var cliente = lookupConta[0].id;

        ODataQuery = "AccountSet?$select=Se_Cnpj,Se_liberalicenca&$filter=AccountId eq guid'" + cliente + "'";
        var info_conta = GetCrmEntityRecords(ODataQuery);
        var nomeCliente = lookupConta[0].name
        //CAPTURA INFO DO CLIENTE 
        is_liberado = info_conta.results[0].Se_liberalicenca;
        //FIM INFO DO CLIENTE
        // Xrm.Page.ui.clearFormNotification;
        if (!is_liberado) {
            Xrm.Page.ui.setFormNotification('ATENÇÃO!\n\n O distribuidor ' + nomeCliente + ' NÃO ESTÁ liberado para criação de licenças.\n\nPor favor, verifique a conta para validar a liberação.', "ERROR", "1");
            Xrm.Page.getAttribute("se_distribuidorid").setValue(null);
        }
        else {
            checkLiberacao();
        }
    }
}


function OnChangeTipoLicenca() {

    Xrm.Page.getAttribute("se_grupolicenca_gateway").setValue(null);
    Xrm.Page.getAttribute("se_grupolicenca_sitef").setValue(null);
    Xrm.Page.getAttribute("se_numeroredes").setValue(null);
    DisableField("se_numeroredes");
    Xrm.Page.getAttribute("se_numeroredes").setRequiredLevel("none");
    Xrm.Page.getAttribute("se_numeroredes").setValue(null);
    Xrm.Page.getAttribute("se_modalidadesitef").setValue(null);

    EnableField("se_qtdeloja");
}

function OnChangeGrupoLicencaSiTef() {
    Xrm.Page.getAttribute("se_numeroredes").setValue(null);
}

function GetSitefAccountName(chave) {

    var ODataQuery = "se_configuracaoSet?$filter=se_name eq '" + chave + "'";
    var configSitefUser = GetCrmEntityRecords(ODataQuery);

    if (configSitefUser.results.length > 0) {
        return configSitefUser.results[0].se_valor.toLowerCase();
    }
    else {
        Xrm.Page.ui.setFormNotification("Configuração procurada não foi encontrada. ", "ERROR");
        return null;
    }

}
function GetUserDomainAccount(userid) {
    var ODataQuery = "SystemUserSet?$filter=SystemUserId eq (guid'" + userid + "')";
    var user = GetCrmEntityRecords(ODataQuery);

    if (user.results.length > 0) {
        return user.results[0].DomainName.toLowerCase();
    }
    else {
        Xrm.Page.ui.setFormNotification("Usuário não foi encontrado. ", "ERROR");
        return null;
    }

}


function setBlockedFields() {    
	var atualizadointegrador = Xrm.Page.getAttribute("se_atualizadoporsitefintegrador").getValue();
	var modifiedby = Xrm.Page.getAttribute("modifiedby").getValue()
    if (modifiedby !== null) {
        var modifiedName = GetUserDomainAccount(modifiedby[0].id);
        if (modifiedName == null) Xrm.Page.ui.setFormNotification("Validação para Bloqueio de campos falhou.", "ERROR")
        var loggedName = GetUserDomainAccount(Xrm.Page.context.getUserId());
        if (loggedName == null) Xrm.Page.ui.setFormNotification("Validação para Bloqueio de campos falhou.", "ERROR")
        var sitefuserName = GetSitefAccountName('usuario_sitef_integrador');
        if (sitefuserName == null) Xrm.Page.ui.setFormNotification("Validação para Bloqueio de campos falhou.", "ERROR")
        if (modifiedName != null && loggedName != null && sitefuserName != null &&
            loggedName != sitefuserName) {
			if(atualizadointegrador)
			{
				Xrm.Page.getControl("se_distribuidorid").setDisabled(true);
				Xrm.Page.getControl("se_integradorid").setDisabled(true);
				Xrm.Page.getControl("se_contaid").setDisabled(true);
				Xrm.Page.getControl("se_cnpj").setDisabled(true);
				Xrm.Page.getControl("se_emailsolicitante").setDisabled(true);
				Xrm.Page.getControl("se_validadelicenca").setDisabled(true);
				Xrm.Page.getControl("se_datadeativacao").setDisabled(true);
				Xrm.Page.getControl("se_tipolicenca").setDisabled(true);
				Xrm.Page.getControl("se_grupolicenca_sitef").setDisabled(true);
				Xrm.Page.getControl("se_tipodelicenciamento").setDisabled(true);
				Xrm.Page.getControl("se_valorunit").setDisabled(true);
				Xrm.Page.getControl("se_valor").setDisabled(true);
				Xrm.Page.getControl("se_qtdeloja").setDisabled(true);
				Xrm.Page.getControl("se_modalidadesitef").setDisabled(true);
			}
            
        }

    }
}