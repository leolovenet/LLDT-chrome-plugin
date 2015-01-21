(function($){
	$.fn.tinyDraggable = function(options){
		var settings = $.extend({ handle: 0,exclude: 0}, options);
		return this.each(function(){
			var dx, dy, el = $(this), handle = settings.handle ? $(settings.handle, el) : el, emove = $("#lldt_menu_move", el);
			handle.on({
				mousedown: function(e){
					if (settings.exclude && ~$.inArray(e.target, $(settings.exclude, el))) return;
					e.preventDefault();

					var os = el.offset(); dx = e.pageX-os.left, dy = e.pageY-os.top;

					emove.css("visibility","hidden");
					el.css({"cursor" : "move","resize":"none"});

					$(document).on('mousemove.drag', function(e){
						el.css({
							"right"  : "auto",
							"bottom" : "auto",
							"top"    : e.clientY - dy,
							"left"   : e.clientX - dx
						});
					});
				},
				mouseup: function(e){
					$(document).off('mousemove.drag');
					emove.css("visibility","visible");
					el.css({"resize":"both","cursor": "auto"});

					var content = $("#lldt_content");
					content.css({
						"max-height" : "none",
						"max-width"  : "none",
						"width" 	 : content.width(),
						"height"     : content.height()
					});
				}
			});
		});
	}
}(jQuery));

$(document).ready(function() {
	var setPosition = "right";
	chrome.extension.sendMessage({name: "getRespInfo"}, function(response) {
		if(response.info != ""){
			$("body").prepend(
				'<div id="lldt_popupWin" class="lldt_popupWin_'+ setPosition+ '">'
				+ '<div id="lldt_menu">'
				+ 	'<div id="lldt_menu_move" class="lldt_hieght16" ></div>'
				+ 	'<div id="lldt_menu_close" class="lldt_hieght16"></div>'
				+ ' </div>'
				+ '<div id="lldt_content">'
				+ 	response.info
				+ '</div></div>'
				);
			$("#lldt_menu_close").click(function(){
				$("#lldt_popupWin").remove();
			});
			$('#lldt_popupWin').tinyDraggable({handle:"#lldt_menu"});
		}
	});
});
