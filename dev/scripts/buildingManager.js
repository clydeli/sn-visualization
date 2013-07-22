var sn_visualization = sn_visualization || {};

sn_visualization.buildingManager = function(googleMapInstance, buildingContainer){
  var
    googleMapInstance = googleMapInstance,
    buildingContainer = buildingContainer,
    buildingsTable = {},
    buildingMapPolygons = {},
    buildingMapListeners = {},

    insertBuilding = function(buildingId, buildingData){

      // Construct the building polygon
      buildingMapPolygons[buildingId] = new google.maps.Polygon({
        paths: [
          new google.maps.LatLng(buildingData.polygonGeo[0][0], buildingData.polygonGeo[0][1]),
          new google.maps.LatLng(buildingData.polygonGeo[1][0], buildingData.polygonGeo[1][1]),
          new google.maps.LatLng(buildingData.polygonGeo[2][0], buildingData.polygonGeo[2][1]),
          new google.maps.LatLng(buildingData.polygonGeo[3][0], buildingData.polygonGeo[3][1])
        ],
        strokeColor: '#0000ff', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: '#0000ff', fillOpacity: 0.35, clickable: true,
      });

      // Put building polygon on map and add listener
      buildingMapPolygons[buildingId].setMap(googleMapInstance);
      buildingMapListeners[buildingId] = google.maps.event.addListener(
        buildingMapPolygons[buildingId], "click",
        function(){
          $(buildingContainer).removeClass('hidden');
          showBuilding(buildingId);
        }
      );

      // Create the container for the building and initialize it
      $(buildingContainer).append(
        "<div id='"+buildingId+"Building' class='buildingContainer'>"+
        "<span class='buildingCloseBtn'>x</span><span class='heatmapToggleBtn'>Toggle Heatmap</span>"+
        "</div>"
      );
      buildingsTable[buildingId] = new sn_visualization.buildingInstance(buildingData, '#'+buildingId+'Building');

    },
    showBuilding = function(buildingId){
      console.log(buildingId);
      $('#geographicalContainer').removeClass('hidden');
      $('.buildingContainer').hide();
      $('#'+buildingId+'Building').show();
      buildingsTable[buildingId].resumeWorkers();
    };
    hideBuilding = function(buildingId){
      if(buildingId){}
      else{
        for(var key in buildingsTable){
          buildingsTable[key].pauseWorkers();
        }
      }
    }

  return {
    insertBuilding : insertBuilding,
    showBuilding : showBuilding,
    hideBuilding : hideBuilding,
    getBuilding : function(buildingId){
      return buildingsTable[buildingId];
    }
  };
};

