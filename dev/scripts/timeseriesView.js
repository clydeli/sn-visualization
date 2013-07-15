var sn_visualization = sn_visualization || {};

sn_visualization.timeseriesView = (function(){

  var
    // some static variables
    timeLength = 5*60, //seconds
    dataCache = {},
    dataWorkers = {},

    // internal functions
    updateCache = function(deviceURI, metricId, data, updateTime){
      console.log(data);
      dataCache[deviceURI] = dataCache[deviceURI] || {};
      dataCache[deviceURI][metricId] =
        dataCache[deviceURI][metricId] || {
          updateTime : updateTime-timeLength*1000,
          values : []
        };
      var lastUpdateTime = dataCache[deviceURI][metricId].updateTime;
      for(var i=0;i < data.length;++i){
        var duration = (data[i].timestamp - lastUpdateTime) / 1000;
        for(var j=0; j<duration; ++j){
          dataCache[deviceURI][metricId].values.push(data[i].value);
        }
        lastUpdateTime = data[i].timestamp;
      }
      //dataCache[deviceURI].updateTime = updateTime;
      //dataCache[deviceURI].data = dataCache[deviceURI].data || [];
      /*dataCache[deviceURI].data = dataCache[deviceURI].data.concat(data);
      while( dataCache[deviceURI].data.length > 0 && dataCache[deviceURI].data[0].timestamp<updateTime-timeLength*1000){
        dataCache[deviceURI].data.shift();
      }*/
      dataCache[deviceURI][metricId].updateTime = lastUpdateTime;
    },

    insertWorker = function(deviceURI, metricId){
      var
        now = new Date(),
        fetchTime = now.getTime();

      dataWorkers[deviceURI][metricId].worker = new Worker('scripts/workers/timeSeriesWorker.js');
      dataWorkers[deviceURI][metricId].worker.addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          console.log(data);
          $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"] img.loading').remove();
          updateCache(deviceURI, metricId, data, (new Date()).getTime());

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

  // Modified from d3 example (http://bl.ocks.org/mbostock/1667367)

/*
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
        [0.9*d3.min(data.map(function(d) { return d.value; })),
         1.1*d3.max(data.map(function(d) { return d.value; }))]
      );
      x2.domain(x.domain());
      y2.domain(y.domain());

      focus.append("path").datum(data).attr("clip-path", "url(#clip)").attr("d", area);
      focus.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
      focus.append("g").attr("class", "y axis").call(yAxis);

      context.append("path").datum(data).attr("d", area2);
      context.append("g").attr("class", "x axis").attr("transform", "translate(0," + height2 + ")").call(xAxis2);
      context.append("g").attr("class", "x brush").call(brush).selectAll("rect").attr("y", -6).attr("height", height2 + 7);

    };*/

  return {

    insert : function(deviceURI, metricId, deviceName, metricName){

      dataCache[deviceURI] = {};
      dataCache[deviceURI][metricId] = dataCache[deviceURI][metricId] || {};

      dataWorkers[deviceURI] = dataWorkers[deviceURI] || {};
      dataWorkers[deviceURI][metricId] = dataWorkers[deviceURI][metricId] || {};
      insertWorker(deviceURI, metricId);

      $("body").append(
        '<div class="timeseriesView" data-d_uri="'+deviceURI+'" data-s_id="'+metricId+'">'+
        '<img class="loading" src="images/loading.gif">'+
        '<div class="timeseriesLabel">'+deviceName+' - '+metricName+'</div>'+
        '<div class="timeseriesClose">X</div>'+
        '</div>'
      );

      var selector = '.timeseriesView[data-d_uri="'+deviceURI+'"]';
      $(selector+'[data-s_id="'+metricId+'"]').draggable();

    },

    remove: function(deviceURI, metricId){
      $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"]').remove();
      removeWorker(deviceURI, metricId);
    }
  };

})();
