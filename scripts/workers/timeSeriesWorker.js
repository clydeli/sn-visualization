var
  url = "",
  interval = 1000,
  updateTime = 0;

function pollData(start_time, end_time){
  try {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200 || xhr.status ==0) { postMessage(xhr.responseText); }
        else { throw  xhr.status+xhr.responseText; }
        setTimeout( function(){
          var lastUpdateTime = updateTime;
          updateTime = (new Date()).getTime();
          pollData(lastUpdateTime, updateTime);
        }, interval);
      }
    };
    xhr.open("GET",url+"?start_time="+start_time+"&end_time="+end_time, true);
    xhr.send();
  } catch(e){ postMessage("ERROR:"+e.message);}
}


self.addEventListener('message', function(e) {
  //self.postMessage("worker started");
  switch(e.data.type){
    case "START":
      url = e.data.url;
      updateTime = e.data.update_time;
      pollData(e.data.init_time, updateTime);
      break;
    case "STOP":
      self.close();
      break;
  }
}, false);
