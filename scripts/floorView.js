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
	this.selector = selector || "#geographicalView #geographicalContainer";
	this.backgroundGeo = bgGeo || [[37.410118,-122.059129], [37.410516,-122.060205]];
	this.elevations = elevations || 1;
	this.uriGeoTable = ugTable || {
		'10170205' : { print_name : "214B", geo : [37.410457,-122.059826, 1] },
		'10170204' : { print_name : "214", geo : [37.410459,-122.059878, 1] },
		'10170203' : { print_name : "213", geo : [37.410452,-122.059956, 1] },
		'10170202' : { print_name : "216", geo : [37.410422,-122.059956, 1] },
		'10170208' : { print_name : "217A", geo : [37.410418,-122.059768, 1] },
		'10170209' : { print_name : "217B", geo : [37.410418,-122.059708, 1] },
		'10170105' : { print_name : "228", geo : [37.410328,-122.059400, 1] },
		'10170104' : { print_name : "230", geo : [37.410291,-122.059400, 1] },
		'10170007' : { print_name : "211", geo : [37.410168,-122.059760, 1] },
		'10170008' : { print_name : "212", geo : [37.410168,-122.059920, 1] },
		'10170207' : { print_name : "215", geo : [37.410459,-122.059710, 1] },
		'10170206' : { print_name : "215B", geo : [37.410457,-122.059766, 1] },
		'10170009' : { print_name : "210", geo : [37.410199,-122.059964, 1] },
		'10170303' : { print_name : "104", geo : [37.410260,-122.059940, 0] },
		'10170302' : { print_name : "105B", geo : [37.410238,-122.059940, 0] },
		'10170006' : { print_name : "107", geo : [37.410202,-122.059960, 0] },
		'10170005' : { print_name : "109", geo : [37.410172,-122.059920, 0] },
		'10170004' : { print_name : "110", geo : [37.410172,-122.059750, 0] },
		'10170002' : { print_name : "115", geo : [37.410185,-122.059550, 0] },
		'10170003' : { print_name : "116", geo : [37.410206,-122.059550, 0] },
		'10170308' : { print_name : "120", geo : [37.410402,-122.059930, 0] },
		'10170307' : { print_name : "122", geo : [37.410385,-122.059940, 0] },
		'10170306' : { print_name : "124", geo : [37.410370,-122.059940, 0] },
		'10170305' : { print_name : "126", geo : [37.410350,-122.059940, 0] },
		'10170103' : { print_name : "129", geo : [37.410312,-122.059650, 0] },
		'10170102' : { print_name : "129A", geo : [37.410330,-122.059490, 0] },
		'23-03' : { print_name : "213J", geo : [37.410452,-122.059976, 1] },
		'23-05' : { print_name : "214J", geo : [37.410459,-122.059898, 1] },
		'23-01' : { print_name : "216J", geo : [37.410422,-122.059976, 1] },
		'Sweetfeedback_device_3' : { print_name : "120T", geo : [37.410402,-122.059950, 0] }
	};
	this.imgs = imgs || [
		"images/floor1blankbw.png", "images/floor2blankbw.png"
	];
	for(var i=0; i<this.imgs.length; ++i){
		$(this.selector).append('<img src="'+this.imgs[i]+'">');
	}

	this.initNodes();
};

sn_visualization.floorView.prototype = {
	getPosition : function(uri){
		if(this.uriGeoTable.hasOwnProperty(uri)){
			var uriGeo = this.uriGeoTable[uri].geo;
			var position =
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
				"<div class='floorNode' data-d_uri='"+nodeKey+
				"' style='left:"+uriGeo[0]+"%; top:"+uriGeo[1]+"%;'>"+
				this.uriGeoTable[nodeKey].print_name+"</div>";
			$(this.selector).append(nodeHtml);
		}
	},
	toggleHighlight : function(uri){
		if(this.uriGeoTable.hasOwnProperty(uri)){
			$(this.selector+" .floorNode[data-d_uri='"+uri+"']").toggleClass("highlighted");
			var heightPercentage = $(this.selector).height() * (this.uriGeoTable[uri].geo[2]/(this.elevations+1));
			$(this.selector).parent().animate({scrollTop: heightPercentage}, 600);
		}
	}
};
