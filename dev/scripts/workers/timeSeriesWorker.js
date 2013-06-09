var
  url = "",
  interval = 3000,
  updateTime = 0,
  metricId = "";

function pollData(start_time, end_time){
  try {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200 || xhr.status ==0) { postMessage(xhr.responseText); }
        //else { throw  xhr.status+xhr.responseText; } // Not throwing exception as temporary solution for 404 response
        setTimeout( function(){
          var lastUpdateTime = updateTime;
          updateTime = (new Date()).getTime();
          pollData(lastUpdateTime, updateTime);
        }, interval);
      }
    };
    xhr.open("GET",url+"/"+start_time+"/"+end_time+"/"+metricId+"/json", true);
    xhr.send();
  } catch(e){ postMessage("ERROR:"+e.message); }
}


self.addEventListener('message', function(e) {
  //self.postMessage("worker started");
  switch(e.data.type){
    case "START":
      url = e.data.url;
      metricId = e.data.metric_id;
      updateTime = e.data.update_time;
      pollData(e.data.init_time, updateTime);
      break;
    case "STOP":
      self.close();
      break;
  }
}, false);
