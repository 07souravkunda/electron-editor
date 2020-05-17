const electron = require("electron");
const fs = require("fs");
const ipc = electron.remote.ipcMain;

const ta = document.getElementById("ta");

ta.addEventListener("keydown", (e) => {
  const code = e.keyCode;
  if (code === 9) {
    const ta = document.getElementById("ta");
    const s = ta.selectionStart;
    ta.value =
      ta.value.substring(0, ta.selectionStart) +
      "\t" +
      ta.value.substring(ta.selectionEnd);
    ta.selectionEnd = s + 1;
  }
  ipc.emit("key-pressed", "code");
});

ipc.on("save-file", (res) => {
  const r = JSON.parse(res);
  const ta = document.getElementById("ta");
  fs.writeFileSync(r.filePath, ta.value, "utf-8");
  const arr = r.filePath.split("\\");
  document.title = arr[arr.length - 1];
});
ipc.on("open-file", (res) => {
  const r = JSON.parse(res);
  const data = fs.readFileSync(r.filePaths[0], "utf-8");
  const ta = document.getElementById("ta");
  ta.value = data;

  const arr = r.filePaths[0].split("\\");
  document.title = arr[arr.length - 1];
});
