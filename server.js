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
var agents = {};
var relays = {};
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
    if (agents[hash] === undefined) {
        agents[hash] = [];
    }
    agents[hash].push(ws);
    console.log("agent opened. now at " + agents[hash].length);
    // ws.send(JSON.stringify(messages[hash]));
    if (relays[hash] === undefined) {
        console.log("Reached 1");
        var relaySocket = new WebSocket(relayURL + ("?hash=" + hash));
        console.log("Reached 2");
        relaySocket.onmessage = function (event) {
            console.log("Message Recieved");
            agents[hash].forEach(function (agent) {
                agent.send(event.data);
            });
        };
        relays[hash] = relaySocket;
    }
    ws.onclose = function () {
        var index = agents[hash].indexOf(ws);
        if (agents[hash].length === 1)
            agents[hash] = [];
        else
            agents[hash].splice(index, 1);
        console.log("agent closed. now at " + agents[hash].length);
    };
}
