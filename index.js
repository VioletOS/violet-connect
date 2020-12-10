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

console.log(decode(encode("hi", true)));

const PROJECT_ID = 459440895;
const CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ .,:;'\"\\?!/()[]{}+-=*@#&";
const CHAR_BITS = CHARS.length.toString(2).length;

let files = JSON.parse(readFileSync("files.json"));

const Client = new _Client({
  username: "VioletOS-VI",
  password: process.env.PASSWORD,
});

let saveFile = (value) => {
  let save = JSON.parse(decode(value));
  let userFolders = files[save.u].folders;
  for (const [id, folder] of Object.entries(save.fo)) {
    let newFolder = JSON.stringify(userFolders[id - 1]);
    console.log(newFolder);
    folder.forEach((change) => {
      newFolder =
        newFolder.slice(0, change.s + 2) +
        change.t +
        newFolder.slice(change.e + 2);
      console.log(newFolder);
    });
    userFolders[id] = JSON.parse(newFolder);
  }
  files[save.u].folders = userFolders;
  writeFileSync("files.json", JSON.stringify(files));
};

Client.login().then(() => {
  let cloud = Client.session.createCloudSession(PROJECT_ID);

  cloud.connect().then(() => {
    cloud.on("set", (variable) => {
      console.log("Variable changed to " + variable.value);
    });
  });
});
