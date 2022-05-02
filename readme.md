# Sleepster
Peer-to-peer file sharing with the use of modern web browser technologies and APIs including `WebRTC`, `WebSockets` and `WebWorkers`

## Setup
The project runs on ExpressJS server with SocketIO handling the WebSocket communications. To setup the required NodeJS packages on the server, the following command must be run:
```bash
npm install
```
The requirements for running this command include the latest stable version of `NodeJS` (atleast `v16.14.0` or above) along with the latest stable version of `npm` (atleast `v8.5.0` or above)

## Execution
To run the server, which would listen for client connections, the following command must be run in the root directory of the project (the `sleepster` directory):
```bash
node index.js
```

Appropriate configuration may be required based on the use of webservers such as `Apache`, `Nginx` or `OpenLiteSpeed`. The web server must be configured to setup a reverse proxy to the NodeJS server.

## Client
Once the server is setup, the client page can be accessed by visiting `http://<server_ip>` or `http://<domain_name>` or `https://<domain_name>` based on the server configuration.

The browser needs to be capable of supporting `WebRTC`, `WebSockets` and `WebWorkers`. To check the compatibility of the browser, you may visit:
 - [https://caniuse.com/websockets](https://caniuse.com/websockets)
 - [https://caniuse.com/rtcpeerconnection](https://caniuse.com/rtcpeerconnection)
 - [https://caniuse.com/webworkers](https://caniuse.com/webworkers)