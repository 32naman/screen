import React, { useEffect, useRef } from "react";
import { TreeMirror } from "../tree_mirror";

const PORT = 7000;
const url = new URL(document.URL);
const search_params = url.searchParams;
const hash = search_params.get("hash");
const socketURL = `ws://localhost:${PORT}/screenShareAgent?hash=` + hash;
interface CSSStyleDeclarationWithResize extends CSSStyleDeclaration {
  size: string;
}
interface Msg {
  error: boolean;
  clear: boolean;
  base: string;
  scroll: number;
  x: number;
  y: number;
  width: number;
  height: number;
  f: string;
  args: (number | object[])[];
}

interface Child {
  [Key: string]: any;
}

function ScreenShareAgent() {
  const socket = useRef<WebSocket | null>(null);
  const peer = useRef(
    new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
  );
  const dataChannel = useRef<RTCDataChannel | null>(null);

  function clearPage() {
    while (document.firstChild) {
      document.removeChild(document.firstChild);
    }
  }

  let userCursor: HTMLDivElement;
  let notCreated = true;
  let base: string;
  let mirror: Child = new TreeMirror(document, {
    createElement: function (tagName: string) {
      if (tagName === "SCRIPT") {
        let node = document.createElement("NO-SCRIPT");
        node.style.display = "none";
        return node;
      }

      if (tagName === "HEAD") {
        let node = document.createElement("HEAD");
        node.appendChild(document.createElement("BASE"));
        if (node != null && node.firstChild != null) {
          let nodeFirstChild: Child = node.firstChild;
          nodeFirstChild["href"] = base;
        }
        return node;
      }
    },
  });

  let handleMessage = (msg: Msg) => {
    if (msg.error) {
    }
    if (msg.clear) clearPage();
    else if (msg.base) {
      base = msg.base;
    } else if (msg.scroll)
      document.documentElement.scrollTop = document.body.scrollTop = msg.scroll;
    else if (msg.x) {
      if (notCreated) {
        userCursor = document.createElement("div");
        userCursor.innerHTML = "<i class ='fas fa-mouse-pointer'></i>";
        userCursor.style.position = "absolute";
        let userCursorStyle: CSSStyleDeclarationWithResize = userCursor.style as CSSStyleDeclarationWithResize;
        userCursorStyle.size = "20px";
        const rootDiv = document.getElementById("root");
        if (rootDiv != null) rootDiv.appendChild(userCursor);
        notCreated = false;
      }
      let width =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;
      let height =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;
      let x = (msg.x / msg.width) * width;
      let y = (msg.y / msg.height) * height;
      userCursor.style.left = x + "px";
      userCursor.style.top = y + "px";
    } else if (msg.f) {
      mirror[msg.f].apply(mirror, msg.args);
      if (msg.f === "intialize") {
        userCursor = document.createElement("div");
        userCursor.innerHTML = "<i class ='fas fa-mouse-pointer'></i>";
        userCursor.style.position = "absolute";
        let userCursorStyle: CSSStyleDeclarationWithResize = userCursor.style as CSSStyleDeclarationWithResize;
        userCursorStyle.size = "20px";
        const rootDiv = document.getElementById("root");
        if (rootDiv != null) rootDiv.appendChild(userCursor);
        notCreated = false;
      }
    }
  };

  useEffect(() => {
    socket.current = new WebSocket(socketURL);
    if (socket.current === null) return;

    socket.current.onmessage = function (event) {
      let msg = JSON.parse(event.data);
      console.log(msg);
      if (msg.type === "answer") {
        console.log("Processing Answer");
        peer.current.setRemoteDescription(new RTCSessionDescription(msg.value));
      } else if (msg.type === "candidate") {
        console.log("Processing ICE");
        peer.current.addIceCandidate(new RTCIceCandidate(msg.value));
      }
    };

    socket.current.onopen = () => {
      peer.current.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          console.log(event.candidate);
          return;
        }
        socket.current!.send(
          JSON.stringify({
            type: "candidate",
            value: event.candidate,
          })
        );
      };

      peer.current.onconnectionstatechange = (event) => {
        if (peer.current.connectionState === "connected") {
          console.log("Peer Connected");
        }
      };

      dataChannel.current = peer.current.createDataChannel("data");

      dataChannel.current.onmessage = function (e) {
        console.log("Message Received");
        let msg = JSON.parse(e.data);
        if (msg instanceof Array) {
          msg.forEach(function (subMessage) {
            console.log(subMessage);
            handleMessage(JSON.parse(subMessage));
          });
        } else {
          console.log(msg);
          handleMessage(msg);
        }
      };
      dataChannel.current.onopen = function () {
        console.log("------ DATACHANNEL OPENED ------");
      };
      dataChannel.current.onclose = function () {
        console.log("------- DC closed! -------");
      };

      let sdpConstraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      };
      peer.current.createOffer(sdpConstraints).then((descrip) => {
        console.log("Sending Offer");
        peer.current.setLocalDescription(descrip);
        socket.current!.send(
          JSON.stringify({
            type: "offer",
            value: descrip,
          })
        );
      }, null);
    };

    socket.current.onclose = function () {
      console.log("Closing Socket");
    };
  }, []);

  return <h1>Empty</h1>;
}

export default ScreenShareAgent;
