var extension;
var anyValueModified = false;
var ignoreFieldsChanges = false;

const popupWinDefaultValut = false; //readonly
const cacheDefaultValut = true;     //readonly

function init() {
    extension = chrome.extension.getBackgroundPage();
    RuleManager = extension.RuleManager;
    Settings = extension.Settings;

    I18n = extension.I18n;
    I18n.process(document);
    document.body.style.visibility = "visible";

    initUI();
    loadOptions();
}

function initUI() {
    // Tab Control
    $("#tabsContainer div").click(function () {
        $("#tabsContainer div").removeClass("selected").addClass("normal");
        $(this).removeClass("normal").addClass("selected");
        $("#body .tab").hide();
        $("#" + $(this).attr("id") + "Body").show();
    });
	$("#tabsContainer .selected").click();
}

function loadOptions() {

    //ScopeMode
    var ScopeMode =  Settings.getValue("ScopeMode",1);
    $("input.ScopeMode[value='"+ScopeMode+"']").prop('checked',true);
    loadRules('scopeRules','sRules');
    if(ScopeMode == 2){
        $("#scopeRules").show();
    }

    // Globe Switch
    var popupWin =  Settings.getValue("popupWinGlobeSwitch",popupWinDefaultValut);
    $("#PopupWinSwitch").prop('checked', popupWin);
    var cache = Settings.getValue("cacheGlobeSwitch",cacheDefaultValut);
    $("#CacheSwitch").prop('checked',cache);

    // Xdebug IDE Key
    var xdebugIDEkey= Settings.getValue("xdebugIDEkey","PHPSTORM");
    var xdebugIDEcustomkey = Settings.getValue("xdebugIDEcustomkey","PHPSTORM");

    $("#ideCustomkey input").val(xdebugIDEcustomkey);
    if(xdebugIDEkey == "other"){
        $("#ideCustomkey").show();
    }
    $("#ideSelect").val(xdebugIDEkey);

    // Switch Rules
    ignoreFieldsChanges = true;
    $("#rulesTable .tableRow").remove();
    RuleManager.loadRules();
    var rules = RuleManager.getSortedRuleArray();
    var i, row, rule;
    for (i in rules) {
        if (rules.hasOwnProperty(i)) {
            rule = rules[i];
            row = newRuleRow(rule, false);
        }
    }
    ignoreFieldsChanges = false;
    anyValueModified = false;

    if(popupWin != popupWinDefaultValut){
        $(".PopupWinSwitch").hide();
        $("#tabPopupRules").hide();
    }
    if(cache != cacheDefaultValut){
        $(".CacheSwitch").hide();
    }
    if( popupWin != popupWinDefaultValut && cache != cacheDefaultValut){
        $("#rulesArea").hide();
    }

    // xdebug and xhprof rules
    var xdebugM = Settings.getValue("xdebugModel",1);
    if(xdebugM=="3"){
        $("#xdebugRules").show();
    }
    $("input.xdebugModel[value="+xdebugM+"]").prop('checked', true);
    loadRules('xdebugRules','xRules');
    loadRules('PopupRules','pRules');
}

function saveOptions() {
    // Switch Rules
    var rules = [];
    var rows = $("#rulesTable .tableRow");
    for (i = 0; i < rows.length; i++) {
        if ( rows[i].rule.url.trim() ){
            rules[rules.length] = rows[i].rule;
        }
    }

    RuleManager.setRules(rules);
    RuleManager.save();

    InfoTip.showMessageI18n("message_optionsSaved", InfoTip.types.success);
    //loadOptions();
    anyValueModified = false;
}

function closeWindow() {
    if (anyValueModified && InfoTip.confirmI18n("message_saveChangedValues"))
        saveOptions();
    window.close();
}

function resetOptions() {
    if (!InfoTip.confirmI18n("message_resetOptions"))
        return;

    if (!InfoTip.confirmI18n("message_resetOptionsConfirm"))
        return;

    extension.localStorage.clear();
    Settings.refreshCache();
    loadOptions();
    InfoTip.showMessageI18n("message_resetOptionsSuccess", InfoTip.types.success);
    anyValueModified = false;
}

function enterFieldEditMode(cell) {
    var input = $("input", cell);
    var span = $("span", cell);
    if (input.is(":visible"))
        return;
    var v = span.text();
    if (v == "-")
        input.val("");
    else
        input.val(span.text());
    input.toggle();
    span.toggle();
    input.focus();
//	input.select();
}

function exitFieldEditMode(cell) {
    var input = $("input",cell);
    var span = $("span", cell);
    var newValue = input.val().trim();
    if (newValue == "")
        newValue = "-"; // workaround for jQuery bug (toggling an empty span).

    if (!anyValueModified)
        anyValueModified = (span.text() != newValue);

    //var rule = cell.parentNode.parentNode.rule;
    //rule[input.attr("name")] = input.val();
    span.text(newValue);
    input.toggle();
    span.toggle();
}

function newRuleRow(rule,activate) {
    var table = $("#rulesTable");
    var row = $("#rulesTable .templateRow").clone();
    row.removeClass("templateRow").addClass("tableRow");

    if( $("input[name='popupWinGlobeSwitch']").prop('checked') != popupWinDefaultValut){
        $(".PopupWinSwitch",row).hide();
    }
    if( $("input[name='cacheGlobeSwitch']").prop('checked') != cacheDefaultValut){
        $(".CacheSwitch",row).hide();
    }

    table.append(row);

    if (rule) {
        row[0].rule = rule;
        $(".url", row).text(rule.url);
        $("select.enablePopupWin",row).val(rule.enablePopupWin);
        $("select.enableCache",row).val(rule.enableCache);
    } else {
        row[0].rule = RuleManager.getDefaultRule();
    }

    $("td", row).click(function () {
            enterFieldEditMode(this);
    });
    $("input", row).blur(function () {
        exitFieldEditMode(this.parentNode);
    }).keypress(function () {
            if (event.keyCode == 13) // Enter Key
                $(event.target).blur();
        });
    $("input, select", row).keydown(function () {
        if (event.keyCode == 9) { // Tab Key
            //$(event.target).blur();
            var nextFieldCell;
            if (!event.shiftKey)
                nextFieldCell = event.target.parentNode.parentNode.nextElementSibling;
            else
                nextFieldCell = event.target.parentNode.parentNode.previousElementSibling;

            $(nextFieldCell).click();
            $("input, select", nextFieldCell).focus().select();
            return false;
        }
    }).change(function(){
      var rule =  ($(this).closest(".tableRow"))[0].rule;
      rule[$(this).attr("name")] = $(this).val();
    });

    if (activate) {
        $("td:first", row).click();
        $("td:first input", row).select();
    }
}

function deleteRuleRow() {
    var row = $(event.target).closest("tr.tableRow");
    if ( InfoTip.confirmI18n("message_deleteSelectedRule", row.find(".url").text()) ) {
        row.remove();
        saveOptions();
        loadOptions();
        InfoTip.showMessageI18n("message_ruleDeleted", InfoTip.types.info);
    }
}

function loadRules(id,savedKey){
    var xRules = Settings.getObject(savedKey);
    if( xRules !=  undefined){
        var str = "";
        for( i in xRules){
            str += xRules[i]+"\n";
        }
        $("#"+id+" textarea").val(str);
    }
}
function saveRules(id,savedKey){
    var xRules=[];
    var Rules = $("#"+id+" textarea").val().split("\n");
    if (Rules.length == 1 && Rules[0] == '') return false;

    for( R in Rules){
        if (Rules[R] == "") continue;
        xRules[xRules.length] = Rules[R].trim();
    }

    Settings.setObject(savedKey,$.extend(true, {}, xRules));
    loadRules(id,savedKey);
    InfoTip.showMessageI18n("message_optionsSaved", InfoTip.types.success);
}
function resetRules(id,savedKey){
    Settings.setObject(savedKey,{});
    $("#"+id+" textarea").val('');
    InfoTip.showMessageI18n("message_ruleDeleted", InfoTip.types.info);
}

$(document).ready(function(){
    init();

    $("body").on("click", "div.delete.rule", deleteRuleRow);

    $("#btnNewRule").click(function(){
      newRuleRow(undefined, true);
    });

    $("input.globeCheckbox").click(function(){
        var id = $(this).attr("id");
        var name =  $(this).attr("name");
        Settings.setValue(name, $(this).prop('checked') );

        if( id == "PopupWinSwitch"){
            $("#tabPopupRules").fadeToggle();
        }

        $("."+id).each(function(){
            $(this).fadeToggle();
        });

        if( $("input[name='popupWinGlobeSwitch']").prop('checked') != popupWinDefaultValut && $("input[name='cacheGlobeSwitch']").prop('checked') != cacheDefaultValut){
            $("#rulesArea").hide();
        }else{
            $("#rulesArea").show();
        }
    });

    $(".ScopeMode").click(function(){
        var val  = $(this).attr("value");
        var name =  $(this).attr("name");
        Settings.setValue(name, val);
        if(val=="2"){
            $("#scopeRules").show();
        }else{
            $("#scopeRules").hide();
        }
    });

    $("input.xdebugModel").click(function(){
        var val = $(this).attr("value");
        var name =  $(this).attr("name");
        Settings.setValue(name, val);

        if(val=="3"){
            $("#xdebugRules").show();
        }else{
            $("#xdebugRules").hide();
        }
    });

    $("#ideSelect").change(function(){
        var val = $(this).val();
        if(val == "other"){
            $("#ideCustomkey").fadeIn();
        }else{
            $("#ideCustomkey").fadeOut();
        }
        Settings.setValue("xdebugIDEkey", val);
    });

    $("#saveIdeCustomkey").click(function(){
        var val = $("#ideCustomkey input").val();
        if(!val){
            InfoTip.showMessageI18n("options_saveXdebugIDEkeyError", InfoTip.types.error);
            return false;
        }
        Settings.setValue("xdebugIDEkey", "other");
        Settings.setValue("xdebugIDEcustomkey", val);
        InfoTip.showMessageI18n("options_saveXdebugIDEkeySuccess", InfoTip.types.success);
    });

    $("#saveScopeRules").click(function(){
        saveRules('scopeRules','sRules')
    });
    $("#resetXdebugRules").click(function(){
        resetRules('xdebugRules','xRules')
    });
    $("#saveXdebugRules").click(function(){
        saveRules('xdebugRules','xRules')
    });
    $("#resetPopupRules").click(function(){
        resetRules('PopupRules','pRules')
    });
    $("#savePopupRules").click(function(){
        saveRules('PopupRules','pRules')
    });

    $("#saveOptions").click(saveOptions);
    $("#resetOptions").click(resetOptions);
    $("#closeWindow").click(closeWindow);

    $(window).bind("beforeunload", function() {
        var message = I18n.getMessage("message_exitChangedValues");
        //console.log(message);
        return anyValueModified ? message : null;
    });

});
