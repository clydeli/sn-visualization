var sn_visualization = sn_visualization || {};

sn_visualization.unitConverter = (function(){

  var
    deviceTypeTable = {
      "10170205": "Firefly", "10170204": "Firefly", "10170203": "Firefly", "10170202": "Firefly", "10170208": "Firefly", "10170209": "Firefly", "10170105": "Firefly", "10170104": "Firefly", "10170007": "Firefly", "10170008": "Firefly", "10170207": "Firefly", "10170206": "Firefly", "10170009": "Firefly", "10170303": "Firefly", "10170302": "Firefly", "10170006": "Firefly", "10170005": "Firefly", "10170004": "Firefly", "10170002": "Firefly", "10170003": "Firefly", "10170308": "Firefly", "10170307": "Firefly", "10170306": "Firefly", "10170305": "Firefly", "10170103": "Firefly", "10170102": "Firefly"
    },
    conversionTable = {
      "Firefly": {
        "bat": [0.003060217, 0, 'Battery voltage (V)'], // Battery voltage (V)
        "temp": [0.07506, 32, 'Temperature (analog sensor) (F)'], //
        "digital_temp": [0.18,32, 'Temperature (digital sensor) (F)'], // Temperature (digital sensor F)
        "light": [-1, 1, 'Incident Illumination (lumens)'], // Incident Illumination (lumens)
        "humidity": [1, 0, 'Relative Humidity (%)'], // Relative Humidity (%)
        "pressure": [0.000295781, 0, 'Barometric Pressure (in. Hg)'], //
        "acc_x": [1, 0, 'Acceleration - X (ft/sec^2)'], // Acceleration - X (ft / sec^2)
        "acc_x": [1, 0, 'Acceleration - Y (ft/sec^2)'], // Acceleration - Y (ft / sec^2)
        "acc_x": [1, 0, 'Acceleration - Z (ft/sec^2)'], // Acceleration - Z (ft / sec^2)
        "audio_p2p": [1, 0, 'Audio Level (relative)'], // Audio Level (relative)
        "motion": [950, 0, 'Motion Detected (binary)'] // Motion Detected (binary)
      }
    };

  return{
    convert: function(deviceURI, metricId, value){
      if(deviceTypeTable[deviceURI]){
        var convertRule = conversionTable[deviceTypeTable[deviceURI]][metricId];
        return value*convertRule[0]+convertRule[1]; // data = A*rawdata + B
      } else { return value; }
    },
    sensorName: function(deviceURI, metricId){
      if(deviceTypeTable[deviceURI]){
        return conversionTable[deviceTypeTable[deviceURI]][metricId][2];
      } else { return metricId; }
    }
  }


})();
