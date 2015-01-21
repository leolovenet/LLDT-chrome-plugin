var currentRespHeaders = {};
//下面两个变量不能被重新赋值
// aoubt const, see  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
const popupWinDefaultValut = false; //readonly
const cacheDefaultValut = true;     //readonly

function isMatchRules(key,url){
    var xRules = Settings.getObject(key);
    var match = false;
    if( xRules !=  undefined){
        for( i in xRules){
            var urlRE = new RegExp("^"+xRules[i]+"$","i");
            if(urlRE.test(url)){
                match = true;
                break;
            }
        }
    }
    return match;
}

function isTurnOnLLDT(url){
    var ScopeMode = Settings.getValue("ScopeMode",1);
    if ( (ScopeMode == 2)  &&  ! isMatchRules("sRules", url) ){
        return false;
    }else{
        return true;
    }
}

function updateIcon(status, tabId, title){

    if(!title) title = "Debugging, profiling , tracing & xhporf disabled",
        image = "assets/images/i-logo.png";

        if (status == 1)
        {
            if(!title) title = "Debugging enabled";
            image = "assets/images/i-debug.png";
        }
        else if (status == 2)
        {
            if(!title) title = "Profiling enabled";
            image = "assets/images/i-profile.png";
        }
        else if (status == 3)
        {
            if(!title) title = "Tracing enabled";
            image = "assets/images/i-trace.png";
        }
        else if (status == 4)
        {
            if(!title) title = "Xhprof enabled";
            image = "assets/images/i-xhprof.png";
        }

        // Update title
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: title
        });
        // Update image
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: image
        });
}

function openOptionsTab() {
    var url = "options.html";
    var fullUrl = chrome.extension.getURL(url);
    chrome.tabs.getAllInWindow(null, function (tabs) {
        for (var i in tabs) { // check if Options page is open already
            if (tabs.hasOwnProperty(i)) {
                var tab = tabs[i];
                if (tab.url == fullUrl) {
                    chrome.tabs.update(tab.id, { selected:true }); // select the tab
                    return;
                }
            }
        }
        chrome.tabs.getSelected(null, function (tab) { // open a new tab next to currently selected tab
            chrome.tabs.create({
                url:url,
                index:tab.index + 1
            });
        });
    });
}

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        //console.log( tabId + "onUpdated");
    /*
        console.log( JSON.stringify(tabId));
            2203
        console.log( JSON.stringify(changeInfo));
            {"status":"loading"}
            {"status":"complete"}
        console.log( JSON.stringify(tab));
            {
                "active":true,
                "height":805,
                "highlighted":true,
                "id":2203,
                "incognito":false,
                "index":2,
                "pinned":false,
                "selected":true,
                "status":"loading",
                "title":"tools.leolovenet.com/index.php",
                "url":"http://tools.leolovenet.com/index.php",
                "width":1436,
                "windowId":14
            }
            {
                "active":true,
                "favIconUrl":"http://images01.leolovenet.com/images/favicon.ico",
                "height":805,
                "highlighted":true,
                "id":2203,
                "incognito":false,
                "index":2,
                "pinned":false,
                "selected":true,
                "status":"complete",
                "title":"易登网 | 刘先生 | 信息管理",
                "url":"http://tools.leolovenet.com/index.php",
                "width":1436,
                "windowId":14
            }
    */
    if ( tab.url.indexOf("http") !== 0){
        return;
    }

    if(!isTurnOnLLDT(tab.url)) return;

    //在地址栏显示图标
    chrome.pageAction.show(tabId);

    var match = true;
    var xdebugM = Settings.getValue("xdebugModel",1);
    if(xdebugM == 3){
        match = isMatchRules("xRules",tab.url);
    }
    if(match){
        var activeItem = Settings.getValue("activeItem",0);
        updateIcon(activeItem, tabId);
    }

});

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(info){
        /*
        console.log(JSON.stringify(info));
        {
            "frameId": 0,
            "method": "GET",
            "parentFrameId": -1,
            "requestHeaders": [
                {
                    "name": "Accept",
                    "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,* /*;q=0.8"
                },
                {
                    "name": "User-Agent",
                    "value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
                },
                {
                    "name": "DNT",
                    "value": "1"
                },
                {
                    "name": "Referer",
                    "value": "http://tools.leolovenet.com/"
                },
                {
                    "name": "Accept-Encoding",
                    "value": "gzip, deflate, sdch"
                },
                {
                    "name": "Accept-Language",
                    "value": "en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4,zh-TW;q=0.2,ja;q=0.2,es;q=0.2"
                },
                {
                    "name": "Cookie",
                    "value": "login_id=leolovenet; name=%E5%88%98%E5%85%88%E7%94%9F;"
                }
            ],
            "requestId": "69768",
            "tabId": 2203,
            "timeStamp": 1417509661195.205,
            "type": "main_frame",
            "url": "http://tools.leolovenet.com/index.php"
        }
        */
        if(!isTurnOnLLDT(info.url)) return;

        //用于在popupWin中显示本网页是否开启了Cache
        if( info.type == "main_frame" ){
            currentRespHeaders[info.url]={};
            currentRespHeaders[info.url]["Cache-isDisable"]=cacheDefaultValut;
            currentRespHeaders[info.url]["TimeStamp"]=info.timeStamp;
        }
        //检查全局Cache开关是否为默认值
        if(Settings.getValue("cacheGlobeSwitch",cacheDefaultValut) == cacheDefaultValut){
            var disableCache = cacheDefaultValut;
            var Rules = RuleManager.getRules();
            for ( i in Rules ){ //检查URL是否明确指定了开启缓存
                var rulesRE = new RegExp('^'+Rules[i].url+'$',"i");
                if ( rulesRE.test(info.url) && Rules[i].enableCache == "Y" ){
                    disableCache = !cacheDefaultValut;
                    if( info.type == "main_frame" ){
                        currentRespHeaders[info.url]["Cache-isDisable"]=disableCache;
                    }
                    break;
                }
            }
            if(disableCache == cacheDefaultValut){
                var hasSetCacheControl=false;
                var hasSetPragma=false;
                for (var i = 0; i < info.requestHeaders.length; ++i) {
                    if (info.requestHeaders[i].name == 'Cache-Control') {
                        info.requestHeaders[i].value = 'no-cache';
                        hasSetCacheControl = true;
                    }
                    else if (info.requestHeaders[i].name == 'Pragma') {
                        info.requestHeaders[i].value = 'no-cache';
                        hasSetPragma = true;
                    }
                    //注意下面两个属性不能删除
                    //目前测试发现，如果删除，在真正发送http请求的时候，又添加上了If-Modified-Since头信息
                    //所以这里使用重新赋值的办法解决。
                    else if (info.requestHeaders[i].name == 'If-Modified-Since') {
                        info.requestHeaders[i].value = 'Wed, 09 Oct 2000 09:02:57 GMT';
                    }
                    else if (info.requestHeaders[i].name == 'If-None-Match') {
                        info.requestHeaders[i].value = '';
                    }
                }
                //console.table(info.requestHeaders);
                if(!hasSetCacheControl){
                    info.requestHeaders.push({
                        "name":"Cache-Control",
                        "value":"no-cache"
                    })
                }
                if(!hasSetPragma){
                    info.requestHeaders.push({
                        "name":"Pragma",
                        "value":"no-cache"
                    })
                }
            }
        }else{
            if( info.type == "main_frame" ){
                currentRespHeaders[info.url]["Cache-isDisable"] = !cacheDefaultValut;
            }
        }

        // Xdebug 相关事项
        var activeItem = Settings.getValue("activeItem",0);
        if(activeItem){ //如果开启调试功能
            var xdebugM = Settings.getValue("xdebugModel",1);
            var match = true;

            if( (xdebugM == 2) && (info.type != "main_frame") ){
                match = false;
            }
            else if(xdebugM == 3)
            {
                match = isMatchRules("xRules",info.url);
            }
            if(match){
                //在地址栏显示图标
                chrome.pageAction.show(info.tabId);
                updateIcon(activeItem, info.tabId, info.url);

                var cookieName="";
                if (activeItem == 1){ //debug
                    cookieName = "XDEBUG_SESSION";
                }else if (activeItem == 2){ //profile
                    cookieName = "XDEBUG_PROFILE";
                }else if (activeItem == 3){ //trace
                    cookieName = "XDEBUG_TRACE";
                }else if( activeItem == 4){ // xhprof
                    cookieName = "XHPROF_PROFILE";
                }

                if(cookieName){
                    var xdebugIDEkey= Settings.getValue("xdebugIDEkey","PHPSTORM");
                    if(xdebugIDEkey == "other"){
                        xdebugIDEkey = Settings.getValue("xdebugIDEcustomkey","PHPSTORM");
                    }
                    var cookie = cookieName+"="+xdebugIDEkey, isSetCookie=false;
                    for (var i = 0; i < info.requestHeaders.length; ++i) {
                        if (info.requestHeaders[i].name == 'Cookie') {
                            info.requestHeaders[i].value += "; "+cookie;
                            isSetCookie = true;
                            break;
                        }
                    }
                    if(!isSetCookie){
                        info.requestHeaders.push({
                            "name":"Cookie",
                            "value":cookie
                        });
                    }
                }
            }
        }

        //告诉web服务器在回应头显示服务器的名字
        info.requestHeaders.push({
            "name":"Show-Server-Name",
            "value":"1"
        });

        return {requestHeaders: info.requestHeaders};
    },
    {
        urls: ["<all_urls>"]
    },
    ["blocking","requestHeaders"]
);

chrome.webRequest.onCompleted.addListener(
    function(info) {
        //console.log(info);
        /*
            frameId: 0
            fromCache: false
            ip: "61.135.169.125
            "method: "GET"
            parentFrameId: -1
            requestId: "7171"
            responseHeaders: Array[14]
            statusCode: 200
            statusLine: "HTTP/1.1 200 OK"
            tabId: 386
            timeStamp: 1415268395005.544
            type: "main_frame"
            url: "http://www.baidu.com/"
        */
        //console.log(typeof(info.url));
        if ( typeof(info.tabId) != "undefined" ){

            if(!isTurnOnLLDT(info.url)) return;

            //已经在onBeforeSendHeaders中初始化了
            currentRespHeaders[info.url]["IP"] = info.ip;
            currentRespHeaders[info.url]["TimeStamp"] = ( info.timeStamp - currentRespHeaders[info.url]["TimeStamp"] ).toFixed(1);
            //console.log( JSON.stringify(info.responseHeaders));
            info.responseHeaders.forEach(function(v,i,a){
                currentRespHeaders[info.url][ v.name ] = v.value ;
            });
        }
        return;
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame"]  //只针对主HTTP请求
    },
    ["responseHeaders"]
);

// Listeners
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse){
        //console.log(sender.tab.id + "onMessage");
        /*
        console.table(JSON.stringify(request));
            {"name":"getIP"}
            {"name":"getOptions"}

        console.table(JSON.stringify(sender.tab));
        {
            "active":true,
            "height":805,
            "highlighted":true,
            "id":2203,
            "incognito":false,
            "index":2,
            "pinned":false,
            "selected":true,
            "status":"loading",
            "title":"易登网 | 刘先生 | 信息管理",
            "url":"http://tools.leolovenet.com/index.php",
            "width":1436,
            "windowId":14
        }
        */
        if(!isTurnOnLLDT(sender.tab.url)) return;

        switch (request.name)
        {
            case "getTabID":
                sendResponse({id: sender.tab.id});
                break;
            case "getRespInfo":
                var url = sender.tab.url;
                var VSTRING="";
                if (url === undefined) {
                    VSTRING += I18n.getMessage("HTTP_URL_GetError")+"<br/>";
                };

                if (currentRespHeaders[url] !== undefined) {
                    //默认是显示 popupWin
                    if(Settings.getValue("popupWinGlobeSwitch",popupWinDefaultValut) == popupWinDefaultValut){
                        var Rules = RuleManager.getRules();
                        //默认开启popupWin
                        var disablePopupWin = popupWinDefaultValut;
                        for ( i in Rules){
                            var re = new RegExp('^'+Rules[i].url+'$',"i");
                            //  console.log(re + " " + url + " " + Rules[i].enablePopupWin);
                            //  针对单独设置了关闭popupWin规则的URL
                            if ( re.test(url) && Rules[i].enablePopupWin == "N"){
                                disablePopupWin = !popupWinDefaultValut;
                                // console.log("disablePopupWin was Set: "+ disablePopupWin + " , So disable popupWin of " + url);
                                break;
                            }
                        }
                        if (disablePopupWin == popupWinDefaultValut){
                            var IPSTR=SERVERSTR=CacheOnOff=TimeStamp="";
                            for (var i in currentRespHeaders[url]) {
                                if( i == "IP"){
                                    IPSTR = '<tr><td class="popup_k">' + I18n.getMessage("HTTP_Hearders_IP") +'</td><td class="popup_v IP">'+ currentRespHeaders[url][i] + "</td></tr>";
                                }else if( i == "Server-Name" || i == "Via" ){
                                    SERVERSTR = '<tr><td class="popup_k">'+ I18n.getMessage("HTTP_Hearders_Server_Name") +'</td><td class="popup_v ServerName">'+ currentRespHeaders[url][i] + "</td></tr>";
                                }else if( i == "Cache-isDisable"){
                                    var cacheStr =  (currentRespHeaders[url][i]) ? I18n.getMessage("HTTP_Hearders_Cache_isDisable_true") : I18n.getMessage("HTTP_Hearders_Cache_isDisable_false") ;
                                    CacheOnOff = '<tr><td class="popup_k">' + I18n.getMessage("HTTP_Hearders_Cache_isDisable") + '</td><td class="popup_v CacheOnOff">'+  cacheStr + "</td></tr>";
                                }else if( i == 'TimeStamp') {
                                    TimeStamp = '<tr><td class="popup_k">' + I18n.getMessage("HTTP_Hearders_TimeStamp") + '</td><td class="popup_v TimeStamp">'+ currentRespHeaders[url][i] + "</td></tr>";
                                }else{
                                    if(isMatchRules("pRules",i)) continue;
                                    VSTRING += '<tr><td class="popup_k">'+ i +'</td><td class="popup_v">'+ currentRespHeaders[url][i] + "</td></tr>";
                                }
                            }
                            VSTRING = "<table>" + IPSTR + SERVERSTR  + CacheOnOff + TimeStamp + VSTRING + "</table>";
                        }
                        // 清理内存
                        currentRespHeaders[url] = null;
                        delete currentRespHeaders[url];
                    }
                }else{
                    VSTRING=I18n.getMessage("HTTP_Hearders_GetError");
                }

                sendResponse({info: VSTRING});
                break;

            default:
                sendResponse({});
        }
});
