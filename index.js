/*
Code for connecting to Violet OS cloud (both Scratch and TurboWarp). User data is save in files.json.
*/

/*
How to use the encode and decode functions:
encode: The parameters are the string you want to use, and then true or false based on if you want to use Huffman Coding which can possibly compress.~
decode: Input the encoded cloud and it will decode it, no extra parameters needed.
*/

import { Client as _Client } from "node-scratch-client";
import { readFileSync, writeFileSync } from "fs";
import { encode, decode } from "./encode-decode.js";

const PROJECT_ID = 459440895;

let files = JSON.parse(readFileSync("files.json"));

const Client = new _Client({
  username: "qucchia",
  password: process.env.PASSWORD,
});

let saveFile = (value, user) => {
  let request = JSON.parse(decode(value));
  let userFiles = JSON.stringify(files[user]);
  request.forEach((change) => {
    userFiles =
      userFiles.slice(0, change[0]) + change[2] + userFiles.slice(change[1]);
  });
  files[request.user] = JSON.parse(userFiles);
  writeFileSync("files.json", JSON.stringify(files));
};

saveFile(
  encode('[[19,32,"stuff.json"],[39,43,"1KB"],[80,81,"2"]]', false),
  "qucchia"
);

Client.login().then(() => {
  let cloud = Client.session.createCloudSession(PROJECT_ID);

  cloud.connect().then(() => {
    console.log("Ready!");
    cloud.on("set", (variable) => {
      let user = variable._client.session.username;
      console.log(user, variable.name, variable.value);
    });
  });
});
