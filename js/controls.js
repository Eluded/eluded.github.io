var is_mobile = false;
var is_webgl;
var quality = ""
var start = "false";

$(document).ready(function(){

  is_mobile = detect_mobile();
  is_webgl = detect_webgl();
  $(".regular-controls").hide();
  $("#webgl-message").hide();
  $("#vr-message").hide();
  // Browser is not firefox
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

function detect_webgl(return_context)
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


function hide_ui(){
  $(".ui").hide();
  $(".bg").hide();
  $(".footer").hide();
}
