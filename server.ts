import express from "express";
import ws from "ws";
import cors from "cors";
import { Socket } from "net";
const url = require("url");
const wss = new ws.Server({ noServer: true });
const PORT = 7000;

const app = express();
const server = app.listen(PORT, () =>
  console.log(`Server running on Port ${PORT}`)
);

interface Agents {
  [Key: string]: ws[];
}

interface Client {
  [Key: string]: ws | undefined;
}
var agents: Agents = {};
var clientShare: Client = {};

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
  console.log(reqURL);
  if (reqURL.pathname === "/screenShareClient") {
    const hash = url.parse(request.url, true).query.hash;
    wss.handleUpgrade(request, socket, head, function (ws) {
      onScreenShareClient(ws, hash);
    });
  } else if (reqURL.pathname === "/screenShareAgent") {
    const hash = url.parse(request.url, true).query.hash;
    wss.handleUpgrade(request, socket, head, function (ws) {
      onScreenShareAgent(ws, hash);
    });
  }
});

function onScreenShareAgent(ws: ws, hash: string) {
  if (agents[hash] === undefined) {
    agents[hash] = [];
  }
  agents[hash].push(ws);
  console.log("Reached screenShareAgent");
  // ws.send(JSON.stringify(messages[hash]));

  ws.onmessage = (event) => {
    console.log(JSON.parse(event.data.toString()));
    clientShare[hash]!.send(event.data);
  };

  ws.onclose = function () {
    let index = agents[hash].indexOf(ws);
    if (agents[hash].length === 1) agents[hash] = [];
    else agents[hash].splice(index, 1);
    console.log("agent closed. now at " + agents[hash].length);
  };
}

function onScreenShareClient(ws: ws, hash: string) {
  console.log("reached onScreenShareClient");
  clientShare[hash] = ws;
  agents[hash] = [];

  ws.onmessage = function (event) {
    console.log("Message Received at ScreenShareClient");
    agents[hash].forEach(function (agent: ws) {
      agent.send(event.data);
    });
  };

  ws.onclose = function () {
    console.log("client closing, clearing messages");
    agents[hash].forEach(function (socket: ws) {
      socket.close();
    });
    clientShare[hash] = undefined;
    //   clientShare[hash] = undefined;
  };
  console.log("client open completed.");
}
