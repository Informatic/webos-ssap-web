function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

function log(msg) {
  const l = document.querySelector('#log');
  l.innerText = '[' + new Date() + '] ' + msg + '\n' + l.innerText;
}

let client = null;

let inputSocket = null;
document.addEventListener('keydown', (evt) => {
  const keys = {
    'Enter': 'ENTER',
    'ArrowLeft': 'LEFT',
    'ArrowRight': 'RIGHT',
    'ArrowUp': 'UP',
    'ArrowDown': 'DOWN',
    'Escape': 'BACK',
    'Home': 'HOME',
  };

  if (evt.key in keys && inputSocket) {
    inputSocket.send(Object.entries({type: 'button', name: keys[evt.key]}).map(([k, v]) => `${k}:${v}`).join('\n') + '\n\n');
  }
});

document.querySelector('#run').addEventListener('click', async () => {
  if (client) {
    client.close();
    client = null;
  }

  const target = document.querySelector('#ip').value;
  client = new SSAPClient(target, window.localStorage['client-key-' + target]);
  log('connecting...');
  await client.connect();
  log('registering...');
  let manifest = defaultAppManifest;
  try {
    manifest = JSON.parse(window.localStorage['ssap-app-manifest']);
    log("using custom manifest");
  } catch (err) {}
  window.localStorage['client-key-' + target] = await client.register(manifest);
  log('connected');

  document.querySelector(':focus').blur();

  (async () => {
    const sock = await client.request({
      uri: 'ssap://com.webos.service.networkinput/getPointerInputSocket'
    });

    inputSocket = new WebSocket(sock.payload.socketPath);
    inputSocket.onopen = () => {
      log('input open');
    }
    inputSocket.onerror = (err) => log('input err ' + err.msg);
    inputSocket.onclose = () => log('input close');
  })();

  while (true) {
    const res = await client.request({
      uri: 'ssap://tv/executeOneShot',
      payload: {},
    });

    const oldb = document.querySelector('.capture .back');
    if (oldb) {
      oldb.remove();
    }

    const oldf = document.querySelector('.capture .front');
    if (oldf) {
      oldf.classList.remove('front');
      oldf.classList.add('back')
    }

    // This is bad. We do some """double-buffering""" of dynamically-generated
    // SVG objects in order to bust Chrome's cache for preview image. `imageUri`
    // here is static for all responses, and doesn't accept any extra query
    // arguments. This hack seems to solve it on Chrome. (Firefox seems to
    // update the <img> if hash-part of an URL changes)
    const newf = document.createElement('object');
    newf.classList.add('front');
    newf.setAttribute('type', 'image/svg+xml');
    newf.setAttribute('data', 'data:image/svg+xml;base64,' + btoa(`<svg preserveAspectRatio="xMinYMin meet" viewBox="0 0 1920 1080" width="1920" height="1080" xmlns="http://www.w3.org/2000/svg"><image width="1920" height="1080" href="${res.payload.imageUri}#${Date.now()}" /></svg>`)); // res.payload.imageUri + '#' + Date.now());
    document.querySelector('.capture').appendChild(newf);

    await wait(100);
  }
});
