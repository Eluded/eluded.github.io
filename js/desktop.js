

function load_regular(is_vr){
  hide_ui();
  if (is_mobile && navigator.userAgent.match(/Android/i)) {
    screenfull.request();
  }
  else if (!is_mobile) {
    screenfull.request();
  }

  if (!is_mobile && is_vr == null){
    $(".regular-controls").show();
  }

  "use strict"
  b4w.register("eluded_vr", function(exports, require) {

    var m_app	= require("app");
    var m_data	= require("data");
    var m_cfg	= require("config");
    var m_scene	= require("scenes");

    var m_obj = require("objects");
    var m_trans	= require("transform");
    var m_geom	= require("geometry");
    var m_anim  = require("animation");

    var m_ctl	= require("controls");
    var m_cam = require("camera");
    var m_mouse = require("mouse");
    var m_inp = require("input");

    var m_hmd    = require("hmd");

    var m_vec3 = require("vec3");
    var m_util = require("util");
    var m_quat = require("quat");

    var m_cont = require("container");

    var m_preloader = require("preloader");
    var PRELOADING = true;

    var properties;
    var sphere;
    var tunnel;
    var shrub;

    var spheres_parent;
    var sphere_empties;
    var sphere_objects = [];

    var shrub_parent;
    var shrub_empties;

    var frame;
    var prev_frame = -1;

    var camera;
    var visible_radius = 5;

    var camera_smooth_fact = 2;
    var camera_rot_fact = 20;

    var sphere_scale_min = 0.1;

    var _last_gyro_quat = m_quat.create();
    var _quat_tmp = m_quat.create();
    var _quat_tmp2 = m_quat.create();
    var _vec3_tmp = m_vec3.create();

    function set_quality(){
      switch (quality) {
        case "":
        return m_cfg.P_HIGH;
        break;
        case "high":
        return m_cfg.P_HIGH;
        break;
        case "low":
        return m_cfg.P_LOW;
        break;
        case "ultra":
        return m_cfg.P_ULTRA;
        break;
      }
    }

    exports.init = function() {
      if (is_vr != null) {
        m_cfg.set("stereo", "HMD");
      }
      m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: true,
        console_verbose: true,
        autoresize: true,
        quality: set_quality(),
        gyro_use: is_mobile
      });
    }

    function init_cb(canvas_elem, success) {
      if (!success) {
        return;
      }
      m_preloader.create_simple_preloader({
        bg_color: "white",
        bar_color: "black",
        background_container_id: "background_image_container",
        canvas_container_id: "main_canvas_container"
      });
      load();
    }

    function load() {
      var p_cb = PRELOADING ? preloader_callback : null;
      m_data.load("eluded_vr.json", load_cb, p_cb, !true);
    }

    function preloader_callback(percentage) {
      m_preloader.update_preloader(percentage);
    }

    function load_cb(data_id) {
      m_app.enable_camera_controls();
      camera = m_scene.get_active_camera();
      if (is_vr != null) {
        var fov = 200;
        m_cam.set_hmd_fov(camera, [fov, fov, fov, fov], [fov, fov, fov, fov])
      }

      if (is_vr == 0) {
        m_scene.set_hmd_params({
          enable_hmd_stereo: true,
          distortion_scale: 1,
          inter_lens_dist: 0.064,
          base_line_dist: 0.035,
          screen_to_lens_dist: 0.039,
          distortion_coefs : [0.22, 0.28],
          chromatic_aberration_coefs : [-0.015, 0.02, 0.025, 0.02]
        });
      }
      if (is_vr == 1) {
        m_scene.set_hmd_params({
          enable_hmd_stereo: true,
          distortion_scale: 1,
          inter_lens_dist: 0.060,
          base_line_dist: 0.035,
          screen_to_lens_dist: 0.042,
          distortion_coefs: [0.441, 0.156],
          chromatic_aberration_coefs : [0.0, 0.0, 0.0, 0.0]
        });
      }
      if (is_vr == 2) {
        m_scene.set_hmd_params({
          enable_hmd_stereo: true,
          distortion_scale: 1,
          inter_lens_dist: 0.064,
          base_line_dist: 0.035,
          screen_to_lens_dist: 0.039,
          distortion_coefs: [0.34, 0.55],
          chromatic_aberration_coefs : [0.0, 0.0, 0.0, 0.0]
        });
      }

      if (is_mobile && m_inp.can_use_device(m_inp.DEVICE_GYRO)){
        create_rotation_sensors();
        m_trans.set_rotation_euler(camera, 0,0,0);
      }
      if (!is_mobile && is_vr == null) {
        var canvas_elem = m_cont.get_canvas();

        canvas_elem.addEventListener("mouseup", function(e) {
          m_mouse.request_pointerlock(canvas_elem, null, null, null, null, rot_cb);
          $(".regular-controls").hide();
        }, false);

        m_mouse.set_plock_smooth_factor(camera_smooth_fact);
      }

      properties = m_scene.get_object_by_name("properties");
      sphere = m_scene.get_object_by_name("Sphere");
      tunnel = m_scene.get_object_by_name("Curve_Tunnel");
      shrub = m_scene.get_object_by_name("Shrub");

      sphere.random1 = Math.random();
      sphere.random2 = Math.random();
      sphere.random3 = Math.random();

      spheres_parent = m_scene.get_object_by_name("listParent");
      sphere_empties = m_scene.get_object_children(spheres_parent);

      shrub_parent = m_scene.get_object_by_name("plantsParent");
      shrub_empties = m_scene.get_object_children(shrub_parent);

      setup_anim();

      window.addEventListener("keydown", function(e){
        if(e.keyCode === 49  || e.keyCode === 97 && document.activeElement !== 'text') {
          _url = "/?quality=low&start=true";
          window.location.assign(_url);
        }
        if(e.keyCode === 50 || e.keyCode === 98 && document.activeElement !== 'text') {
          _url = "/?quality=high&start=true";
          window.location.assign(_url);
        }
        if(e.keyCode === 51 || e.keyCode === 99 && document.activeElement !== 'text') {
          _url = "/?quality=ultra&start=true";
          window.location.assign(_url);
        }
      });
    }

    function rot_cb(rot_x, rot_y) {
      m_cam.eye_rotate(camera, rot_x*camera_rot_fact, rot_y*camera_rot_fact);
    }

    function get_frame(){
      frame = parseInt(m_anim.get_frame(properties, 0), 10);
    }
    function prop(prop){
      return get_prop_points(properties, prop, frame);
    }

    function get_prop_points(obj, prop ,frame){
      if (prop == 0)
      return obj.actions[0].fcurves['["prop"]'][0]._pierced_points[frame];
      else
      return obj.actions[0].fcurves['["prop' + prop + '"]'][0]._pierced_points[frame];
    }

    function prop_channel(num){
      return parseInt(num * 8, 10);
    }

    function random(){
      var random = parseInt(Math.random()*8, 10);
      return random;
    }

    function degree(num){
      return num * 360;
    }

    function radian(num){
      return num * Math.PI;
    }

    function setup_plants(){
      for (var i = 0; i < shrub_empties.length; i++) {
        var empty = shrub_empties[i];
        var emptyLocation = m_trans.get_translation(empty);
        var emptyRotation = m_trans.get_rotation(empty);
        var emptyScale = m_trans.get_scale(empty);

        var currentObject = m_obj.copy(shrub, "Shrub"+i, false);

        m_trans.set_translation(currentObject, emptyLocation[0],emptyLocation[1],emptyLocation[2]);
        m_trans.set_rotation(currentObject, emptyRotation[0], emptyRotation[1], emptyRotation[2], emptyRotation[3]);
        m_trans.set_scale(currentObject, emptyScale);

        m_scene.append_object(currentObject);
      }
    }

    function setup_objectList(){
      for (var i = 0; i < sphere_empties.length; i++) {
        var empty = sphere_empties[i];
        var emptyLocation = m_trans.get_translation(empty);
        var currentObject = m_obj.copy(sphere, "Sphere"+i, false);
        currentObject.random1 = Math.random();
        currentObject.random2 = Math.random();
        currentObject.random3 = Math.random();
        currentObject.isAdded = false;
        m_trans.set_translation(currentObject, emptyLocation[0],emptyLocation[1],emptyLocation[2]);
        m_trans.set_rotation_euler(currentObject, Math.random()*180,Math.random()*180,Math.random()*180);
        var candid_scale = currentObject.random1*currentObject.random2;
        if (candid_scale < sphere_scale_min){
          // candid_scale = Math.random() * (1 - scale_limit) + scale_limit;
          candid_scale = sphere_scale_min;
        }
        m_trans.set_scale(currentObject, candid_scale);

        sphere_objects.push(currentObject);
      }
    }

    function is_in_camera_range(obj) {
      var objectLocation = m_trans.get_translation(obj)
      var cameraLocation = m_trans.get_translation(camera)
      var distance = m_vec3.distance(cameraLocation, objectLocation);
      if (distance < visible_radius){
        return true;
      }
      else {
        return false;
      }
    }

    function append_to_scene(){
      for (var i = 0; i < sphere_objects.length; i++){
        var currObj = sphere_objects[i];
        if (currObj.isAdded == false && is_in_camera_range(currObj)){
          currObj.isAdded = true;
          m_scene.append_object(currObj);
        }
        if (currObj.isAdded == true && is_in_camera_range(currObj) == false) {
          currObj.isAdded = false;
          m_scene.remove_object(currObj);
        }
      }
    }

    function setup_anim() {
      setup_objectList();
      setup_plants();

      var elapsed = m_ctl.create_timeline_sensor();
      var sens_array = [elapsed];
      var logic = function(s) {return (s[0])};

      function anim_cb(obj, id, pulse) {
        get_frame();
        append_to_scene();
        if (frame != prev_frame){
          m_geom.set_shape_key_value(sphere, "dispOne", prop(0));
          m_geom.set_shape_key_value(sphere, "dispFour", prop(3));
          m_geom.set_shape_key_value(sphere, "defTwo", prop(2));
          m_geom.set_shape_key_value(sphere, "defThree", prop(1)+prop(7));
          m_geom.set_shape_key_value(sphere, "pacif", prop(4));

          for (var i = 0; i < sphere_objects.length; i++){
            var currObj = sphere_objects[i];
            var d1 = degree(currObj.random1);
            var d2 = degree(currObj.random2);
            var d3 = degree(currObj.random3);
            var prop1 = prop_channel(currObj.random1);
            var prop2 = prop_channel(currObj.random2);
            var prop3 = prop_channel(currObj.random3);
            m_trans.set_rotation_euler(currObj, d1 + prop(prop1), d2 + prop(prop2),d3 + prop(prop3));
          }

          if (frame < 5){
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "sky_hue"], 0);
            m_obj.set_nodemat_value(sphere, ["Sphere", "alpha_value"], 0);
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "alpha_value"], 0);

            m_obj.set_nodemat_value(tunnel, ["Tunnel", "skin_tone"], 0);
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "wire_orig"], 1);
          }

          if (frame > 787 && frame < 1312) {
            m_obj.set_nodemat_value(sphere, ["Sphere", "alpha_value"], prop(2));
          }

          if (frame > 1313 && frame < 2355) {
            if (prop(3) > 1) {
              m_obj.set_nodemat_value(tunnel, ["Tunnel", "alpha_value"], 1);
            }
            else {
              m_obj.set_nodemat_value(tunnel, ["Tunnel", "alpha_value"], 0);
            }
          }

          if (frame > 2356 && frame < 3411) {
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "sky_hue"], prop(0));
            m_scene.set_mb_params({mb_factor: prop(6), mb_decay_threshold: prop(6)});
            if (prop(6) > 0.3)
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "wire_orig"], 1);
            else
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "wire_orig"], 0);
          }

          if (frame == 2356){
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "alpha_value"], 1);
          }

          if (frame>4200) {
            m_obj.set_nodemat_value(tunnel, ["Tunnel", "skin_tone"], (frame-4200)/(4584-4200));
            m_obj.set_nodemat_value(sphere, ["Sphere", "alpha_value"], (4584 - frame)/(4584-4200));
          }

          if (frame > 4436) {
            if (prop(7) > 0.245) {
              m_obj.set_nodemat_value(tunnel, ["Tunnel", "wire_orig"], 0);
            }
            else {
              m_obj.set_nodemat_value(tunnel, ["Tunnel", "wire_orig"], 1);
              m_obj.set_nodemat_value(tunnel, ["Tunnel", "sky_hue"], 0);
            }
          }
          prev_frame = frame;
        }
      }
      m_ctl.create_sensor_manifold(properties, "ANIM", m_ctl.CT_CONTINUOUS,sens_array, logic, anim_cb);
    }

    function create_rotation_sensors() {
      var obj = m_scene.get_active_camera();
      var g_sensor = m_ctl.create_gyro_angles_sensor();
      var save_angles = true;

      var rotate_cb = function(obj, id, pulse) {
        if (pulse > 0) {

          var curr_angles = m_ctl.get_sensor_payload(obj, id, 0);
          if (m_cam.is_eye_camera(obj)) {
            var alpha = curr_angles[2];
            var beta  = curr_angles[1];
            var gamma = curr_angles[0];

            var quaternion = _quat_tmp;
            var c1 = Math.cos(alpha / 2);
            var c2 = Math.cos(beta  / 2);
            var c3 = Math.cos(gamma / 2);
            var s1 = Math.sin(alpha / 2);
            var s2 = Math.sin(beta  / 2);
            var s3 = Math.sin(gamma / 2);
            quaternion[0] = c1 * s2 * c3 - s1 * c2 * s3;
            quaternion[1] = c1 * c2 * s3 + s1 * s2 * c3;
            quaternion[2] = s1 * c2 * c3 + c1 * s2 * s3;
            quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;

            var orientation = Math.PI * window.orientation / 180;
            var screen_quat = m_quat.setAxisAngle(m_util.AXIS_Z,
              -orientation, _quat_tmp2);

              quaternion = m_quat.multiply(quaternion, screen_quat, _quat_tmp);

              var quat = m_quat.setAxisAngle(m_util.AXIS_X, Math.PI / 2,
                _quat_tmp2);
                quaternion = m_quat.multiply(quaternion, quat, _quat_tmp);

                if (save_angles) {
                  m_quat.copy(quaternion, _last_gyro_quat);
                  save_angles = false;
                } else {
                  var last_gyro_inv_quat = m_quat.invert(_last_gyro_quat, _last_gyro_quat);
                  var cam_quat = m_trans.get_rotation(obj, _quat_tmp2);
                  var clear_cam_quat = m_quat.multiply(cam_quat, last_gyro_inv_quat, _quat_tmp2);
                  var new_cam_quat = m_quat.multiply(clear_cam_quat, quaternion, _quat_tmp2);

                  var up_axis = m_vec3.transformQuat(m_util.AXIS_MZ,
                    new_cam_quat, _vec3_tmp);

                    m_cam.set_vertical_axis(obj, up_axis);

                    m_trans.set_rotation_v(obj, new_cam_quat);
                    m_quat.copy(quaternion, _last_gyro_quat);
                  }
                }
              }
            }
            m_ctl.create_sensor_manifold(obj, "ROTATE_GYRO",
            m_ctl.CT_CONTINUOUS, [g_sensor], null, rotate_cb);
          }
        });

        b4w.require("eluded_vr").init();
      }
