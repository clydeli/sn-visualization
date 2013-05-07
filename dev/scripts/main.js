var sn_visualization = sn_visualization || {};

sn_visualization.main = (function(){

	var
    pollingWorker = {},

    pollingSensorStatus = function(){
      pollingWorker = new Worker('scripts/workers/floorViewWorker.js');
      pollingWorker.addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          console.log(data);

          sn_visualization.topologicalView.updateStatus(data);
          sn_visualization.floorViews.getView("cmusvFloors").updateDeviceStatus(data);

          // Log received data into logView
          $('#logView').append('Update received for device status at '+(new Date())+'<br>');
          var logText = '{';
          for(var key in data){
            logText += key+' : '+data[key]+' ';
          }
          logText += '}<br>';
          $('#logView').append(logText);

        }, false
      );
      pollingWorker.postMessage({
        type: "START",
        url: "http://cmu-sds.herokuapp.com/get_last_reading_time_for_all_devices",
      });
    },
		buildSensorsObj = function(callback){
			var snArch = { id : "root", name : "CMUSV", children : [] };
			var gatewayHash = {};

			$.getJSON("http://cmu-sds.herokuapp.com/get_devices", function(data){
				console.log(data);

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
		};

	return {

		initialize : function(){
			buildSensorsObj(sn_visualization.topologicalView.initialize);
      pollingSensorStatus();
		}
	};

})();


$(document).on('ready', function(){
	sn_visualization.main.initialize();
	var cmusvFloors = new sn_visualization.floorView();
	sn_visualization.floorViews.insertView("cmusvFloors", cmusvFloors);

	//$("#topologicalView").resizable({ handles: "e" });

	$('#geographicalView .hideBar').click(function(){
		$('#topologicalView').toggleClass('hidden');
		if($(this).html() == '&lt;') { $(this).html('&gt;'); }
		else { $(this).html('&lt;'); }
	});

	$('#geographicalView .floorNode').click(function(){
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
			deviceURI = $(this).parent().attr('data-d_uri');
			metricId = $(this).parent().attr('data-s_id');
		console.log(deviceURI);
		console.log(metricId);
		sn_visualization.timeseriesView.remove(deviceURI, metricId);
		sn_visualization.topologicalView.closeSensor(deviceURI, metricId);
	});

	$('#menuBar nav li').click( function(){
		switch($(this).html()){
			/*case "Dashboard":
				$('.view').hide();
				$('#geographicalView, #topologicalView').show();
				break;*/
			case "Log":
				$('#logView').toggleClass('hidden');
				break;
		}
	})

});
