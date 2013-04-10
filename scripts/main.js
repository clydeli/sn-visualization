var sn_visualization = sn_visualization || {};

sn_visualization.main = (function(){

	var
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

					//var deviceGateway = snArch.children[ gatewayHash[data[i].device_agent[0].print_name]];
					snArch.children[ gatewayHash[gatewayName]].children.push(deviceNode);
				}

				// Sort the
				for(var key in gatewayHash){
					var compareName = function(a, b){
						if (a.name < b.name){ return -1; }
						return 1;
					};
					snArch.children[ gatewayHash[key] ].children.sort(compareName);
				}

				if(callback){ callback(snArch); }
			});
		};

	return {
		initialize : function(){
			buildSensorsObj(sn_visualization.topologicalView.initialize);
		}
	};

})();


$(document).on('ready', function(){
	sn_visualization.main.initialize();
	var cmusvFloors = new sn_visualization.floorView();
	sn_visualization.floorViews.insertView("cmusvFloors", cmusvFloors);

	$('#geographicalView .hideBar').click(function(){
		$('#topologicalView').toggleClass('hidden');
		if($(this).html() == '&lt;') { $(this).html('&gt;'); }
		else { $(this).html('&lt;'); }
	});

	$('#geographicalView .floorNode').click(function(){
		if($(this).hasClass("highlighted")){

		} else {
			var deviceURI = $(this).attr("data-d_uri");
			sn_visualization.topologicalView.openDevice(deviceURI);
			$(this).addClass("highlighted");
		}
	});

});
