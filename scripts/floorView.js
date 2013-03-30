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

sn_visualization.floorView = function(selector, bgGeo, ugTable){
	// temporary use cmusv second floor as default
	this.selector = selector || "#geographicalView";
	this.backgroundGeo = bgGeo || [[37.410504,-122.060152], [37.410276,-122.059239]];
	this.uriGeoTable = ugTable || { 
		10170204 : { print_name : "214", geo : [37.410489,-122.059905] },
		10170203 : { print_name : "213", geo : [37.410484,-122.059986] },
		10170202 : { print_name : "216", geo : [37.410465,-122.059986] }
	};
	this.initNodes();
};

sn_visualization.floorView.prototype = {
	getPosition : function(uri){
		if(this.uriGeoTable.hasOwnProperty(uri)){
			var uriGeo = this.uriGeoTable[uri].geo;
			var position = 
			[ (uriGeo[0]-this.backgroundGeo[0][0])*100 / (this.backgroundGeo[1][0]-this.backgroundGeo[0][0]),
			  (uriGeo[1]-this.backgroundGeo[0][1])*100 / (this.backgroundGeo[1][1]-this.backgroundGeo[0][1]) ];
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
		console.log(uri);
		$(this.selector+" .floorNode[data-d_uri='"+uri+"']").toggleClass("highlighted");
	}
};
