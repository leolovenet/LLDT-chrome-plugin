var RuleManager = {};

RuleManager.rules = {};

RuleManager.defaultRule = {
    url:"",
    enablePopupWin:"N",
    enableCache:"Y"
};

RuleManager.init = function init() {

    // var firstRun = Settings.getValue("firstRun",true);
    // if(firstRun){
    //     var defaultRunles = {"0":{"url":"http://dev.leolovenet.com.*","enablePopupWin":"N","enableCache":"Y"}};
    //     Settings.setObject("rules",defaultRunles);
    //     Settings.setValue("firstRun",false);
    // }

    RuleManager.loadRules();
};

RuleManager.loadRules = function loadRules() {
    var rules = Settings.getObject("rules");
    if (rules != undefined) {
        RuleManager.rules = rules;
    }else{
      RuleManager.rules = {};
    }
};

RuleManager.save = function saveRules() {
    Settings.setObject("rules", RuleManager.rules);
};


RuleManager.getDefaultRule = function getDefaultRule() {
    // javascript  的对象赋值是传递引用，这里需要的是赋值操作，所以使用cloneObj函数.
    return Utils.cloneObj(RuleManager.defaultRule);
};

RuleManager.setRules = function setRules(rules) {
    rules = $.extend(true, {}, rules);
    RuleManager.rules = rules;
};

RuleManager.addRule = function addRule(rule) {
    RuleManager.rules[RuleManager.rules.length] = rule;
    RuleManager.save();
};

RuleManager.getRules = function getRules() {
    var rules = {};
    for (var i in RuleManager.rules) {
        if (RuleManager.rules.hasOwnProperty(i)) {
            var rule = RuleManager.rules[i];
            rule = RuleManager.normalizeRule(rule);
            rules[i] = rule;
        }
    }
    return rules;
};

RuleManager.getSortedRuleArray = function getSortedRuleArray() {
    var rules = RuleManager.getRules();
    var ruleArray = [];
    for (var i in rules) {
        if (rules.hasOwnProperty(i)) {
            ruleArray[ruleArray.length] = rules[i];
        }
    }

    ruleArray = ruleArray.sort(Utils.compareRules);
    return ruleArray;
};

RuleManager.normalizeRule = function normalizeRule(rule) {
    var newRule = RuleManager.getDefaultRule();
    $.extend(newRule, rule);
    return newRule;
};

RuleManager.equals = function equals(rule1, rule2) {
    return (rule1.url == rule2.url);
};

RuleManager.contains = function contains(rule) {
    var rules = RuleManager.getRules();
    for (var i in rules) {
        if (rules.hasOwnProperty(i)) {
            if (RuleManager.equals(rules[i], rule)) {
                return rules[i];
            }
        }
    }
    return undefined;
};

RuleManager.init();
