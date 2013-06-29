var sn_visualization = sn_visualization || {};

sn_visualization.main = (function(){

  var
    mapOverlay = {},
    mapHandlers = {},
    pollingWorker = {},

    pollingSensorStatus = function(){
      pollingWorker = new Worker('scripts/workers/floorViewWorker.js');
      pollingWorker.addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          console.log("device (temp) last update time update", data);

          // Update data in topologicalView and floorView
          sn_visualization.topologicalView.updateStatus(data);
          sn_visualization.floorViews.getView("cmusvFloors").updateDeviceStatus(data);
	    sn_visualization.floorViews.getView("nasaFloors").updateDeviceStatus(data);

          // Update data in dashboardView
          var now = new Date();

          for(var key in data){
            var
              offset = now.getTime()-data[key]*1000,
              targetCard = $('#dashboardView .deviceCard[data-d_uri='+key+']');

            if(targetCard.length == 0){
              var cardHTML =
                '<div class="deviceCard" data-d_uri="'+key+'">'+
                key+
                '</div>';
              $('#dashboardView').append(cardHTML);
              targetCard = $('#dashboardView .deviceCard[data-d_uri='+key+']');
            }

            targetCard.removeClass('badBlock avgBlock goodBlock');
            if(offset > 3*60*1000){ targetCard.addClass('badBlock'); }
            else if(offset > 15*1000){ targetCard.addClass('avgBlock'); }
            else { targetCard.addClass('goodBlock'); }
          }

          // Log received data into logView
          $('#logView').append('Update received for device status at '+(new Date())+'<br>');
          var logText = '{';
          for(var key2 in data){
            logText += key2+' : '+data[key2]+' ';
          }
          logText += '}<br>';
          $('#logView').append(logText);

        }, false
      );
      pollingWorker.postMessage({
        type: "START",
        url: "http://cmu-sensor-network.herokuapp.com/last_readings_from_all_devices/",
      });
    },

    buildSensorsObj = function(callback){
      var snArch = { id : "root", name : "CMUSV", children : [] };
      var gatewayHash = {};

      $.getJSON("http://cmu-sds.herokuapp.com/get_devices", function(data){
        console.log("get all devices (should be deprecated though...)", data);

        /* Parse the data */
        var deviceCount = data.length;
        for(var i=0; i< deviceCount; ++i){

          var gatewayName = data[i].device_agent[0].print_name;
          if(!gatewayHash.hasOwnProperty(gatewayName)){
            snArch.children.push({ type: "Gateway", id: "gateway"+String(i), name: gatewayName, data: {}, children: [] });
            gatewayHash[gatewayName] = snArch.children.length-1;
          }

          var deviceNode = {
            type : "Device", d_uri : data[i].uri,
            name : data[i].location.print_name,
            data : {}, children : []
          };

          var sensorCount = data[i].sensors.length;
          for(var j=0; j<sensorCount; ++j){
            for( var key in data[i].sensors[j]){
              deviceNode.children.push({
                type : "Sensor", d_uri : data[i].uri, s_id : key, d_name : data[i].location.print_name, name : data[i].sensors[j][key],
                data : {}, children : []
              });
            }
          }

          snArch.children[ gatewayHash[gatewayName]].children.push(deviceNode);
        }

        // Sort the devices by their names
        for(var key in gatewayHash){
          snArch.children[ gatewayHash[key] ].children.sort(
            function(a, b){ return (a.name < b.name)? -1:1 ; }
          );
        }

        if(callback){ callback(snArch); }
      });
    },

    addFloorToMap = function(coords, clickHandler){
      // Construct the polygon
      var floorPolygon = new google.maps.Polygon({
        clickable: true,
        paths: [
          new google.maps.LatLng(coords[0][0], coords[0][1]),
          new google.maps.LatLng(coords[1][0], coords[1][1]),
          new google.maps.LatLng(coords[2][0], coords[2][1]),
          new google.maps.LatLng(coords[3][0], coords[3][1])
        ],
        strokeColor: '#0000ff', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: '#0000ff', fillOpacity: 0.35
      });

      floorPolygon.setMap(mapOverlay);
      /*var listener = google.maps.event.addListener(floorPolygon, "mouseover", function (){
        this.setOptions({ strokeColor: '#000' });
      });*/
      var listener2 = google.maps.event.addListener(floorPolygon, "click", function (){
	  if (coords[0][0] == 37.410555 && coords[0][1] == -122.062342) {
	      $('#nasaGeographicalContainer').removeClass('hidden');
              $('#gmapOverlay').addClass('supressed');
	  }
	  else {
              $('#cmuGeographicalContainer').removeClass('hidden');
              $('#gmapOverlay').addClass('supressed');
	  }
      });
    },

    initGMapOverlay = function(){
      var mapOptions = {
        zoom: 18,
        center: new google.maps.LatLng(37.411082,-122.059489),
        mapTypeId: google.maps.MapTypeId.SATELLITE
      };
      mapOverlay = new google.maps.Map(document.getElementById('gmapOverlay'), mapOptions);
    };

  return {
    initialize : function(){
      buildSensorsObj(sn_visualization.topologicalView.initialize);
      pollingSensorStatus();
      initGMapOverlay();
    },
    addFloorToMap : addFloorToMap
  };

})();


$(document).on('ready', function(){
  sn_visualization.main.initialize();

 var cmusvFloors = new sn_visualization.floorView(
     sn_visualization.prestoredData.cmusvFloorB23
  );
  sn_visualization.floorViews.insertView("cmusvFloors", cmusvFloors);
  sn_visualization.main.addFloorToMap(
    [ [37.410326,-122.059208],
      [37.410750,-122.059420],
      [37.410490,-122.060227],
      [37.410080,-122.060037] ]
  );
  var nasaFloors = new sn_visualization.floorView(
      sn_visualization.prestoredNasaData.nasaFloor
  );
  sn_visualization.floorViews.insertView("nasaFloors", nasaFloors);
  sn_visualization.main.addFloorToMap( 
    [ [37.410555,-122.062342], //make x smaller "lowers" a corner, make y quantity smaller moves corner to right  "bottom left corner"
      [37.411050,-122.061070], //make x larger "raises" a corner, make y quantity larger moves corner to left, "bottom right corner"
      [37.411600,-122.061380], //make x larger "raises" a corner, "top right corner"
      [37.411180,-122.062600] ] //"top left corner"
  );

  //$("#topologicalView").resizable({ handles: "e" });

  $('#floorContainer .floorNode').click(function(){
    var deviceURI = $(this).attr("data-d_uri");
    if($(this).hasClass("highlighted")){
      sn_visualization.topologicalView.closeDevice(deviceURI);
    } else {
      sn_visualization.topologicalView.openDevice(deviceURI);
    }
    $(this).toggleClass("highlighted");
  });

  $('body').on('click', '.timeseriesClose', function(){
    var
      deviceURI = $(this).parent().attr('data-d_uri'),
      metricId = $(this).parent().attr('data-s_id');

    console.log(deviceURI);
    console.log(metricId);
    sn_visualization.timeseriesView.remove(deviceURI, metricId);
    sn_visualization.topologicalView.closeSensor(deviceURI, metricId);
  });

  $('#dashFilter li').click( function(){
    $('#dashFilter li').removeClass('active');
    $(this).addClass('active');
    $('.deviceCard').addClass('hidden');
    switch($(this).html()){
      case "all":
        $('.deviceCard').removeClass('hidden');
        break;
      case "good":
        $('.deviceCard.goodBlock').removeClass('hidden');
        break;
      case "avg":
        $('.deviceCard.avgBlock').removeClass('hidden');
        break;
      case "bad":
        $('.deviceCard.badBlock').removeClass('hidden');
        break;
    }
  })


  $('#menuBar nav li').click( function(){
    switch($(this).html()){
      case "Map":
        $('#cmuGeographicalContainer').addClass('hidden');
	$('#nasaGeographicalContainer').addClass('hidden');
        $('#gmapOverlay').removeClass('hidden');
        break;
      case "Dashboard":
        $('#dashboardView').toggleClass('hidden');
        break;
      case "Log":
        $('#logView').toggleClass('hidden');
        break;
    }
  })

});
