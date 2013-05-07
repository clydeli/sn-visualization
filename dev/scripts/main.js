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

          // Update data in topologicalView and floorView
          sn_visualization.topologicalView.updateStatus(data);
          sn_visualization.floorViews.getView("cmusvFloors").updateDeviceStatus(data);

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

  $('#dashFilter li').click( function(){
    $('#dashFilter li').removeClass('active');
    $(this).addClass('active');
    switch($(this).html()){
      case "all":
        $('.deviceCard').removeClass('hidden');
        break;
      case "good":
        $('.deviceCard').addClass('hidden');
        $('.deviceCard.goodBlock').removeClass('hidden');
        break;
      case "avg":
        $('.deviceCard').addClass('hidden');
        $('.deviceCard.avgBlock').removeClass('hidden');
        break;
      case "bad":
        $('.deviceCard').addClass('hidden');
        $('.deviceCard.badBlock').removeClass('hidden');
        break;
    }
  })


	$('#menuBar nav li').click( function(){
		switch($(this).html()){
			case "Dashboard":
				$('#dashboardView').toggleClass('hidden');
				break;
      /*case "FloorView":
        $('.view').hide();
        $('#geographicalView, #geographicalView').show();
        break;*/
			case "Log":
				$('#logView').toggleClass('hidden');
				break;
		}
	})

});
