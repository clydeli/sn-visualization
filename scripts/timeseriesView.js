var sn_visualization = sn_visualization || {};

sn_visualization.timeseriesView = (function(){

	var
	// some static variables
		timeLength = 10*60, //seconds
		dataCache = {},
		dataWorkers = {},

	// internal functions
		updateCache = function(deviceURI, data, updateTime){
			dataCache[deviceURI] = dataCache[deviceURI] || {};
			dataCache[deviceURI].updateTime = updateTime;
			dataCache[deviceURI].data = dataCache[deviceURI].data || [];
			dataCache[deviceURI].data = dataCache[deviceURI].data.concat(data);
			while(dataCache[deviceURI].data[0].timestamp<updateTime-timeLength*1000){
				dataCache[deviceURI].data.shift();
			}
		},

	// Modified from d3 example (http://bl.ocks.org/mbostock/1667367) 
		margin = {top: 10, right: 10, bottom: 70, left: 40},
		margin2 = {top: 215, right: 10, bottom: 20, left: 40},
		width = 300 - margin.left - margin.right,
		height = 250 - margin.top - margin.bottom,
		height2 = 250 - margin2.top - margin2.bottom,

		x = d3.time.scale().range([0, width]),
		x2 = d3.time.scale().range([0, width]),
		y = d3.scale.linear().range([height, 0]),
		y2 = d3.scale.linear().range([height2, 0]),

		xAxis = d3.svg.axis().scale(x).orient("bottom"),
		xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
		yAxis = d3.svg.axis().scale(y).orient("left"),

		area = d3.svg.area()
		.interpolate("linear")
		.x(function(d) { return x(d.date); })
		.y0(height)
		.y1(function(d) { return y(d.value); }),

		area2 = d3.svg.area()
		.interpolate("linear")
		.x(function(d) { return x2(d.date); })
		.y0(height2)
		.y1(function(d) { return y2(d.value); }),

		drawData = function(data, metric, selector){

			data.forEach(function(d) {
				d.date = new Date(parseInt(d.timestamp));
				d.value = d[metric];
			});

			var brush = d3.svg.brush().x(x2).on("brush", brush);	

			function brush() {
				x.domain(brush.empty() ? x2.domain() : brush.extent());
				focus.select("path").attr("d", area);
				focus.select(".x.axis").call(xAxis);
			}

			var svg = d3.select(selector).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);

			svg.append("defs").append("clipPath")
				.attr("id", "clip")
				.append("rect")
				.attr("width", width)
				.attr("height", height);

			var focus = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			var context = svg.append("g").attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

			x.domain(d3.extent(data.map(function(d) { return d.date; })));
			y.domain(
				[d3.min(data.map(function(d) { return d.value; })),
				 d3.max(data.map(function(d) { return d.value; }))]
			);
			x2.domain(x.domain());
			y2.domain(y.domain());

			focus.append("path").datum(data).attr("clip-path", "url(#clip)").attr("d", area);
			focus.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
			focus.append("g").attr("class", "y axis").call(yAxis);

			context.append("path").datum(data).attr("d", area2);
			context.append("g").attr("class", "x axis").attr("transform", "translate(0," + height2 + ")").call(xAxis2);
			context.append("g").attr("class", "x brush").call(brush).selectAll("rect").attr("y", -6).attr("height", height2 + 7);

		};


	return {

		insert : function(deviceURI, metricId, deviceName, metricName){

			$("body").append(
				'<div class="timeseriesView" data-d_uri="'+deviceURI+'" data-s_id="'+metricId+'">'+
				'<img class="loading" src="images/loading.gif">'+
				'<div class="timeseriesLabel">'+deviceName+' - '+metricName+'</div>'+
				'</div>'
			);
			var selector = '.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"]';
			$(selector).draggable();

			var now = new Date();
			var fetchTime = now.getTime();

			/*dataWorkers[deviceURI] = new Worker('workers/timeSeriesWorker.js');
			dataWorkers[deviceURI].addEventListener(
				'message', function(e){
					var data = JSON.parse(e.data);
					console.log(data);
				}, false
		    );
		    dataWorkers[deviceURI].postMessage({
		    	type: "START",
		    	url: "http://cmu-sds.herokuapp.com/sensor_readings/"+deviceURI,
		    	init_time: (fetchTime-timeLength*1000),
		    	update_time: fetchTime
		    });*/ 


			$.ajax({
  				url: "http://cmu-sds.herokuapp.com/sensor_readings/"+deviceURI,
  				data: {
  					start_time : (fetchTime-timeLength*1000),
  					end_time : fetchTime
  				},
  				success: function(data){
  					$(selector+' img.loading').remove();
  					updateCache(deviceURI, data, fetchTime);
  					drawData(data, metricId, selector);
  				}
			});

		}
	};

})();
