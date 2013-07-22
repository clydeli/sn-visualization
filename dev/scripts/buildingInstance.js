
sn_visualization.buildingInstance = function(buildingData, selector){
  this.heatmaps = [],
  this.heatmapWorkers = {},
  this.selector = selector;
  this.backgroundGeo = buildingData.bgGeo;
  this.elevations = buildingData.elevations;
  this.uriGeoTable = buildingData.ugTable;
  this.imgs = buildingData.imgs;
  for(var i=0; i<this.imgs.length; ++i){
    $(this.selector).append('<img src="'+this.imgs[i]+'" class="floorPic" data-elevation="'+i+'">');
  }
  this.initView();
};

sn_visualization.buildingInstance.prototype = {
  getPosition : function(uri){
    if(this.uriGeoTable.hasOwnProperty(uri)){
      var
        uriGeo = this.uriGeoTable[uri].geo,
        position =
          [ (uriGeo[0]-this.backgroundGeo[0][0])*100 / (this.backgroundGeo[1][0]-this.backgroundGeo[0][0]),
            (uriGeo[1]-this.backgroundGeo[0][1])*100 / (this.backgroundGeo[1][1]-this.backgroundGeo[0][1]) ];
      return position;
    } else {return [0, 0]; }
  },
  initView : function(){
    // Init device map
    for(var i=0; i<=this.elevations; ++i){
      var deviceMapHtml = '<div class="devicemap" style="height: '+100/(this.elevations+1)+'%; top: '+i*100/(this.elevations+1)+'%;">';
      for(var nodeKey in this.uriGeoTable){
        if(this.uriGeoTable[nodeKey].geo[2] !== i){ continue; }
        var uriGeo = this.getPosition(nodeKey);
        deviceMapHtml +=
          "<div class='floorNode' data-elevation='"+this.uriGeoTable[nodeKey].geo[2]+"' data-d_uri='"+nodeKey+
          "' style='left:"+uriGeo[0]+"%; top:"+uriGeo[1]+"%;'><div class='nodeBlock'></div>"+
          "<div class='hoverBlock'>"+this.uriGeoTable[nodeKey].print_name+"</div></div>";
      }
      deviceMapHtml += '</div>';
      $(this.selector).append(deviceMapHtml);
    }

    // Init Heatmap
    for(var i=0; i<=this.elevations; ++i){
      var heatmapHtml = '';
      heatmapHtml +=
        '<div class="heatmap hidden" data-elevation="'+i+'" style="height: '+100/(this.elevations+1)+'%; top: '+i*100/(this.elevations+1)+'%;">'+
          '<canvas style="width: 100%; height: 100%">'
        '</div>';
      $(this.selector).append(heatmapHtml);
      this.heatmaps.push(
        createWebGLHeatmap({canvas: $(this.selector+' .heatmap[data-elevation="'+i+'"][canvas]')[0]})
      );
      $(this.selector+' .heatmap[data-elevation="'+i+'"]').html(this.heatmaps[i].canvas);
    }
    this.addHeatmapWorker("temp"); // temporary only temp heatmap

  },

  resumeWorkers : function(){
    for(var key in this.heatmapWorkers){
      this.heatmapWorkers[key].postMessage({ type: "RESUME" });
    }
  },

  pauseWorkers : function(){
    for(var key in this.heatmapWorkers){
      this.heatmapWorkers[key].postMessage({ type: "PAUSE" });
    }
  },

  addHeatmapWorker : function(metricId){
    var self = this;
    this.heatmapWorkers[metricId] = new Worker('scripts/workers/heatmapWorker.js');
      this.heatmapWorkers[metricId].addEventListener(
        'message', function(e){
          var data = JSON.parse(e.data);
          console.log("last updated device values ("+metricId+")", data);

          // Clear old heatmap
          for(var i=0; i<=self.elevations; ++i){ self.heatmaps[i].clear(); }

          var
            width = $(self.selector+" .heatmap:last").width(),
            height = $(self.selector+" .heatmap:last").height();

          for(var i=0; i<width; ++i){
            for(var j=0; j<height; ++j){
              for(var k=0; k<=self.elevations; ++k){
                //self.heatmaps[k].addPoint(i, j, 2, 0.5);
              }
            }
          }

          // Insert new data into heatmap
          var dataSum = 0, dataMax = 0, dataMin = Infinity, dataLength = 0;
          for(var i=0; i<data.length; ++i){
            if(self.uriGeoTable.hasOwnProperty(data[i].device_id)){
              dataSum += data[i].value;
              ++dataLength;
              if(data[i].value > dataMax){ dataMax = data[i].value; }
              if(data[i].value < dataMin){ dataMin = data[i].value; }
            }
          }
          var dataAvg = dataSum/dataLength;
          for(var i=0; i<data.length; ++i){
            if(self.uriGeoTable.hasOwnProperty(data[i].device_id)){
              var
                elevation = self.uriGeoTable[data[i].device_id].geo[2],
                position = self.getPosition(data[i].device_id),
                value = (data[i].value-dataAvg)/(dataMax-dataMin);

              if(value > 0){ value = 0.5 + value*0.5; } else { value = 0.5 - value*0.5; }

              self.heatmaps[elevation].addPoint(width*position[0]/100, height*position[1]/100, 50, value );
              //self.heatmaps[elevation].addPoint(width*position[0]/100, height*position[1]/100, 100, (data[i].value-450)/100);
            }
          }

          // Update and refresh heatmap display
          for(var i=0; i<=self.elevations; ++i){
            self.heatmaps[i].adjustSize();
            self.heatmaps[i].update();
            self.heatmaps[i].display();
            //self.heatmaps[i].blur();
            //self.heatmaps[i].clamp(0.0, 1.0);
          }

        }, false
      );
      this.heatmapWorkers[metricId].postMessage({
        type: "START",
        metricId: metricId,
        url: "http://"+sn_visualization.serverAddress+"/last_readings_from_all_devices/",
      });
  },

  toggleHighlight : function(uri){
    if(this.uriGeoTable.hasOwnProperty(uri)){
      $(this.selector+" .floorNode[data-d_uri='"+uri+"']").toggleClass("highlighted");
      var heightPercentage = $(this.selector).height() * (this.uriGeoTable[uri].geo[2]/(this.elevations+1));
      $(this.selector).parent().animate({scrollTop: heightPercentage}, 600);
    }
  },
  updateDeviceStatus : function(data){

    var now = new Date();

    for(var i=0; i<data.length; ++i){
      var
        offset = now.getTime()-data[i].timestamp,
        targetBlock = $('.floorNode[data-d_uri="'+data[i].device_id+'"] .nodeBlock');

      targetBlock.removeClass('badBlock avgBlock goodBlock');
      if(offset > 3*60*1000){ targetBlock.addClass('badBlock'); }
      else if(offset > 15*1000){ targetBlock.addClass('avgBlock'); }
      else { targetBlock.addClass('goodBlock'); }
    }

  }
};
