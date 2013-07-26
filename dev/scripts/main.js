var sn_visualization = sn_visualization || {};

sn_visualization.main = (function(){

  var
    buildingManager,
    statusWorker = {},

    pollingSensorStatus = function(){
      statusWorker = new Worker('scripts/workers/statusWorker.js');
      statusWorker.addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          console.log("device (temp) last update time update", data);

          // Update data in topologicalView and floorView
          sn_visualization.topologicalView.updateStatus(data);
          buildingManager.getBuilding("cmusvB23").updateDeviceStatus(data);
	        buildingManager.getBuilding("nasaBuildingN").updateDeviceStatus(data);

          // Log received data into logView
          $('#logView').append('Update received for device status at '+(new Date())+'<br>');
          var logText = '{';
          for(var key2 in data){ logText += key2+' : '+data[key2]+' '; }
          logText += '}<br>';
          $('#logView').append(logText);

        }, false
      );
      statusWorker.postMessage({
        type: "START",
        url: "http://"+sn_visualization.serverAddress+"/last_readings_from_all_devices/",
      });
    };

  return {
    initialize : function(){

      // Load from prestored data
      sn_visualization.topologicalView.initialize(sn_visualization.networkArchictecture);

      // Initialize buidling manager
      buildingManager = sn_visualization.buildingManager(
        new google.maps.Map(document.getElementById('gmapOverlay'), {
          center: new google.maps.LatLng(37.411082,-122.059489),
          zoom: 18, mapTypeId: google.maps.MapTypeId.SATELLITE
        }),
        "#geographicalView #geographicalContainer"
      );

      // Insert Buildings
      buildingManager.insertBuilding("cmusvB23", sn_visualization.prestoredData.cmusvB23);
      buildingManager.insertBuilding("nasaBuildingN", sn_visualization.prestoredData.nasaBuildingN);
      buildingManager.insertBuilding("nasaBuildingS", sn_visualization.prestoredData.nasaBuildingS);

      // Polling Sensor Status
      pollingSensorStatus();

      // Resize the device node block size according to window size
      $(window).resize(function () {
        $('.nodeBlock').css({'width' : (($(window).width() / 1250)+'em')});
        $('.nodeBlock').css({'height' : (($(window).height() / 540)+'em')});
      });

      // Floornode click handler
      $('#geographicalContainer .floorNode').click(function(){
        var deviceURI = $(this).attr("data-d_uri");
        if($(this).hasClass("highlighted")){
          sn_visualization.topologicalView.closeDevice(deviceURI);
        } else {
          sn_visualization.topologicalView.openDevice(deviceURI);
          $("#topologicalView").toggleClass("pinned");
        }
        $(this).toggleClass("highlighted");
      });

      // Heatmap and building toggle/close handler
      $('#geographicalContainer').on('click', '.buildingCloseBtn', function(){
        $('#geographicalContainer').addClass('hidden');
        buildingManager.hideBuilding();
      });
      $('#geographicalContainer').on('click', '.heatmapToggleBtn', function(){
        $('.heatmap').toggleClass('hidden');
      });


      /* Menu click handlers
       * select all li in tag with id=menuBar and tag with id=nav. JQuery toggles the class property of 
       * div element by appending/removing "hidden" from string. This "creates" a new "class" 
       * property that has separate css styling */
      $('#menuBar nav li').click( function(){  
        switch($(this).html()){
          case "Log":
            $('#logView').toggleClass('hidden');
            break;
          case "API":
            $('#apiView').toggleClass('hidden');
            break;
        }
      });

      /* API expanding divs 
       *
       * when mouse hovers over it, display corresponding text
       * when mouse leaves it, remove corresponding text */
      $('#api-getalldevices').on('click', function(){
        $('#api-getalldevicesexpansion').toggleClass('hidden');
        $('#api-getalldevices').toggleClass('clicked');
      });

      $('#api-getsensortype').on('click', function(){
        $('#api-getsensortypeexpansion').toggleClass('hidden');
        $('#api-getsensortype').toggleClass('clicked');
      });

      $('#api-addsensorreadings').on('click', function(){
        $('#api-addsensorreadingsexpansion').toggleClass('hidden');
        $('#api-addsensorreadings').toggleClass('clicked');
      });

      $('#api-getsensorreadingsattime').on('click', function(){
        $('#api-getsensorreadingsattimeexpansion').toggleClass('hidden');
        $('#api-getsensorreadingsattime').toggleClass('clicked');
      });


      $('#api-getsensorreadingstimerange').on('click', function(){
        $('#api-getsensorreadingstimerangeexpansion').toggleClass('hidden');
        $('#api-getsensorreadingstimerange').toggleClass('clicked');
      });


      $('#api-getspecifictimereadings').on('click', function(){
        $('#api-getspecifictimereadingsexpansion').toggleClass('hidden');
        $('#api-getspecifictimereadings').toggleClass('clicked');
      });

      $('#api-getcurrenttimereadings').on('click', function(){
        $('#api-getcurrenttimereadingsexpansion').toggleClass('hidden');
        $('#api-getcurrenttimereadings').toggleClass('clicked');
      });






      /* Dynamic API querying
       * if a query fails, toggle only if successful style is up
       * if a query succeeds, toggle only if failure style is up */
      window.setInterval(function(){
        $.getJSON("http://cmu-sensor-network.herokuapp.com/get_devices/json", function(data) {
          var classname = $("#api-getalldevices").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-getalldevices").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-getalldevices").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-getalldevices").toggleClass("failed-api-test");
          }
        });

        $.getJSON("http://cmu-sensor-network.herokuapp.com/get_sensor_types/firefly_v3/json", function(data) {
          var classname = $("#api-getsensortype").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-getsensortype").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-getsensortype").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-getsensortype").toggleClass("failed-api-test");
          }
        });

        $.getJSON("", function(data) {
          var classname = $("#api-addsensorreadings").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-addsensorreadings").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-addsensorreadings").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-addsensorreadings").toggleClass("failed-api-test");
          }
        });

        $.getJSON("http://cmu-sensor-network.herokuapp.com/sensors/10170102/1368568896000/temp/json", function(data) {
          var classname = $("#api-getsensorreadingsattime").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-getsensorreadingsattime").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-getsensorreadingsattime").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-getsensorreadingsattime").toggleClass("failed-api-test");
          }
        });

        $.getJSON("http://cmu-sensor-network.herokuapp.com/sensors/10170102/1368568896000/1368568996000/temp/json", function(data) {
          var classname = $("#api-getsensorreadingstimerange").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-getsensorreadingstimerange").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-getsensorreadingstimerange").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-getsensorreadingstimerange").toggleClass("failed-api-test");
          }
        });

        $.getJSON("http://cmu-sensor-network.herokuapp.com/last_readings_from_all_devices/1368568896000/temp/json", function(data) {
          var classname = $("#api-getspecifictimereadings").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-getspecifictimereadings").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-getspecifictimereadings").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-getspecifictimereadings").toggleClass("failed-api-test");
          }
        });

        $.getJSON("http://cmu-sensor-network.herokuapp.com/lastest_readings_from_all_devices/temp/json", function(data) {
          var classname = $("#api-getcurrenttimereadings").attr('class');
          if (classname.search("failed-api-test") !== -1) {
            $("#api-getcurrenttimereadings").toggleClass("failed-api-test");
          }
        })
        //start chaining off getJSON()
        .fail(function() {
          var classname = $("#api-getcurrenttimereadings").attr('class');
          if (classname.search("failed-api-test") === -1) {
            $("#api-getcurrenttimereadings").toggleClass("failed-api-test");
          }
        });

      }, 4000); //call function every /1000 seconds

    }
  };

})();


$(document).on('ready', function(){
  sn_visualization.main.initialize();
});
