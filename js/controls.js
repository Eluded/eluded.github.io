/**
* Conrols
* v0.4 - May 15, 2016
* Hirad Sab; GNU/GPL License
* http://hiradsab.com
*
* Collection of helper methods for UI manipulation, requirement checking,
* device recognition, and URL parsing.
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, version 3 or later.
* http://www.gnu.org/licenses/
*/

/**
* Variable indicating nature of device
* @type {Boolean}
*/
var is_mobile = false;

/**
* True if WebGL is supported, false otherwise.
* @type  {Boolean}
*/
var is_webgl;
/**
* Visual quality, parsed from URL ?quality parameter.
* Can accept values of "low", "high" and "ultra".
* @type {String}
*/
var quality = ""
/**
* String parsed from ?start URL parameter, indicating if
* experience should be started immediately on page load.
* @type {String}
*/
var start = "false";

/**
* Series of requirement checking and UI manipulation after
* loading of DOM content.
*/
$(document).ready(function(){
  is_mobile = detect_mobile();
  is_webgl = detect_webgl();
  $(".regular-controls").hide();
  $("#webgl-message").hide();
  $("#vr-message").hide();
  if (is_webgl[0]){
    // WebGL is supported
    if (is_mobile){
      // Device is Mobile
      $(".desktop-buttons").hide();
    }
    else {
      // Device is not mobile
      $(".mobile-buttons").hide();
      if (navigator.getVRDisplays) {
        // VR is supported
      }
      else {
        // VR is not supported
        $(".vr-button").hide();
        $(".regular-button").text("Enter");
        $("#vr-message").show();
      }
    }
  }
  else {
    // WebGL is not supported
    $("#webgl-message").show();
    $("#webgl-error").text(is_webgl[1]);
    $("#vr-message").hide();
    $(".mobile-buttons").hide();
    $(".desktop-buttons").hide();
  }
  url_parser();
});

/**
* Responsible for parsing URL parameters and setting the
* options appropriately
*/
function url_parser(){
  try {
    quality = url('?quality').replace(/\/$/, "");
  }catch(e){};

  if (is_mobile) {
    quality = "high";
  }

  try {
    start = url('?start').replace(/\/$/, "");
  }catch(e){};

  if (start == "true") {
    load_regular();
  }

  history.replaceState("", "Eluded VR", "/");
}

/**
* Detects if user's device is mobile or not.
* @return {Boolean} [True if mobile, false otherwise]
*/
function detect_mobile() {
  if( navigator.userAgent.match(/Android/i)
  || navigator.userAgent.match(/webOS/i)
  || navigator.userAgent.match(/iPhone/i)
  || navigator.userAgent.match(/iPad/i)
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/BlackBerry/i)
  || navigator.userAgent.match(/Windows Phone/i)) {
    return true;
  } else {
    return false;
  }
};

/**
* Detects if user's device supports WebGL or not.
* @return {Array} [Boolean: True if enabled, String: Support Message]
*/
function detect_webgl()
{
  if (!!window.WebGLRenderingContext) {
    var canvas = document.createElement("canvas"),
    names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
    context = false;
    for(var i=0;i<4;i++) {
      try {
        context = canvas.getContext(names[i]);
        if (context && typeof context.getParameter == "function") {
          return [true, "WebGL is supported and enabled."];
        }
      } catch(e) {}
    }
    return [false, "Error: WebGL is supported but disabled."];
  }
  return [false, "Error: WebGL is not supported."];
}

/**
* Hides the UI elements for WebGL canvas initialization.
*/
function hide_ui(){
  $(".ui").hide();
  $(".bg").hide();
  $(".footer").hide();
}
