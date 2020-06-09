import React, { useState } from "react";
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
  const [socket, setSocket] = useState(new WebSocket(socketURL));

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

  socket.onmessage = function (event) {
    let msg = JSON.parse(event.data);
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

  socket.onclose = function () {
    setSocket(new WebSocket(socketURL));
  };

  return <h1>Empty</h1>;
}

export default ScreenShareAgent;
