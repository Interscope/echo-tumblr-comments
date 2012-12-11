var CAPTURE = {

		  ECHO: {

			defaults: {
			  capture_width: 450,
			  capture_height: 500,
			  xd_receiver: null,
			  rpx_app_id: null,
			  sso_check: null,
			  sso_server: null,
			  query_options: "",
			  load_scripts: true,
			  onInit: function(){}
			},
			scripts: [
			  "http://cdn.echoenabled.com/clientapps/v2/backplane.js",
			  //"http://cdn.echoenabled.com/clientapps/v2/packs/full-pack.js",
			  //"http://cdn.echoenabled.com/clientapps/v2/packs/full-no-jquery-pack.js",
			  "http://cdn.echoenabled.com/clientapps/v2/stream.js",
			  "http://cdn.echoenabled.com/clientapps/v2/counter.js",
			  "http://cdn.echoenabled.com/clientapps/v2/submit.js",
			  //"http://cdn.echoenabled.com/clientapps/v2/plugins/reply.js",
			  //"http://cdn.echoenabled.com/clientapps/v2/plugins/like.js",
			  //"http://cdn.echoenabled.com/clientapps/v2/plugins/community-flag.js",
			  /* UMG Plugins */
			  //"http://cache.umusic.com/web_assets/_global/js/echo/plugins/lmk-stream.js",
			  //"http://cache.umusic.com/web_assets/_global/js/echo/plugins/regex.js",
			  //"http://cache.umusic.com/web_assets/_global/js/echo/plugins/sort-order.js",
			  //"http://cache.umusic.com/web_assets/_global/js/echo/plugins/strip-html.js",
			  /* Scripts for RTB Comments */
			  "http://cdn.realtidbits.com/libs/v1/comments/edit.js",
			  "http://cdn.realtidbits.com/libs/v1/UpdateSort/UpdateSort.js",
			  "http://cdn.realtidbits.com/libs/v1/LMKSubscription/LMKSubscription.js",
			  "http://cdn.realtidbits.com/libs/v1/rssfeed/rssfeed.js",
			  "http://cdn.realtidbits.com/libs/v1/janrain-sharing.js",
			  "http://cdn.realtidbits.com/libs/v1/inlinemedia.js",
			  "http://cdn.realtidbits.com/libs/v1/sanitize.js",
			  "http://cdn.realtidbits.com/libs/v1/comments/comments_core.js",
			  "http://cdn.realtidbits.com/libs/v1/comments/locale/en.js",
			  "http://cdn.realtidbits.com/libs/v1/notifications/notifications.js",
			  "http://cache.umusic.com/web_assets/_global/js/echo/echo_comment_localization.js"
			  
			],
			setOptions: function() {
			  CAPTURE.ECHO.options = jQuery.extend(CAPTURE.ECHO.defaults, CAPTURE.ECHO.options);

			  CAPTURE.ECHO.currentUrl = window.location.href;
			  CAPTURE.ECHO.currentUrl = CAPTURE.ECHO.currentUrl.replace(/\#.+/, '').replace(/\?.+/, '');

			  CAPTURE.ECHO.options.xd_receiver = (CAPTURE.ECHO.options.xd_receiver === null)
				? CAPTURE.ECHO.currentUrl + "?xdcomm=true"
				: CAPTURE.ECHO.options.xd_receiver;
			},

			init: function(options) {
			  this.options = options;
			  CAPTURE.ECHO.setOptions();
			  if (this.gup("xdcomm") == "true") {
				this.xdcommInit();
			  } else if (this.gup("sso") == "check") {
				this.ssoCheck();
			  } else {
				this.loadEchoJs();
			  }
			},
			
			create_plugins: function() {
				// SSO Logout Plugin
				var plugin = Echo.createPlugin({
					"name": "SSO_Logout",
					"applications": ["Stream"],
					"init": function (plugin, application) {
						if (!application.isPluginEnabled(plugin.name)) return;
						plugin.extendRenderer("Stream", "body", plugin.renderers.logout(application), "SSO_Logout");
					}
				});
				
				plugin.sso_logout = function () {
					jQuery.getScript("https://" + CAPTURE.ECHO.options.sso_server + "/sso.js", CAPTURE.ECHO.sso_plugin.sso_logout_callback);
					
				};
				
				plugin.sso_logout_callback = function () {
					JANRAIN.SSO.CAPTURE.logout({
						sso_server: "https://"+CAPTURE.ECHO.options.sso_server,
						logout_uri: document.location.href
					});
				};
				
				plugin.renderers = {};

				plugin.renderers.logout = function (application) {
					if (!application.isPluginEnabled(plugin.name)) return;
					return function (element, dom) {
						var item = this;
						plugin.subscribe(application, "Stream.onReady", function (topic, data) {
							$(".echo-auth-logout").click(function(){
								if(plugin.get(application, "sso_logout") == true) return;
								CAPTURE.ECHO.sso_plugin.sso_logout();
								plugin.set(application, "sso_logout", true);
							});
							$(".echo-auth-login").click(function(){
								if(plugin.get(application, "sso_logout") == false) return;
								plugin.set(application, "sso_logout", false);
							});
						});
						item.parentRenderer("body", arguments);
					};
				};
				CAPTURE.ECHO.sso_plugin = plugin;
			},
			
			loadEchoJs: function() {
			  var callback = CAPTURE.ECHO.mainInit;
			  if(CAPTURE.ECHO.scripts.length > 1){
				callback = CAPTURE.ECHO.loadEchoJs;
				if(CAPTURE.ECHO.options.load_scripts)
				  jQuery.getScript(CAPTURE.ECHO.scripts.splice(0, 1), callback);
			  }else
				callback();
			},

			xdcommInit: function() {
			  var jsHost = (("https:" == document.location.protocol) ? "https://" : "http://static.");
			  
			  /* Social Share callback fix */
			  var href = window.location.href,
				   hashIndex = href.indexOf('#'),
				   hash, rest, cbindex;
			  if (hashIndex > 0) {
				hash = decodeURIComponent(href.substring(hashIndex + 1));
				sepIndex = hash.indexOf(';');
				rest = hash.substring(sepIndex + 1);
				sepIndex = rest.indexOf(':');
				cbindex = rest.substring(0, sepIndex);
				if(typeof(eval(cbindex)) == "number"){
					window.location = href.substring(0, hashIndex + 1) +";RPXNOW._xdCallbacks["+cbindex+"]"+rest.substring( sepIndex);
				}else if(cbindex == "close"){
					window.top["close"] = function(){
						top.$(".rpxnow_lightbox_container img").click();
					};
				}
			  }
			  /******/
			  jQuery.getScript(jsHost + 'janraincapture.com/js/lib/xdcomm.js');
			},
			
			ssoCheck: function() {
			  CAPTURE.ECHO.bpChannel = decodeURIComponent(this.gup("bp_channel"));
			  jQuery.getScript("https://" + CAPTURE.ECHO.options.sso_server + "/sso.js", CAPTURE.ECHO.ssoCheck_callback);
			},

			ssoCheck_callback: function() {
			  JANRAIN.SSO.CAPTURE.check_login({
				  sso_server: "https://" + CAPTURE.ECHO.options.sso_server,
				  client_id: CAPTURE.ECHO.options.capture_client_id,
				  redirect_uri: CAPTURE.ECHO.options.xd_receiver + "#parent;CAPTURE.ECHO.bpExpect:",
				  xd_receiver: CAPTURE.ECHO.options.xd_receiver,
				  bp_channel: CAPTURE.ECHO.bpChannel
			  });
			},

			bpExpect: function() {
			  Backplane.expectMessagesWithin(60, ["identity/login"]);
			  jQuery("#ssoCheck").remove();
			},

			mainInit: function() {
			  CAPTURE.ECHO.create_plugins();
			  CAPTURE.ECHO.options.captureUrl = "https://" + CAPTURE.ECHO.options.capture_addr
				+ "/oauth/signin?response_type=code&flags=stay_in_window&client_id="
				+ CAPTURE.ECHO.options.capture_client_id + "&xd_receiver=" + encodeURIComponent(CAPTURE.ECHO.options.xd_receiver)
				+ "&redirect_uri=http%3A%2F%2Fjs-kit.com%2Fapps%2Fjanrain%2Fwaiting.html&bp_channel=";

			  Backplane.init({
				"serverBaseURL": CAPTURE.ECHO.options.serverBaseURL,
				"busName": CAPTURE.ECHO.options.busName
			  });

			  if (CAPTURE.ECHO.options.sso_check != null || CAPTURE.ECHO.options.sso_server != null) {
				CAPTURE.ECHO.options.sso_check = (CAPTURE.ECHO.options.sso_check != null)
				  ? CAPTURE.ECHO.options.sso_check
				  : CAPTURE.ECHO.currentUrl + "?sso=check&bp_channel=" + encodeURIComponent(Backplane.getChannelID());
				jQuery("body").append(jQuery("<iframe>", {
				  css: {
					height: 0,
					width: 0,
					visibility: "hidden"
				  },
				  id: "ssoCheck",
				  src: CAPTURE.ECHO.options.sso_check
				}));
			  }
			  
			  CAPTURE.ECHO.authPlugin = {  
				"name": "FormAuth",
				"identityManagerLogin": {
				  "width": CAPTURE.ECHO.options.capture_width,
				  "height": CAPTURE.ECHO.options.capture_height,
				  "url": CAPTURE.ECHO.options.captureUrl
				},
				"identityManagerSignup": {
				  "width": CAPTURE.ECHO.options.capture_width,
				  "height": CAPTURE.ECHO.options.capture_height,
				  "url": CAPTURE.ECHO.options.captureUrl
				},
				"identityManagerEdit": {
				  "width": CAPTURE.ECHO.options.capture_width,
				  "height": CAPTURE.ECHO.options.capture_height,
				  "url": CAPTURE.ECHO.options.captureUrl
				},  submitPermissions: "forceLogin" 
			  };
			  
			  CAPTURE.ECHO.ssoLogOutPlugin = {  
				"name": "SSO_Logout"
			  };
			  
			  CAPTURE.ECHO.options.onInit();
			},

			gup: function(name) {
			  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			  var regexS = "[\\?&]"+name+"=([^&#]*)";
			  var regex = new RegExp(regexS);
			  var results = regex.exec(window.location.href);
			  if (results == null)
				return "";
			  else
				return results[1];
			}
		  },

		  resize: function(jargs) {
			args = jQuery.parseJSON(jargs);
			jQuery("#fancybox-inner, #fancybox-wrap, #fancybox-content, #fancybox-frame")
			  .css({
				width: args.w,
				height: args.h
			  });
			jQuery.fancybox.center();
		  }

};
