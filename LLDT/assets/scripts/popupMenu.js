var extension;

function init() {
	extension = chrome.extension.getBackgroundPage();
	ProfileManager = extension.ProfileManager;
	Settings = extension.Settings;

	I18n = extension.I18n;
	I18n.process(document);

	if(navigator.userAgent.indexOf("Mac OS") != -1){
		$("#command").text("Command+Shift+X");
	}
}

function openOptionsTab() {
	window.close();
	extension.openOptionsTab();
}

$(document).ready(function(){
	init();
	$("#options").click(openOptionsTab);

	var activeItem = Settings.getValue("activeItem",0);
	if(activeItem){
		$('div.action[data-status="' + activeItem + '"]').addClass("active").find(".status").text("Disable");
	}

	// Attach handler when user clicks on
	$("div.action").click(function() {
		var newStatus = $(this).data("status");
		if($(this).hasClass("active")){
			newStatus = 0;
		}
		Settings.setValue("activeItem",newStatus);

		// Set the new state on the active tab
		chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, function(tabs){
			extension.updateIcon(newStatus, tabs[0].id);
			window.close();
		});
	});

	// Shortcuts
	key("o", function() { $("#options").click(); });
	key("d", function() { $("#action-debug").click(); });
	key("p", function() { $("#action-profile").click(); });
	key("t", function() { $("#action-trace").click(); });
	key("x", function() { $("#action-xhprof").click(); });
});
