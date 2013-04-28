var sn_visualization = sn_visualization || {};

sn_visualization.timeseriesView = (function(){

  var
  // some static variables
    timeLength = 5*60, //seconds
    dataCache = {},
    dataWorkers = {},

  // internal functions
    updateCache = function(deviceURI, data, updateTime){
      dataCache[deviceURI] = dataCache[deviceURI] || {};
      dataCache[deviceURI].updateTime = updateTime;
      dataCache[deviceURI].data = dataCache[deviceURI].data || [];
      dataCache[deviceURI].data = dataCache[deviceURI].data.concat(data);
      while( dataCache[deviceURI].data.length > 0 && dataCache[deviceURI].data[0].timestamp<updateTime-timeLength*1000){
        dataCache[deviceURI].data.shift();
      }
    },
    insertWorker = function(deviceURI){
      var
        now = new Date(),
        fetchTime = now.getTime();

      dataWorkers[deviceURI].worker = new Worker('scripts/workers/timeSeriesWorker.js');
      dataWorkers[deviceURI].worker.addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          $('.timeseriesView[data-d_uri="'+deviceURI+'"] img.loading').remove();
          $('.timeseriesView[data-d_uri="'+deviceURI+'"] svg').remove();
          updateCache(deviceURI, data, (new Date()).getTime());
          for(var i=0; i<dataWorkers[deviceURI].metrics.length; ++i){
            drawData(
              dataCache[deviceURI].data,
              dataWorkers[deviceURI].metrics[i],
              '.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+dataWorkers[deviceURI].metrics[i]+'"]'
            );
          }
          console.log(data);

          $('#logView').append(data.length+' updates received at '+(new Date())+'<br>');
          for(var j=0; j<data.length; ++j){
            $('#logView').append('{');
            for(var key in data[j]){
              $('#logView').append(key+' : '+data[j][key]+' ');
            }
            $('#logView').append('}<br>');
          }
        }, false
      );
      dataWorkers[deviceURI].worker.postMessage({
        type: "START",
        url: "http://cmu-sds.herokuapp.com/sensor_readings/"+deviceURI,
        init_time: (fetchTime-timeLength*1000),
        update_time: fetchTime
      });
    },
    removeWorker = function(deviceURI){
      dataWorkers[deviceURI].worker.postMessage({ type: "STOP"});
      delete dataWorkers[deviceURI];
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
        '<div class="timeseriesClose">X</div>'+
        '</div>'
      );

      var selector = '.timeseriesView[data-d_uri="'+deviceURI+'"]';
      $(selector+'[data-s_id="'+metricId+'"]').draggable();

      if(dataWorkers[deviceURI] === undefined){
        dataWorkers[deviceURI] = { metrics : [] };
        //dataWorkers[deviceURI].metrics = [];
        insertWorker(deviceURI);
      }// else {
        dataWorkers[deviceURI].metrics.push(metricId);
      //}

    },
    remove: function(deviceURI, metricId){
      $('.timeseriesView[data-d_uri="'+deviceURI+'"][data-s_id="'+metricId+'"]').remove();
      var metricIndex = dataWorkers[deviceURI].metrics.indexOf(metricId);
      dataWorkers[deviceURI].metrics.splice(metricIndex, 1);
      //console.log(dataWorkers[deviceURI].metrics.length);
      if(dataWorkers[deviceURI].metrics.length === 0){
        removeWorker(deviceURI);
      }
    }
  };

})();
