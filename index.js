/*
Code for connecting to Violet OS cloud (both Scratch and TurboWarp). User data is saved in files.json.
Currently no user authentication on TW.

How to use the encode and decode functions:
encode: The parameters are the string you want to use, and then true or false based on if you want to use Huffman Coding which can possibly compress.~
decode: Input the encoded cloud and it will decode it, no extra parameters needed.
*/

import { Client as _Client } from "node-scratch-client";
import { readFileSync, writeFileSync } from "fs";
import { encode, decode } from "./encode-decode.js";
import WebSocket from "ws";

const PROJECT_ID = 459440895;
const PAGE_SIZE = 100;
const PROJECT_OWNER = "qucchia";

const twWs = new WebSocket("wss://clouddata.turbowarp.org");
const twVariables = {};

let files = JSON.parse(readFileSync("files.json"));

let saveFile = (value, user) => {
  let userFiles = JSON.stringify(files[user]);
  JSON.parse(decode(value)).forEach((change) => {
    userFiles =
      userFiles.slice(0, change[0]) + change[2] + userFiles.slice(change[1]);
  });
  files[user] = JSON.parse(userFiles);
  writeFileSync("files.json", JSON.stringify(files));
};

let serverUpdate = (name, value, user, turbowarp) => {
  if (value[0] === "0") {
    // 1st digit 0: save file
    saveFile(value.slice(1), user);
    return "2" + encode(user);
  } else if (value[0] === "1") {
    // 1st digit 1: get file or folder
    if (value[1] === "0") {
      // 2nd digit 0: file
      // next 10 digits: file ID
      // final digits: page number
      let fileId = value.slice(2, 12);
      let page = value.slice(12);
      let file = JSON.stringify(files.user.files[fileId]);
      return (
        name,
        "2" +
          encode(
            user + ":" + file.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
          )
      );
    } else {
      // 2nd digit: folder
      // next 10 digits: folder ID
      // final digits: page number
      let folderId = value.slice(2, 12);
      let page = value.slice(12);
      let folder = JSON.stringify(files.user.folders[folderId]);
      return (
        name,
        "2" +
          encode(
            user + ":" + folder.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
          )
      );
    }
  }
};

function twSetVariable(name, value) {
  console.log(`Setting variable: ${name} = ${value}`);
  twVariables[name] = value;
  twWs.send(
    JSON.stringify({
      method: "set",
      name,
      value,
    })
  );
}

function twGetVariable(name) {
  return twVariables[name];
}

twWs.onopen = () => {
  console.log("Performing handshake");

  // Tell the server which project you want to connect to.
  twWs.send(
    JSON.stringify({
      method: "handshake",
      project_id: PROJECT_ID,
      user: "player83038",
    })
  );

  console.log("TurboWarp ready!");
};

twWs.onmessage = (event) => {
  // Process updates from the server.
  for (const message of event.data.split("\n")) {
    const obj = JSON.parse(message);
    if (obj.method === "set") {
      console.log(`Server set variable: ${obj.name} = ${obj.value}`);
      // How to get user? obj.user may not work...
      twSetVariable(
        obj.name,
        serverUpdate(obj.name, obj.value, obj.user, true)
      );
    }
  }
};

twWs.onclose = () => {
  console.log("Server closed connection, reconnecting");
};

twWs.onerror = () => {
  console.log("Error!");
};

const Client = new _Client({
  username: PROJECT_OWNER,
  password: process.env.PASSWORD,
});

Client.login().then(() => {
  let cloud = Client.session.createCloudSession(PROJECT_ID);

  cloud.connect().then(() => {
    console.log("Scratch ready!");
    cloud.on("set", (variable) => {
      let user = variable._client.session.username;
      console.log(user, variable.name, variable.value);
      /* cloud.setVariable(
        variable.name,
        serverUpdate(variable.name, variable.value, user, false)
      ); */
    });
  });
});
