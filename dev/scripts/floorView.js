var sn_visualization = sn_visualization || {};

sn_visualization.floorViews = (function(){
  var
    viewsTable = {},
    insertView = function(viewId, view){
      viewsTable[viewId] = view;
    },
    getView = function(viewId){
      return viewsTable[viewId];
    };
  return {
    insertView : insertView,
    getView : getView
  };
}());

sn_visualization.floorView = function(bgGeo, elevations, ugTable, selector, imgs){
  // temporary use cmusv second floor as default
  this.worker = {};
  this.selector = selector || "#geographicalView #geographicalContainer";
  this.backgroundGeo = bgGeo || [[37.410326,-122.059208], [37.410490,-122.060227]];
  this.elevations = elevations || 1;
  this.uriGeoTable = ugTable || {
    '10170205' : { print_name : "214B", geo : [37.410465,-122.059935, 1] },
    '10170204' : { print_name : "214", geo : [37.410465,-122.059990, 1] },
    '10170203' : { print_name : "213", geo : [37.410466,-122.060050, 1] },
    '10170202' : { print_name : "216", geo : [37.410449,-122.060050, 1] },
    '10170208' : { print_name : "217A", geo : [37.410449,-122.059784, 1] },
    '10170209' : { print_name : "217B", geo : [37.410449,-122.059874, 1] },
    '10170105' : { print_name : "228", geo : [37.410411,-122.059480, 1] },
    '10170104' : { print_name : "230", geo : [37.410400,-122.059480, 1] },
    '10170007' : { print_name : "211", geo : [37.410350,-122.059890, 1] },
    '10170008' : { print_name : "212", geo : [37.410350,-122.059990, 1] },
    '10170207' : { print_name : "215", geo : [37.410465,-122.059780, 1] },
    '10170206' : { print_name : "215B", geo : [37.410465,-122.059852, 1] },
    '10170009' : { print_name : "210", geo : [37.410362,-122.060040, 1] },
    '10170303' : { print_name : "104", geo : [37.410386,-122.060032, 0] },
    '10170302' : { print_name : "105B", geo : [37.410379,-122.060032, 0] },
    '10170006' : { print_name : "107", geo : [37.410368,-122.060048, 0] },
    '10170005' : { print_name : "109", geo : [37.410350,-122.059990, 0] },
    '10170004' : { print_name : "110", geo : [37.410350,-122.059930, 0] },
    '10170002' : { print_name : "115", geo : [37.410357,-122.059680, 0] },
    '10170003' : { print_name : "116", geo : [37.410365,-122.059680, 0] },
    '10170308' : { print_name : "120", geo : [37.410442,-122.060030, 0] },
    '10170307' : { print_name : "122", geo : [37.410437,-122.060030, 0] },
    '10170306' : { print_name : "124", geo : [37.410431,-122.060030, 0] },
    '10170305' : { print_name : "126", geo : [37.410425,-122.060030, 0] },
    '10170103' : { print_name : "129", geo : [37.410400,-122.059750, 0] },
    '10170102' : { print_name : "129A", geo : [37.410415,-122.059630, 0] },
    '23-03' : { print_name : "213J", geo : [37.410460,-122.060090, 1] },
    '23-05' : { print_name : "214J", geo : [37.4104695,-122.060006, 1] },
    '23-01' : { print_name : "216J", geo : [37.410454,-122.060090, 1] },
    'Sweetfeedback_device_3' : { print_name : "120T", geo : [37.410442,-122.060080, 0] }
  };
  this.imgs = imgs || [
    "images/floor1.png", "images/floor2.png"
  ];
  for(var i=0; i<this.imgs.length; ++i){
    $(this.selector).append('<img src="'+this.imgs[i]+'" class="floorPic" data-elevation="'+i+'">');
  }

  this.initNodes();
};

sn_visualization.floorView.prototype = {
  getPosition : function(uri){
    if(this.uriGeoTable.hasOwnProperty(uri)){
      var uriGeo = this.uriGeoTable[uri].geo;
      var position =
      /*[ (uriGeo[0]-this.backgroundGeo[0][0])*100 / (this.backgroundGeo[1][0]-this.backgroundGeo[0][0]),
        (uriGeo[1]-this.backgroundGeo[0][1])*100 / (this.backgroundGeo[1][1]-this.backgroundGeo[0][1])
      ];*/
      [ (uriGeo[0]-this.backgroundGeo[0][0])*100 / (this.backgroundGeo[1][0]-this.backgroundGeo[0][0]),
        ((uriGeo[1]-this.backgroundGeo[0][1])*100/(this.elevations+1)) / (this.backgroundGeo[1][1]-this.backgroundGeo[0][1])
        + 100*(uriGeo[2]/(this.elevations+1))
      ];
      return position;
    } else {return [0, 0]; }
  },
  initNodes : function(){
    for(var nodeKey in this.uriGeoTable){
      var uriGeo = this.getPosition(nodeKey);
      var nodeHtml =
        "<div class='floorNode' data-elevation='"+this.uriGeoTable[nodeKey].geo[2]+"' data-d_uri='"+nodeKey+
        "' style='left:"+uriGeo[0]+"%; top:"+uriGeo[1]+"%;'><div class='nodeBlock'></div>"+
        /*this.uriGeoTable[nodeKey].print_name+*/"</div>";
      $(this.selector).append(nodeHtml);
    }
    this.pollingStatus();
    //$('.floorNode, .floorPic').hide();
    //$('.floorNode[data-elevation="0"], .floorPic[data-elevation="0"]').show();
  },
  toggleHighlight : function(uri){
    if(this.uriGeoTable.hasOwnProperty(uri)){
      $(this.selector+" .floorNode[data-d_uri='"+uri+"']").toggleClass("highlighted");
      var heightPercentage = $(this.selector).height() * (this.uriGeoTable[uri].geo[2]/(this.elevations+1));
      $(this.selector).parent().animate({scrollTop: heightPercentage}, 600);
    }
  },
  // Inner Functions
  pollingStatus : function(){

    this.worker = new Worker('scripts/workers/floorViewWorker.js');
    this.worker.addEventListener(
      'message', function(e){
        var
          data = JSON.parse(e.data),
          now = new Date();

        for(var key in data){
          var offset = now.getTime()-data[key]*1000;
          $('.floorNode[data-d_uri="'+key+'"] .nodeBlock').removeClass('badBlock avgBlock goodBlock');
          if(offset > 3*60*1000){ $('.floorNode[data-d_uri="'+key+'"] .nodeBlock').addClass('badBlock'); }
          else if(offset > 15*1000){ $('.floorNode[data-d_uri="'+key+'"] .nodeBlock').addClass('avgBlock'); }
          else { $('.floorNode[data-d_uri="'+key+'"] .nodeBlock').addClass('goodBlock'); }
        }
        console.log(data);

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
    this.worker.postMessage({
      type: "START",
      url: "http://cmu-sds.herokuapp.com/get_last_reading_time_for_all_devices",
    });
  }
};
