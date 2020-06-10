"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var ws_1 = __importDefault(require("ws"));
var cors_1 = __importDefault(require("cors"));
var WebSocket = require("ws");
var url = require("url");
var wss = new ws_1["default"].Server({ noServer: true });
var PORT = 7000;
var CLIENT_PORT = 8000;
var relayURL = "http://localhost:" + CLIENT_PORT + "/screenShareAgent";
var app = express_1["default"]();
var server = app.listen(PORT, function () {
    return console.log("Server running on Port " + PORT);
});
// var agents: Agents = {};
// var relays: Relays = {};
var msgs = [];
var relaySocket;
// Middleware
app.use(function (req, res, next) {
    console.log(req.method + " " + req.url);
    next();
});
app.use(cors_1["default"]());
app.use(express_1["default"].json());
app.use(express_1["default"].urlencoded({ extended: true }));
server.on("upgrade", function upgrade(request, socket, head) {
    console.log("Web Socket");
    var reqURL = url.parse(request.url, true);
    if (reqURL.pathname === "/screenShareAgent") {
        var hash_1 = url.parse(request.url, true).query.hash;
        wss.handleUpgrade(request, socket, head, function (ws) {
            onScreenShareAgent(ws, hash_1);
        });
    }
});
function onScreenShareAgent(ws, hash) {
    // if (agents[hash] === undefined) {
    //   agents[hash] = [];
    // }
    // agents[hash].push(ws);
    // console.log("agent opened. now at"+agents[hash].length);
    console.log("agent opened");
    if (relaySocket === undefined) {
        relaySocket = new WebSocket(relayURL + ("?hash=" + hash));
        relaySocket.onopen = function () {
            msgs.forEach(function (msg) {
                relaySocket.send(msg);
            });
        };
        relaySocket.onmessage = function (event) {
            console.log("Message Recieved");
            ws.send(event.data);
        };
        // ws.send(JSON.stringify(messages[hash]));
        // if (relays[hash] === undefined) {
        // console.log("Reached 1");
        // console.log("Reached 2");
        // agents[hash].forEach((agent: ws) => {
        //   agent.send(event.data);
        // });
        // };
        ws.onmessage = function (event) {
            var msg = JSON.parse(event.data.toString());
            console.log(msg);
            if (relaySocket.readyState !== 1) {
                msgs.push(event.data.toString());
            }
            else {
                relaySocket.send(event.data);
            }
        };
    }
    // relays[hash] = relaySocket;
    ws.onclose = function () {
        // let index = agents[hash].indexOf(ws);
        // if (agents[hash].length === 1) agents[hash] = [];
        // else agents[hash].splice(index, 1);
        // console.log("agent closed. now at " + agents[hash].length);
        console.log("agent closed");
    };
}
