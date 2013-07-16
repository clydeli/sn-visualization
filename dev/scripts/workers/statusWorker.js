var
  url = "",
  timer = {},
  interval = 7*1000;

function pollData(){
  try {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200 || xhr.status ==0) { postMessage(xhr.responseText); }
        //else { throw  xhr.status+xhr.responseText; }
        timer = setTimeout( function(){ pollData(); }, interval);
      }
    };
    xhr.open("GET", url+((new Date()).getTime())+"/temp/json", true);
    xhr.send();
  } catch(e){ postMessage("ERROR:"+e.message);}
}

self.addEventListener('message', function(e) {
  switch(e.data.type){
    case "START":
      url = e.data.url;
      pollData();
      break;
    case "RESUME":
      clearTimeout(timer);
      interval = 7*1000;
      pollData();
      break;
    case "PAUSE":
      clearTimeout(timer);
      interval = 60*60*1000;
      pollData();
      break;
    case "STOP":
      self.close();
      break;
  }
}, false);
