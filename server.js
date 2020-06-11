"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var ws_1 = __importDefault(require("ws"));
var cors_1 = __importDefault(require("cors"));
var url = require("url");
var wss = new ws_1["default"].Server({ noServer: true });
var PORT = 7000;
var app = express_1["default"]();
var server = app.listen(PORT, function () {
    return console.log("Server running on Port " + PORT);
});
var agents = {};
var clientShare = {};
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
    console.log(reqURL);
    if (reqURL.pathname === "/screenShareClient") {
        var hash_1 = url.parse(request.url, true).query.hash;
        wss.handleUpgrade(request, socket, head, function (ws) {
            onScreenShareClient(ws, hash_1);
        });
    }
    else if (reqURL.pathname === "/screenShareAgent") {
        var hash_2 = url.parse(request.url, true).query.hash;
        wss.handleUpgrade(request, socket, head, function (ws) {
            onScreenShareAgent(ws, hash_2);
        });
    }
});
function onScreenShareAgent(ws, hash) {
    if (agents[hash] === undefined) {
        agents[hash] = [];
    }
    agents[hash].push(ws);
    console.log("Reached screenShareAgent");
    // ws.send(JSON.stringify(messages[hash]));
    ws.onmessage = function (event) {
        console.log(JSON.parse(event.data.toString()));
        clientShare[hash].send(event.data);
    };
    ws.onclose = function () {
        var index = agents[hash].indexOf(ws);
        if (agents[hash].length === 1)
            agents[hash] = [];
        else
            agents[hash].splice(index, 1);
        console.log("agent closed. now at " + agents[hash].length);
    };
}
function onScreenShareClient(ws, hash) {
    console.log("reached onScreenShareClient");
    clientShare[hash] = ws;
    agents[hash] = [];
    ws.onmessage = function (event) {
        console.log("Message Received at ScreenShareClient");
        agents[hash].forEach(function (agent) {
            agent.send(event.data);
        });
    };
    ws.onclose = function () {
        console.log("client closing, clearing messages");
        agents[hash].forEach(function (socket) {
            socket.close();
        });
        clientShare[hash] = undefined;
        //   clientShare[hash] = undefined;
    };
    console.log("client open completed.");
}
