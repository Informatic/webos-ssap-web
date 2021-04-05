function proxyPayload(address) {
  function forward(type, data) {
    window.parent.postMessage(JSON.stringify({type: type, data: data}), "*");
  }
  const conn = new WebSocket(address);
  conn.onopen = function (evt) {forward('open', evt);}
  conn.onclose = function (evt) {forward('close', evt);}
  conn.onerror = function (evt) {forward('error', evt);}
  conn.onmessage = function (evt) {forward('message', {data: evt.data});}
  window.addEventListener("message", function (event) {
    const msg = (JSON.parse(event.data));
    if (msg.type === 'send') {
      conn.send(msg.data);
    } else if (msg.type === 'close') {
      conn.close();
    }
  }, false);
}

class ProxyWebSocket {
  constructor(target) {
    this.proxy = document.createElement('iframe');
    this.proxy.style.display = 'none';
    this.proxy.setAttribute('src', 'data:text/html;base64,' + btoa('<h1>hello</h1><script>window.onerror=function(err) { alert(err.toString()); }</script><script>' + proxyPayload.toString() + ';proxyPayload(' + JSON.stringify(target) + ');</script>'));
    window.addEventListener("message", (event) => {
      if (event.source !== this.proxy.contentWindow) return;

      const msg = JSON.parse(event.data);
      const type = msg.type; const data = msg.data;

      if (type === 'message' && this.onmessage) this.onmessage(data);
      if (type === 'close' && this.onclose) {
        this.proxy.remove();
        this.onclose(data);
      }

      if (type === 'error' && this.onerror) this.onerror(data);
      if (type === 'open' && this.onopen) this.onopen(data);
      if (type === 'log') console.info('proxy:', data);
    }, false);
    document.querySelector('body').appendChild(this.proxy);
  }

  send(data) {
    this.proxy.contentWindow.postMessage(JSON.stringify({type: 'send', data: data}), '*');
  }

  close() {
    this.proxy.contentWindow.postMessage(JSON.stringify({type: 'close'}), '*');
  }
}
