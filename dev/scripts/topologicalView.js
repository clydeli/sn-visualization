var sn_visualization = sn_visualization || {};

sn_visualization.topologicalView = (function(){

	var
		_root = {},
		d3Update = {},
    statusColorTable = {},

		d3Init = function(svgBody, width, height, isResize){
			var
				m = [20, 120, 20, 120],
				w = width - m[1] - m[3],
				h = height - m[0] - m[2],
				i = 0;

			var tree = d3.layout.tree()
				.size([h, w]);

			var diagonal = d3.svg.diagonal()
				.projection(function(d) { return [d.y, d.x]; });

			var vis = d3.select(svgBody).append("svg:svg")
				.attr("width", w + m[1] + m[3])
				.attr("height", h + m[0] + m[2])
				.append("svg:g")
				.attr("transform", "translate(" + m[3] + "," + m[0] + ")");

			_root.x0 = h / 2;
			_root.y0 = 0;

			if(!isResize){ _root.children.forEach(toggleAll); }

			//toggle(_root.children[1]);
			//toggle(_root.children[1].children[2]);
			//toggle(_root.children[9]);
			//toggle(_root.children[9].children[0]);

			update(_root);

			function update(source) {
				var duration = d3.event && d3.event.altKey ? 5000 : 500;

				var nodes = tree.nodes(_root).reverse(); // Compute the new tree layout.
				nodes.forEach(function(d) { d.y = d.depth * 180; }); // Normalize for fixed-depth.

				var node = vis.selectAll("g.node") // Update the nodes…
					.data(nodes, function(d) { return d.id || (d.id = ++i); });

				var nodeEnter = node.enter().append("svg:g") // Enter any new nodes at the parent's previous position.
					.attr("class", "node")
					.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
					.on("click", function(d) {

						// If the node is a sensor
						if(d.type == "Sensor"){
  						if (d.children){ sn_visualization.timeseriesManager.remove( d.d_uri, d.s_id); }
  						else { sn_visualization.timeseriesManager.insert( d.d_uri, d.s_id, d.d_name, d.name );	}
						// else if the node is a device
						} else if(d.type == "Device"){
							//var view = sn_visualization.floorViews.getView("cmusvFloors");
							//view.toggleHighlight(d.d_uri);
						}

						toggle(d);
						update(d);
					});

				nodeEnter.append("svg:circle")
					.attr("r", 1e-6)
					.style("fill", function(d) {
            if(statusColorTable.hasOwnProperty(d.d_uri)){
              return statusColorTable[d.d_uri];
            }
            return d._children ? "lightsteelblue" : "#fff";
          });

				nodeEnter.append("svg:text")
					.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
					.attr("dy", ".35em")
					.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
					.attr("data-type", function(d) { return d.type || ""; })
					.attr("data-d_uri", function(d) { return d.d_uri || ""; })
					.attr("data-s_id", function(d) { return d.s_id || ""; })
					.attr("data-d_name", function(d) { return d.d_name || ""; })
					.attr("data-name", function(d) { return d.name || ""; })
					.text(function(d) { return d.name; })
					.style("fill-opacity", 1e-6);

				// Transition nodes to their new position.
				var nodeUpdate = node.transition()
					.duration(duration)
					.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

				nodeUpdate.select("circle")
					.attr("r", 4.5)
					.style("fill", function(d) {
            if(statusColorTable.hasOwnProperty(d.d_uri)){
              return statusColorTable[d.d_uri];
            }
            return d._children ? "lightsteelblue" : "#fff";
          });

				nodeUpdate.select("text")
					.style("fill-opacity", 1);

				// Transition exiting nodes to the parent's new position.
				var nodeExit = node.exit().transition()
					.duration(duration)
					.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
					.remove();

				nodeExit.select("circle")
					.attr("r", 1e-6);

				nodeExit.select("text")
					.style("fill-opacity", 1e-6);

				// Update the links…
				var link = vis.selectAll("path.link")
					.data(tree.links(nodes), function(d) { return d.target.id; });

				// Enter any new links at the parent's previous position.
				link.enter().insert("svg:path", "g")
					.attr("class", "link")
					.attr("d", function(d) {
						var o = {x: source.x0, y: source.y0};
						return diagonal({source: o, target: o});
					})
					.transition()
					.duration(duration)
					.attr("d", diagonal);

				// Transition links to their new position.
				link.transition()
					.duration(duration)
					.attr("d", diagonal);

				// Transition exiting nodes to the parent's new position.
				link.exit().transition()
					.duration(duration)
					.attr("d", function(d) {
						var o = {x: source.x, y: source.y};
						return diagonal({source: o, target: o});
					})
					.remove();

				// Stash the old positions for transition.
				nodes.forEach(function(d) {	d.x0 = d.x;	d.y0 = d.y;	});
			}

			// Toggle children.
			function toggle(d) {
				if (d.children) {
					d._children = d.children;	d.children = null;
				} else {
					d.children = d._children; d._children = null;
				}
			}

			function toggleAll(d) {
				if (d.children) {	d.children.forEach(toggleAll); toggle(d);	}
			}

			// Expose the update function
			d3Update = update;
		},

		// Helper functions written for later...
		openChildren = function(d){
			if (d.children === null){
				d.children = d._children; d._children = null;
				d3Update(d);
			}
		},
		closeChildren = function(d){
			if (d.children !== null){
				d._children = d.children; d.children = null;
				d3Update(d);
			}
		},
		findChildren = function(node, attr, attrValue, type){
			if(node.type == type){
				for(var i=0; i<attr.length; ++i){
					if(node[attr[i]] !== attrValue[i]){ return false; }
				}
				//if(node[attr] == attrValue){ return node; }
				return node;
			}
			var currentChildren = node.children || node._children;
			for(childrenKey in currentChildren){
				var findNext = findChildren(currentChildren[childrenKey], attr, attrValue, type);
				if(findNext){ return findNext; }
			}
			return false;
		},
		findAndOpenDevice = function(node, uri){
			if(node.type == "Device"){
				if(node.d_uri == uri){ openChildren(node); return true;	}
				return false;
			}

			var currentChildren = node.children || node._children;
			for(childrenKey in currentChildren){
				if(findAndOpenDevice(currentChildren[childrenKey], uri) ){
					openChildren(node);
          return true;
				}
			}
			return false;
		};

	return {
		initialize : function(root){
			_root = root;
			d3Init("#topologicalView", 760, $('#topologicalView').height()*0.95);

			$("#topologicalSlider").slider({
				orientation: "vertical", range: "min", min: 0, max: 100,
				slide: function( event, ui ) {
					sn_visualization.topologicalView.resize(1+ui.value/100);
				}
			 });

      $("#topologicalPin").click(function(){
        $("#topologicalView").toggleClass("pinned");
      });

		},

    // Shorthand functions for manipulating the topological view
		openDevice : function(uri){
			findAndOpenDevice(_root, uri);
			//$("#topologicalView")[0].scrollLeft = 320;
		},
		closeDevice : function(uri){
			var device = findChildren(_root, ["d_uri"], [uri], "Device");
			if(device) { closeChildren(device);	}
			//$("#topologicalView")[0].scrollLeft = 320;
		},
		closeSensor : function(uri, s_id){
			var sensor = findChildren(_root, ["d_uri", "s_id"], [uri, s_id], "Sensor");
			if(sensor) { closeChildren(sensor);	}
			//$("#topologicalView")[0].scrollLeft = 480;
		},

    // Some other maitainence functions
		resize : function(zoom){
			$('#topologicalView svg').remove();
			d3Init("#topologicalView", 760*zoom, $('#topologicalView').height()*0.95*zoom, true);
		},
    updateStatus : function(data){
      for(var i=0; i<data.length; ++i){
        var
          offset = (new Date()).getTime()-data[i].timestamp,
          targetCircle = $('#topologicalView svg text[data-d_uri="'+data[i].device_id+'"]').parent().find('circle');

        if(offset > 3*60*1000){ statusColorTable[data[i].device_id] = "red"; }
        else if(offset > 15*1000){ statusColorTable[data[i].device_id] = "khaki"; }
        else { statusColorTable[data[i].device_id] = "steelBlue"; }
        targetCircle.css('fill', statusColorTable[data[i].device_id]);
      }
    }
	};

})();
