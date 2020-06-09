import express from "express";
import ws from "ws";
import cors from "cors";
import { Socket } from "net";
var WebSocket = require("ws");
const url = require("url");
const wss = new ws.Server({ noServer: true });
const PORT = 7000;
const CLIENT_PORT = 8000;
const relayURL = `http://localhost:${CLIENT_PORT}/screenShareAgent`;

const app = express();
const server = app.listen(PORT, () =>
  console.log(`Server running on Port ${PORT}`)
);

interface Agents {
  [Key: string]: ws[];
}

interface Relays {
  [Key: string]: WebSocket;
}

var agents: Agents = {};
var relays: Relays = {};

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

server.on("upgrade", function upgrade(
  request: express.Request,
  socket: Socket,
  head: Buffer
) {
  console.log("Web Socket");
  let reqURL = url.parse(request.url, true);
  if (reqURL.pathname === "/screenShareAgent") {
    const hash = url.parse(request.url, true).query.hash;
    wss.handleUpgrade(request, socket, head, function (ws: ws) {
      onScreenShareAgent(ws, hash);
    });
  }
});

function onScreenShareAgent(ws: ws, hash: string | null) {
  if (agents[hash] === undefined) {
    agents[hash] = [];
  }
  agents[hash].push(ws);
  console.log("agent opened. now at " + agents[hash].length);
  // ws.send(JSON.stringify(messages[hash]));
  if (relays[hash] === undefined) {
    console.log("Reached 1");
    let relaySocket = new WebSocket(relayURL + `?hash=${hash}`);
    console.log("Reached 2");
    relaySocket.onmessage = (event) => {
      console.log("Message Recieved");
      agents[hash].forEach((agent: ws) => {
        agent.send(event.data);
      });
    };

    relays[hash] = relaySocket;
  }

  ws.onclose = function () {
    let index = agents[hash].indexOf(ws);
    if (agents[hash].length === 1) agents[hash] = [];
    else agents[hash].splice(index, 1);
    console.log("agent closed. now at " + agents[hash].length);
  };
}
