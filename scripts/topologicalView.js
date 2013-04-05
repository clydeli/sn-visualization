var sn_visualization = sn_visualization || {};

sn_visualization.topologicalView = (function(){

	var
		_root = {},

		d3Init = function(svgBody){
			var
				m = [20, 120, 20, 120],
				w = 800 - m[1] - m[3],
				h = $('#topologicalView').height() - m[0] - m[2],
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

			_root;
			_root.x0 = h / 2;
			_root.y0 = 0;

			_root.children.forEach(toggleAll);
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
						if($(this).find('text').attr('data-type') == "Sensor"){
							var
								d_uri = $(this).find('text').attr('data-d_uri'),
								s_id = $(this).find('text').attr('data-s_id');
								d_name = $(this).find('text').attr('data-d_name');
								name = $(this).find('text').attr('data-name');

							if (d.children){ sn_visualization.timeseriesView.remove( d_uri, s_id); }
							else { sn_visualization.timeseriesView.insert( d_uri, s_id, d_name, name );	}

						// else if the node is a device
						} else if($(this).find('text').attr('data-type') == "Device"){
							var view = sn_visualization.floorViews.getView("cmusvSecondFloor");
							view.toggleHighlight($(this).find('text').attr('data-d_uri'));
						}

						toggle(d);
						update(d);
					});

				nodeEnter.append("svg:circle")
					.attr("r", 1e-6)
					.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

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
					.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

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
					if(d.type !== 'Sensor'){ $(svgBody).scrollLeft($(svgBody).scrollLeft()-160); }
				} else {
					d.children = d._children; d._children = null;
					if(d.type !== 'Sensor'){ $(svgBody).scrollLeft($(svgBody).scrollLeft()+160); }
				}
			}

			function toggleAll(d) {
				if (d.children) {	d.children.forEach(toggleAll); toggle(d);	}
			}

		};

	return {
		initialize : function(root){
			_root = root;
			d3Init("#topologicalView");
		}
	};

})();
