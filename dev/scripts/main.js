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
	        //sn_visualization.floorViews.getView("nasaFloors").updateDeviceStatus(data);

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


      // Menu click handlers
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

    }
  };

})();


$(document).on('ready', function(){
  sn_visualization.main.initialize();
});
