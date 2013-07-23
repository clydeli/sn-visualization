var sn_visualization = sn_visualization || {};

sn_visualization.timeseriesManager = (function(){

  var
    // some static variables
    timeLength = 5*60, //seconds
    dataCache = {},
    dataWorkers = {},

    // internal functions
    updateCache = function(deviceURI, metricId, data, updateTime){
      console.log(data);
      dataCache[deviceURI][metricId].updateTime = updateTime;
      dataCache[deviceURI][metricId].data = dataCache[deviceURI][metricId].data || [];
      dataCache[deviceURI][metricId].data = data.concat(dataCache[deviceURI][metricId].data);
      while( dataCache[deviceURI][metricId].data.length > 0
        && dataCache[deviceURI][metricId].data[dataCache[deviceURI][metricId].data.length-1].timestamp<updateTime-timeLength*1000){
        dataCache[deviceURI][metricId].data.pop();
      }
    },

    insertWorker = function(deviceURI, metricId){

      var fetchTime = (new Date()).getTime();

      dataWorkers[deviceURI][metricId].worker = new Worker('scripts/workers/timeSeriesWorker.js');
      dataWorkers[deviceURI][metricId].worker.addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"] img.loading').remove();
          $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"] svg').remove();
          updateCache(deviceURI, metricId, data, (new Date()).getTime());

          drawData(
            deviceURI, metricId,
            dataCache[deviceURI][metricId].data,
            '.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"]'
          );

          // Log received data into logView
          /*$('#logView').append(data.length+' updates received for device '+deviceURI+' at '+(new Date())+'<br>');
          for(var j=0; j<data.length; ++j){
            var logText = '{';
            for(var key in data[j]){ logText += key+' : '+data[j][key]+' '; }
            logText += '}<br>';
            $('#logView').append(logText);
          }*/
        }, false
      );

      dataWorkers[deviceURI][metricId].worker.postMessage({
        type: "START",
        url: "http://"+sn_visualization.serverAddress+"/sensors/"+deviceURI,
        metric_id : metricId,
        init_time: (fetchTime-timeLength*1000),
        update_time: fetchTime
      });
    },
    removeWorker = function(deviceURI, metricId){
      dataWorkers[deviceURI][metricId].worker.postMessage({ type: "STOP"});
      delete dataWorkers[deviceURI][metricId];
    };


    // Modified from d3 example (http://bl.ocks.org/mbostock/3884955), annotated by Kyle
    var
      margin = {top: 20, right: 80, bottom: 30, left: 50},
      width = 500 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom,
      color = d3.scale.category10(),
      x = d3.time.scale().range([0, width]), //x-axis scale value range in d3.time for date objects
      y = d3.scale.linear().range([height, 0]), //y-axis scale value range
      xAxis = d3.svg.axis().scale(x).orient("bottom"), //x-axis is on the bottom
      yAxis = d3.svg.axis().scale(y).orient("left"); //y-axis is on the left

    var drawData = function(deviceURI, metricId, data, selector){

      var count = 0;
      color.domain(d3.entries(data[0]).filter(function(obj) {
        for(var key in obj) {
          ++count;
          if (count == 8) { return obj[key]; }
        }
      }));

      /* create a map of data - name vs. values. Values consists of another map of timestamps vs. temperatures
      This color domain is set directly above. Name passed in is key value pair of "device_id" and actual id */
      var sensor = color.domain().map(function(name) {
        return {
          name: name.value,
          values: data.map(function(d) {
            //name: object with key: device_id and value: DCTN___etc
            //d: Object { timestamp="Tue, 26 Feb 45264 11:58:42 GMT", sensor_type="temperature", value=71.448105, more...}
            //d[name]: device_id output
            //d.timestamp: date object timestamp in GMT
            return {
              //d.timestamp is correctly set to GMT
              timestamp: d.timestamp,
              temperature: sn_visualization.unitConverter.convert(deviceURI, metricId, d.value)
            };
          })
        };
      });

      //compute the line via svg (for shapes) .svg.line() creates a new line generator
      var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.timestamp); })
      .y(function(d) { return y(d.temperature); });

      var svg = d3.select(selector).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //extent finds the minimum and maximum value in array to set domain. d.timestamp is set to GMT
      x.domain(d3.extent(data, function(d) { return (new Date(d.timestamp)); }));
      y.domain([
        d3.min(sensor, function(c){ return d3.min(c.values, function(v) { return v.temperature; }); }),
        d3.max(sensor, function(c){ return d3.max(c.values, function(v) { return v.temperature; }); })
      ]);

      //x axis attributes
      svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

      //y axis attributes
      svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(sn_visualization.unitConverter.sensorName(deviceURI, metricId))

      //define attributes
      var sensordata = svg.selectAll(".sensordata")
      .data(sensor)
      .enter().append("g")
      .attr("class", "sensordata")

      sensordata.append("path")
      .attr("class", "line")
      .attr("d", function(d) {
        //d.values is timestamps vs. temperature
        return line(d.values);
      })
      .style("stroke", function(d) { return color(d.name); });

      sensordata.append("text")
      .datum(function(d) {
        //d.name is DCN, etc.
        //d.values is the timestamps vs. temperature in an object
        return {
          name: d.name,
          value: d.values[d.values.length - 1]
        };
      })
      .attr("transform", function(d) {
        //d.value contains entire object: Object { timestamp="Mon, 02 Jun 45259 19:53:34 GMT", temperature=68.42186}
        return "translate(" + x((d["value"])["timestamp"]) + "," + y((d["value"])["temperature"]) + ")";
      })
      .attr("x", width)
      .attr("dy", ".35em")
      .text(function(d){ return d.name; });
    };

  return {

    insert : function(deviceURI, metricId, deviceName, metricName){

      dataCache[deviceURI] = dataCache[deviceURI] || {};
      dataCache[deviceURI][metricId] = dataCache[deviceURI][metricId] || {};

      dataWorkers[deviceURI] = dataWorkers[deviceURI] || {};
      dataWorkers[deviceURI][metricId] = dataWorkers[deviceURI][metricId] || {};
      insertWorker(deviceURI, metricId);

      var timeseriesBlock = $(
        '<div class="timeseriesView" data-d_uri="'+deviceURI+'" data-s_id="'+metricId+'">'+
        '<img class="loading" src="images/loading.gif">'+
        '<div class="queryBlock"><input type="datetime" name="initTime" class="initTime"> to <input type="datetime" name="endTime" class="endTime"><input type="button" class="generateStaticBtn" value="Query"></div>'+
        '<div class="timeseriesLabel">'+deviceName+' - '+metricName+'</div>'+
        '<div class="timeseriesClose">X</div>'+
        '</div>');

      timeseriesBlock.find('.timeseriesClose').on('click', function(){
        sn_visualization.timeseriesManager.remove(deviceURI, metricId);
        sn_visualization.topologicalView.closeSensor(deviceURI, metricId);
      });

      timeseriesBlock.find('.generateStaticBtn').on('click', function(){
        sn_visualization.timeseriesManager.insertStatic(
          deviceURI, metricId, deviceName, metricName,
          (new Date(timeseriesBlock.find('.initTime').val())).getTime(),
          (new Date(timeseriesBlock.find('.endTime').val())).getTime()
        );
      });

      $("body").append(timeseriesBlock);
      $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"]').draggable();
    },

    insertStatic : function(deviceURI, metricId, deviceName, metricName, initTime, endTime){

      var
        uid = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
        timeseriesBlock = $(
          '<div class="timeseriesView" id="timeseries'+uid+'">'+
          '<div class="timeseriesLabel">'+deviceName+' - '+metricName+'</div>'+
          '<div class="timeseriesClose">X</div>'+
          '</div>'
        );

      timeseriesBlock.find('.timeseriesClose').on('click', function(){ timeseriesBlock.remove(); });

      $.getJSON("http://"+sn_visualization.serverAddress+"/sensors/"+deviceURI+"/"+initTime+"/"+endTime+"/"+metricId+"/json", function(data){
        $("body").append(timeseriesBlock);
        drawData(deviceURI, metricId, data, "#timeseries"+uid );
        $(".timeseriesView").draggable();
      });
    },

    remove: function(deviceURI, metricId){
      $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"]').remove();
      removeWorker(deviceURI, metricId);
    }
  };

})();
