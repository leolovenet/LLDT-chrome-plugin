var Utils = {};

Utils.OS = {
    isMac:(/mac/i).test(navigator.userAgent), // maybe should test |navigator.platform| instead?
    isWindows:(/win/i).test(navigator.userAgent),
    isLinux:(/linux/i).test(navigator.userAgent)
};

Utils.compareStrings = function compareStrings(s1, s2) {
    if(s1 == undefined || s2 == undefined) return false;
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    var length = Math.min(s1.length, s2.length);
    for (var i = 0; i < length; i++) {
        var ch1 = s1.charCodeAt(i);
        var ch2 = s2.charCodeAt(i);
        if (ch1 != ch2)
            return ch1 - ch2;
    }
    return s1.length - s2.length;
};

Utils.compareNamedObjects = function compareNamedObjects(o1, o2) {
    return Utils.compareStrings(o1.name, o2.name);
};

Utils.compareRules = function compareRules(o1, o2) {
    return Utils.compareStrings(o1.url, o2.url);
};

Utils.cloneObj  = function cloneObj(obj){
  	var newobj, s;
    if(typeof obj !== 'object'){
      return;
    }
    newobj = obj.constructor === Object ? {} : [];
	if(window.JSON){
		s = JSON.stringify(obj), //系列化对象
		newobj = JSON.parse(s);  //反系列化（还原）
	}else{
		if(newobj.constructor === Array){
			newobj.concat(obj);
		}else{
			for(var i in obj){
				newobj[i] = obj[i];
			}
		}
	}
	return newobj;
};

Utils.isValueInArray =  function(arr, val)
{
    if ( (typeof(arr) != "object") || !val ) return false;

    for (i = 0; i < arr.length; i++)
    {
        var re = new RegExp(arr[i], "gi");
        if (re.test(val))
        {
            return true;
        }
    }

    return false;
};
