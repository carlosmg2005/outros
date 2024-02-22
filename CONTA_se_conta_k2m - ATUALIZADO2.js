/// <reference path="se_Helpers.js" />

function onloadAccount(executionContext) {
    debugger
    var formContext = executionContext.getFormContext();
    onChangeCNPJ(executionContext);
    onChangeFranquia(executionContext);
    onChangeLicenca(executionContext);
    SessionInformacoesCobranca(executionContext);
    setBlockedFields(executionContext);
}

function GetSitefAccountName(chave) {
    var formContext = executionContext.getFormContext();

    var ODataQuery = "/api/data/v9.1/se_configuracaoSet?$filter=se_name eq '" + chave + "'";
    var configSitefUser = formContext.data.process.executeODataAction(ODataQuery);

    if (configSitefUser.results.length > 0) {
        return configSitefUser.results[0].se_valor.toLowerCase();
    } else {
        formContext.ui.setFormNotification("Configuração procurada não foi encontrada.", "ERROR");
        return null;
    }
}

function GetUserDomainAccount(executionContext, userid) {
    var formContext = executionContext.getFormContext();

    var ODataQuery = "/api/data/v9.1/SystemUserSet?$filter=SystemUserId eq (guid'" + userid + "')";
    var user = formContext.data.process.executeODataAction(ODataQuery);

    if (user.results.length > 0) {
        return user.results[0].DomainName.toLowerCase();
    } else {
        formContext.ui.setFormNotification("Usuário não foi encontrado.", "ERROR");
        return null;
    }
}

function getProducts(executionContext) {
    var formContext = executionContext.getFormContext();
    var cnpj = formContext.getAttribute("se_cnpj").getValue();

    var fetch =
        "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
        "    <entity name='se_produtoinstalado'>" +
        "        <attribute name='se_servidorid' />" +
        "        <attribute name='se_hospedadose' />" +
        "        <attribute name='createdby' />" +
        "        <attribute name='se_versao' />" +
        "        <attribute name='se_produtoid' />" +
        "        <attribute name='se_sla' />" +
        "        <attribute name='se_localizacao' />" +
        "        <attribute name='se_produtoinstaladoid2' />" +
        "        <attribute name='se_atendimentoliberado' />" +
        "        <attribute name='se_produtoinstaladoid' />" +
        "        <attribute name='statecode' />" +
        "        <order attribute='se_hospedadose' descending='false' />" +
        "        <filter type='and'>" +
        "            <condition attribute='se_produtoid' operator='eq' uiname='SiTef Express' uitype='se_produtoprincipal' value='{45F0DAB9-092E-E811-AB74-00155D02CF16}' />" +
        "            <condition attribute='statecode' operator='eq' value='1' />" +
        "        </filter>" +
        "        <link-entity name='account' from='accountid' to='se_produtoinstaladoid2' alias='ac'>" +
        "            <filter type='and'>" +
        "                <condition attribute='se_cnpj' operator='eq' value='" + cnpj + "' />" +
        "            </filter>" +
        "        </link-entity>" +
        "    </entity>" +
        "</fetch>";

    var fetchData = formContext.data.process.executeODataAction(fetch);
    if (fetchData != null) {
        for (var i = 0; i < fetchData.length; i++) {
            var stateCode = fetchData[i].attributes["statecode"].value;
            if (stateCode == "1") {
                return true;
            }
        }
    }
}

function setBlockedFields(executionContext) {
    var formContext = executionContext.getFormContext();
    var modifiedby = formContext.getAttribute("modifiedby").getValue();
    var atualizadointegrador = formContext.getAttribute("se_atualizadoporsitefintegrador").getValue();
    var accountInactiveProduct = getProducts(executionContext);

    if (modifiedby !== null) {
        var modifiedName = GetUserDomainAccount(executionContext, modifiedby[0].id);
        if (modifiedName == null) {
            formContext.ui.setFormNotification("Validação para Bloqueio de campos falhou.", "ERROR");
        }
        var loggedName = GetUserDomainAccount(executionContext, formContext.context.getUserId());
        if (loggedName == null) {
            formContext.ui.setFormNotification("Validação para Bloqueio de campos falhou.", "ERROR");
        }
        var sitefuserName = GetSitefAccountName('usuario_sitef_integrador');
        if (sitefuserName == null) {
            formContext.ui.setFormNotification("Validação para Bloqueio de campos falhou.", "ERROR");
        }
        if (modifiedName != null && loggedName != null && sitefuserName != null &&
            loggedName != sitefuserName) {
            if (atualizadointegrador) {
                if (!accountInactiveProduct) {
                    formContext.getControl("parentaccountid").setDisabled(true);
                    formContext.getControl("se_cnpj").setDisabled(true);
                    formContext.getControl("se_containternacional").setDisabled(true);
                    formContext.getControl("yominame").setDisabled(true);
                    formContext.getControl("name").setDisabled(true);
                    formContext.getControl("se_contaparacadastrodeatendimento").setDisabled(true);
                    formContext.getControl("address1_line1").setDisabled(true);
                    formContext.getControl("address1_line2").setDisabled(true);
                    formContext.getControl("address1_line3").setDisabled(true);
                    formContext.getControl("address1_county").setDisabled(true);
                    formContext.getControl("address1_city").setDisabled(true);
                    formContext.getControl("address1_stateorprovince").setDisabled(true);
                    formContext.getControl("address1_country").setDisabled(true);
                    formContext.getControl("address1_postalcode").setDisabled(true);
                    formContext.getControl("se_pessoafisica").setDisabled(true);                }
            }
        }
    }
}

function onChangeCNPJ(executionContext) {
    var formContext = executionContext.getFormContext();

    // Verifica se o contexto do formulário foi obtido corretamente
    if (formContext) {
        var result = formContext.getAttribute("se_containternacional").getValue();
        if (result === false) {
            formContext.getControl("se_cnpj").setDisabled(false);
            formContext.getAttribute("se_cnpj").setRequiredLevel("required");
            formContext.getControl("se_identificao").setDisabled(true);
            formContext.getAttribute("se_identificao").setValue(null);
            formContext.getAttribute("se_identificao").setRequiredLevel("none");
            formContext.getAttribute("se_identificao").setSubmitMode("always");
        } else {
            formContext.getControl("se_identificao").setDisabled(false);
            formContext.getAttribute("se_identificao").setRequiredLevel("required");
            formContext.getControl("se_cnpj").setDisabled(true);
            formContext.getAttribute("se_cnpj").setValue(null);
            formContext.getAttribute("se_cnpj").setRequiredLevel("none");
            formContext.getAttribute("se_cnpj").setSubmitMode("always");
        }
    } else {
        console.error("O contexto do formulário não foi encontrado.");
    }
}

function onChangeFranquia(executionContext) {
    var formContext = executionContext.getFormContext();
    var result = formContext.getAttribute("se_classificacao_franquia").getValue();
    formContext.getControl("se_franquiaid").setVisible(result);
    if (result == true)
        formContext.getAttribute("se_franquiaid").setRequiredLevel("required");
    else
        formContext.getAttribute("se_franquiaid").setRequiredLevel("none");
}

function onChangeLicenca(executionContext) {
    var formContext = executionContext.getFormContext();
    var result = !formContext.getAttribute("se_liberalicenca").getValue();
    formContext.getControl("se_observacaolicenca").setVisible(result);
}

function OnChangeEnderecoPrincipal(executionContext) {
    var formContext = executionContext.getFormContext();
    if (formContext.getAttribute("se_copiarenderecoprincipal").getValue()) {
        formContext.getAttribute("se_enderecocorresp_logradouro").setValue(formContext.getAttribute("address1_line1").getValue());
        formContext.getAttribute("se_enderecocorresp_nro").setValue(formContext.getAttribute("address1_line2").getValue());
        formContext.getAttribute("se_enderecocorresp_cidade").setValue(formContext.getAttribute("address1_city").getValue());
        formContext.getAttribute("se_enderecocorresp_complemento").setValue(formContext.getAttribute("address1_line3").getValue());
        formContext.getAttribute("se_enderecocorresp_estado").setValue(formContext.getAttribute("address1_stateorprovince").getValue());
        formContext.getAttribute("se_enderecocorresp_bairro").setValue(formContext.getAttribute("address1_county").getValue());
        formContext.getAttribute("se_enderecocorresp_pas").setValue(formContext.getAttribute("address1_country").getValue());
        formContext.getAttribute("se_enderecocorresp_cep").setValue(formContext.getAttribute("address1_postalcode").getValue());
    } else {
        formContext.getAttribute("se_enderecocorresp_logradouro").setValue('');
        formContext.getAttribute("se_enderecocorresp_nro").setValue('');
        formContext.getAttribute("se_enderecocorresp_cidade").setValue('');
        formContext.getAttribute("se_enderecocorresp_complemento").setValue('');
        formContext.getAttribute("se_enderecocorresp_estado").setValue('');
        formContext.getAttribute("se_enderecocorresp_bairro").setValue('');
        formContext.getAttribute("se_enderecocorresp_pas").setValue('');
        formContext.getAttribute("se_enderecocorresp_cep").setValue('');
    }
}

function OnChangeEnderecoCorrespondencia(executionContext) {
    var formContext = executionContext.getFormContext();
    if (formContext.getAttribute("se_copiarendereco2").getValue() == 3) {
        formContext.getAttribute("address2_line1").setValue(formContext.getAttribute("address1_line1").getValue());
        formContext.getAttribute("address2_line2").setValue(formContext.getAttribute("address1_line2").getValue());
        formContext.getAttribute("address2_city").setValue(formContext.getAttribute("address1_city").getValue());
        formContext.getAttribute("address2_line3").setValue(formContext.getAttribute("address1_line3").getValue());
        formContext.getAttribute("address2_stateorprovince").setValue(formContext.getAttribute("address1_stateorprovince").getValue());
        formContext.getAttribute("address2_county").setValue(formContext.getAttribute("address1_county").getValue());
        formContext.getAttribute("address2_country").setValue(formContext.getAttribute("address1_country").getValue());
        formContext.getAttribute("address2_postalcode").setValue(formContext.getAttribute("address1_postalcode").getValue());
    } else {
        if (formContext.getAttribute("se_copiarendereco2").getValue() == 2) {
            formContext.getAttribute("address2_line1").setValue(formContext.getAttribute("se_enderecocorresp_logradouro").getValue());
            formContext.getAttribute("address2_line2").setValue(formContext.getAttribute("se_enderecocorresp_nro").getValue());
            formContext.getAttribute("address2_city").setValue(formContext.getAttribute("se_enderecocorresp_cidade").getValue());
            formContext.getAttribute("address2_line3").setValue(formContext.getAttribute("se_enderecocorresp_complemento").getValue());
            formContext.getAttribute("address2_stateorprovince").setValue(formContext.getAttribute("se_enderecocorresp_estado").getValue());
            formContext.getAttribute("address2_county").setValue(formContext.getAttribute("se_enderecocorresp_bairro").getValue());
            formContext.getAttribute("address2_country").setValue(formContext.getAttribute("se_enderecocorresp_pas").getValue());
            formContext.getAttribute("address2_postalcode").setValue(formContext.getAttribute("se_enderecocorresp_cep").getValue());
        } else {
            formContext.getAttribute("address2_line1").setValue('');
            formContext.getAttribute("address2_line2").setValue('');
            formContext.getAttribute("address2_city").setValue('');
            formContext.getAttribute("address2_line3").setValue('');
            formContext.getAttribute("address2_stateorprovince").setValue('');
            formContext.getAttribute("address2_county").setValue('');
            formContext.getAttribute("address2_country").setValue('');
            formContext.getAttribute("address2_postalcode").setValue('');
        }
    }
}

function OnChangeCobrancaCancelada() {

    // Se a cobrança for cancelada, desabilita as outras opções de cobrança
    if (formContext.getAttribute("se_cobrancacancelada").getValue()) {
        formContext.getAttribute("se_cobrancadia1").setValue(false);
        formContext.getAttribute("se_cobrancadia15").setValue(false);
        formContext.getAttribute("se_cobrancaimediata").setValue(false);
    }
}

function OnChangeCobrancaDia1() {

    // Se a cobrança for no dia 1, desabilita as outras opções de cobrança
    if (formContext.getAttribute("se_cobrancadia1").getValue()) {
        formContext.getAttribute("se_cobrancacancelada").setValue(false);
        formContext.getAttribute("se_cobrancadia15").setValue(false);
        formContext.getAttribute("se_cobrancaimediata").setValue(false);
    }
}

function OnChangeCobrancaDia15() {

    // Se a cobrança for no dia 15, desabilita as outras opções de cobrança
    if (formContext.getAttribute("se_cobrancadia15").getValue()) {
        formContext.getAttribute("se_cobrancacancelada").setValue(false);
        formContext.getAttribute("se_cobrancadia1").setValue(false);
        formContext.getAttribute("se_cobrancaimediata").setValue(false);
    }
}

function OnChangeCobrancaImediata() {

    // Se a cobrança for imediata, desabilita as outras opções de cobrança
    if (formContext.getAttribute("se_cobrancaimediata").getValue()) {
        formContext.getAttribute("se_cobrancacancelada").setValue(false);
        formContext.getAttribute("se_cobrancadia1").setValue(false);
        formContext.getAttribute("se_cobrancadia15").setValue(false);
    }
}

function SessionInformacoesCobranca(executionContext) {
    var formContext = executionContext.getFormContext();

    if (!CurrentUserHasRoleByName("SE: Cobrança") &&
        !CurrentUserHasRoleByName("SE: Comercial") &&
        !CurrentUserHasRoleByName("SE: Comercial - Licenciamento") &&
        !CurrentUserHasRoleByName("Administrador do Sistema")) {

        HideGuide("guideInformacaoCobranca");
        HideSession("{13b0fbf2-e596-4dc5-919b-7a0aea72598b}", "{5779eb54-a281-4f49-924f-7dad336c7107}");
        formContext.getControl("se_inscricaomunicipal").setVisible(false);
        formContext.getControl("se_inscricaoestadual").setVisible(false);
    } else {
        ShowGuide("guideInformacaoCobranca");
        ShowSession("{13b0fbf2-e596-4dc5-919b-7a0aea72598b}", "{5779eb54-a281-4f49-924f-7dad336c7107}");
        formContext.getControl("se_inscricaomunicipal").setVisible(true);
        formContext.getControl("se_inscricaoestadual").setVisible(true);
    }
}

function notificarCobranca() {
    debugger;
    var cobrancaVia = formContext.getAttribute("se_metodocobranca").getIsDirty();
    var copyAdress = formContext.getAttribute("se_copiarendereco2").getIsDirty();
    var ed_cob1_rua = formContext.getAttribute("address2_line1").getIsDirty();
    var ed_cob1_nr = formContext.getAttribute("address2_line2").getIsDirty();
    var ed_cob1_comp = formContext.getAttribute("address2_line3").getIsDirty();
    var ed_cob1_cep = formContext.getAttribute("address2_postalcode").getIsDirty();
    var ed_cob1_bairro = formContext.getAttribute("address2_county").getIsDirty();
    var ed_cob1_city = formContext.getAttribute("address2_city").getIsDirty();
    var ed_cob1_state = formContext.getAttribute("address2_stateorprovince").getIsDirty();
    var ed_cob1_pais = formContext.getAttribute("address2_country").getIsDirty();
    var ed_cob1_tel = formContext.getAttribute("address2_telephone1").getIsDirty();
    var ed_cob1_fax = formContext.getAttribute("address2_fax").getIsDirty();
    var ed_cob1_email = formContext.getAttribute("se_enderecocobranca1_email").getIsDirty();
    var ed_cob1_contact = formContext.getAttribute("address2_primarycontactname").getIsDirty();
    var ed_cob1_mailnota = formContext.getAttribute("se_enderecocobranca1_emailnota").getIsDirty();
    var ed_cob2_rua = formContext.getAttribute("se_enderecocobranca2_logradouro").getIsDirty();
    var ed_cob2_nr = formContext.getAttribute("se_enderecocobranca2_numero").getIsDirty();
    var ed_cob2_comp = formContext.getAttribute("se_enderecocobranca2_complemento").getIsDirty();
    var ed_cob2_cep = formContext.getAttribute("se_enderecocobranca2_cep").getIsDirty();
    var ed_cob2_bairro = formContext.getAttribute("se_enderecocobranca2_bairro").getIsDirty();
    var ed_cob2_city = formContext.getAttribute("se_enderecocobranca2_cidade").getIsDirty();
    var ed_cob2_state = formContext.getAttribute("se_enderecocobranca2_estado").getIsDirty();
    var ed_cob2_pais = formContext.getAttribute("se_enderecocobranca2_pais").getIsDirty();
    var ed_cob2_tel = formContext.getAttribute("se_enderecocobranca2_telefone").getIsDirty();
    var ed_cob2_fax = formContext.getAttribute("se_enderecocobranca2_fax").getIsDirty();
    var ed_cob2_email = formContext.getAttribute("se_enderecocobranca2_email").getIsDirty();
    var ed_cob2_contact = formContext.getAttribute("se_enderecocobranca2_responsavel").getIsDirty();
    var ed_cob2_mailnota = formContext.getAttribute("se_enderecocobranca2_emailnota").getIsDirty();
    var ed_cob3_rua = formContext.getAttribute("se_enderecocobranca3_logradouro").getIsDirty();
    var ed_cob3_nr = formContext.getAttribute("se_enderecocobranca3_numero").getIsDirty();
    var ed_cob3_comp = formContext.getAttribute("se_enderecocobranca3_complemento").getIsDirty();
    var ed_cob3_cep = formContext.getAttribute("se_enderecocobranca3_cep").getIsDirty();
    var ed_cob3_bairro = formContext.getAttribute("se_enderecocobranca3_bairro").getIsDirty();
    var ed_cob3_city = formContext.getAttribute("se_enderecocobranca3_cidade").getIsDirty();
    var ed_cob3_state = formContext.getAttribute("se_enderecocobranca3_estado").getIsDirty();
    var ed_cob3_pais = formContext.getAttribute("se_enderecocobranca3_pais").getIsDirty();
    var ed_cob3_tel = formContext.getAttribute("se_enderecocobranca3_telefone").getIsDirty();
    var ed_cob3_fax = formContext.getAttribute("se_enderecocobranca3_fax").getIsDirty();
    var ed_cob3_email = formContext.getAttribute("se_enderecocobranca3_email").getIsDirty();
    var ed_cob3_contact = Xrm.Page.getAttribute("se_enderecocobranca3_responsvel").getIsDirty();
    var ed_cob3_mailnota = formContext.getAttribute("se_enderecocobranca3_emailnota").getIsDirty();
    var venc = formContext.getAttribute("se_vencimentocobranca").getIsDirty();

    if (cobrancaVia || copyAdress || ed_cob1_rua || ed_cob1_nr || ed_cob1_comp || ed_cob1_cep || ed_cob1_bairro || ed_cob1_city || ed_cob1_state || ed_cob1_pais || ed_cob1_tel || ed_cob1_fax || ed_cob1_email || ed_cob1_contact || ed_cob1_mailnota || ed_cob2_rua || ed_cob2_nr || ed_cob2_comp || ed_cob2_cep || ed_cob2_bairro || ed_cob2_city || ed_cob2_state || ed_cob2_pais || ed_cob2_tel || ed_cob2_fax || ed_cob2_email || ed_cob2_contact || ed_cob2_mailnota || ed_cob3_rua || ed_cob3_nr || ed_cob3_comp || ed_cob3_cep || ed_cob3_bairro || ed_cob3_city || ed_cob3_state || ed_cob3_pais || ed_cob3_fax || ed_cob3_tel || ed_cob3_email || ed_cob3_contact || ed_cob3_mailnota || venc) {
        var mensagem = "";

        if (cobrancaVia) { mensagem += "Cobrança via: " + formContext.getAttribute("se_metodocobranca").getText() + "\n\n"; }
        if (copyAdress || ed_cob1_rua || ed_cob1_nr || ed_cob1_comp || ed_cob1_cep || ed_cob1_bairro || ed_cob1_city || ed_cob1_state || ed_cob1_pais || ed_cob1_tel || ed_cob1_fax || ed_cob1_email || ed_cob1_contact || ed_cob1_mailnota) {
            mensagem += "Informações de Cobrança (1).\n";
            if (copyAdress) { mensagem += "Copiar Endereço: " + formContext.getAttribute("se_copiarendereco2").getText() + "\n"; }
            if (ed_cob1_rua) { mensagem += "Logradouro: " + formContext.getAttribute("address2_line1").getValue() + "\n"; }
            if (ed_cob1_nr) { mensagem += "Número: " + formContext.getAttribute("address2_line2").getValue() + "\n"; }
            if (ed_cob1_comp) { mensagem += "Complemento: " + formContext.getAttribute("address2_line3").getValue() + "\n"; }
            if (ed_cob1_cep) { mensagem += "CEP: " + formContext.getAttribute("address2_postalcode").getValue() + "\n"; }
            if (ed_cob1_bairro) { mensagem += "Bairro: " + formContext.getAttribute("address2_county").getValue() + "\n"; }
            if (ed_cob1_city) { mensagem += "Cidade: " + formContext.getAttribute("address2_city").getValue() + "\n"; }
            if (ed_cob1_state) { mensagem += "Estado: " + formContext.getAttribute("address2_stateorprovince").getValue() + "\n"; }
            if (ed_cob1_pais) { mensagem += "País: " + formContext.getAttribute("address2_country").getValue() + "\n"; }
            if (ed_cob1_tel) { mensagem += "Telefone de Cobrança: " + formContext.getAttribute("address2_telephone1").getValue() + "\n"; }
            if (ed_cob1_fax) { mensagem += "Fax: " + formContext.getAttribute("address2_fax").getValue() + "\n"; }
            if (ed_cob1_email) { mensagem += "Email Cobrança: " + formContext.getAttribute("se_enderecocobranca1_email").getValue() + "\n"; }
            if (ed_cob1_contact) { mensagem += "Responsável pelo Recebimento da Nota: " + formContext.getAttribute("address2_primarycontactname").getValue() + "\n"; }
            if (ed_cob1_mailnota) { mensagem += "E-Mail para Envio de Nota Fiscal: " + formContext.getAttribute("se_enderecocobranca1_emailnota").getValue() + "\n"; }
            mensagem += "\n";
        }
		if (ed_cob2_rua || ed_cob2_nr || ed_cob2_comp || ed_cob2_cep || ed_cob2_bairro || ed_cob2_city || ed_cob2_state || ed_cob2_pais || ed_cob2_tel || ed_cob2_fax || ed_cob2_email || ed_cob2_contact || ed_cob2_mailnota) {
            mensagem += "Informações de Cobrança (2).\n";
		    if (ed_cob2_rua) { mensagem += "Logradouro: " + formContext.getAttribute("se_enderecocobranca2_logradouro").getValue() + "\n"; }
            if (ed_cob2_nr) { mensagem += "Número: " + formContext.getAttribute("se_enderecocobranca2_numero").getValue() + "\n"; }
            if (ed_cob2_comp) { mensagem += "Complemento: " + formContext.getAttribute("se_enderecocobranca2_complemento").getValue() + "\n"; }
            if (ed_cob2_cep) { mensagem += "CEP: " + formContext.getAttribute("se_enderecocobranca2_cep").getValue() + "\n"; }
            if (ed_cob2_bairro) { mensagem += "Bairro: " + formContext.getAttribute("se_enderecocobranca2_bairro").getValue() + "\n"; }
			if (ed_cob2_city) { mensagem += "Cidade: " + formContext.getAttribute("se_enderecocobranca2_cidade").getValue() + "\n"; }
			if (ed_cob2_state) { mensagem += "Estado: " + formContext.getAttribute("se_enderecocobranca2_estado").getValue() + "\n"; }
			if (ed_cob2_pais) { mensagem += "País: " + formContext.getAttribute("se_enderecocobranca2_pais").getValue() + "\n"; }
			if (ed_cob2_tel) { mensagem += "Telefone de Cobrança: " + formContext.getAttribute("se_enderecocobranca2_telefone").getValue() + "\n"; }
			if (ed_cob2_fax) { mensagem += "Fax: " + formContext.getAttribute("se_enderecocobranca2_fax").getValue() + "\n"; }
			if (ed_cob2_email) { mensagem += "Email Cobrança: " + formContext.getAttribute("se_enderecocobranca2_email").getValue() + "\n"; }
			if (ed_cob2_contact) { mensagem += "Responsável pelo Recebimento da Nota: " + formContext.getAttribute("se_enderecocobranca2_responsavel").getValue() + "\n"; }
			if (ed_cob2_mailnota) { mensagem += "E-Mail para Envio de Nota Fiscal: " + formContext.getAttribute("se_enderecocobranca2_emailnota").getValue() + "\n"; }
			mensagem += "\n";
		}
		if (ed_cob3_rua || ed_cob3_nr || ed_cob3_comp || ed_cob3_cep || ed_cob3_bairro || ed_cob3_city || ed_cob3_state || ed_cob3_pais || ed_cob3_fax || ed_cob3_tel || ed_cob3_email || ed_cob3_contact || ed_cob3_mailnota || venc) {
			mensagem += "Informações de Cobrança (3).\n";
			if (ed_cob3_rua) { mensagem += "Logradouro: " + formContext.getAttribute("se_enderecocobranca3_logradouro").getValue() + "\n"; }
			if (ed_cob3_nr) { mensagem += "Número: " + formContext.getAttribute("se_enderecocobranca3_numero").getValue() + "\n"; }
			if (ed_cob3_comp) { mensagem += "Complemento: " + formContext.getAttribute("se_enderecocobranca3_complemento").getValue() + "\n"; }
			if (ed_cob3_cep) { mensagem += "CEP: " + formContext.getAttribute("se_enderecocobranca3_cep").getValue() + "\n"; }
			if (ed_cob3_bairro) { mensagem += "Bairro: " + formContext.getAttribute("se_enderecocobranca3_bairro").getValue() + "\n"; }
			if (ed_cob3_city) { mensagem += "Cidade: " + formContext.getAttribute("se_enderecocobranca3_cidade").getValue() + "\n"; }
			if (ed_cob3_state) { mensagem += "Estado: " + formContext.getAttribute("se_enderecocobranca3_estado").getValue() + "\n"; }
			if (ed_cob3_pais) { mensagem += "País: " + formContext.getAttribute("se_enderecocobranca3_pais").getValue() + "\n"; }
			if (ed_cob3_tel) { mensagem += "Telefone de Cobrança: " + formContext.getAttribute("se_enderecocobranca3_telefone").getValue() + "\n"; }
			if (ed_cob3_fax) { mensagem += "Fax: " + formContext.getAttribute("se_enderecocobranca3_fax").getValue() + "\n"; }
			if (ed_cob3_email) { mensagem += "Email Cobrança: " + formContext.getAttribute("se_enderecocobranca3_email").getValue() + "\n"; }
			if (ed_cob3_contact) { mensagem += "Responsável pelo Recebimento da Nota: " + formContext.getAttribute("se_enderecocobranca3_responsvel").getValue() + "\n"; }
			if (ed_cob3_mailnota) { mensagem += "E-Mail para Envio de Nota Fiscal: " + formContext.getAttribute("se_enderecocobranca3_emailnota").getValue() + "\n"; }
			mensagem += "\n";
		}
		if (venc) { mensagem += "Vencimento: " + formContext.getAttribute("se_vencimentocobranca").getText() + "\n"; }

		var aditionalParams = "";
		aditionalParams += "          <a:KeyValuePairOfstringanyType>";
		aditionalParams += "            <b:key>message</b:key>";
		aditionalParams += "            <b:value i:type=\"c:string\" xmlns:c=\"www.w3.org/.../XMLSchema\">";
		aditionalParams += "              " + mensagem;
		aditionalParams += "            </b:value>";
		aditionalParams += "          </a:KeyValuePairOfstringanyType>";

		var accountid = formContext.data.entity.getId();

		var response = ExecuteAction(accountid, "account", "se_ContaAonotificaodealteraodeDadosdeCobrana", aditionalParams);
	}
}

function ExecuteAction(entityId, entityName, requestName, params) {
    // Creating the request XML for calling the Action
    var requestXML = "";
    requestXML += "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">";
    requestXML += "  <s:Body>";
    requestXML += "    <Execute xmlns=\"http://schemas.microsoft.com/xrm/2011/Contracts/Services\" xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\">";
    requestXML += "      <request xmlns:a=\"http://schemas.microsoft.com/xrm/2011/Contracts\">";
    requestXML += "        <a:Parameters xmlns:b=\"http://schemas.datacontract.org/2004/07/System.Collections.Generic\">";
    requestXML += "          <a:KeyValuePairOfstringanyType>";
    requestXML += "            <b:key>Target</b:key>";
    requestXML += "            <b:value i:type=\"a:EntityReference\">";
    requestXML += "              <a:Id>" + entityId + "</a:Id>";
    requestXML += "              <a:LogicalName>" + entityName + "</a:LogicalName>";
    requestXML += "              <a:Name i:nil=\"true\" />";
    requestXML += "            </b:value>";
    requestXML += "          </a:KeyValuePairOfstringanyType>";
    requestXML += params;
    requestXML += "        </a:Parameters>";
    requestXML += "        <a:RequestId i:nil=\"true\" />";
    requestXML += "        <a:RequestName>" + requestName + "</a:RequestName>";
    requestXML += "      </request>";
    requestXML += "    </Execute>";
    requestXML += "  </s:Body>";
    requestXML += "</s:Envelope>";

    var req = new XMLHttpRequest();
    req.open("POST", Xrm.Page.context.getClientUrl() + "/XRMServices/2011/Organization.svc/web", false);
    req.setRequestHeader("Accept", "application/xml, text/xml, */*");
    req.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
    req.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute");
    req.send(requestXML);
	// Get the response from the CRM Execute method
    var response = req.response;
    return response;
}
