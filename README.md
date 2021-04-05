ssap-web
========

A hacky implementation of webOS remote control API on the web.

How it works
------------

By default a server implementing SSAP on webOS prevents web origins from
accessing its websocket. However there are exceptions to allow communication
from chrome extensions *and `file://` origins*. Both `file://` and `data:`
origins present themselves to remote server as `Origin: null`. We use that to
allow http-based origin to communicate with SSAP server using a hidden iframe
with `src="data:..."` communicating back and forth with the main `http://`
frame. This is implemented in `wsproxy.js`.

Limitations
-----------

Currently this client can't be effectively used on `https://` origins due to
mixed content security policies. Alternatively, user can be requested to
manually approve self-signed certificate used for `wss://:3001` server exposed
by webOS.

Demo
----

Demo app in `index.html` can be used to preview current screen contents and
perform basic remote control (arrow keys, enter = OK, escape = Back, home = Home)
