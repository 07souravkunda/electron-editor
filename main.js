const electron = require("electron");

const BrowserWindow = electron.BrowserWindow;
const app = electron.app;
const Menu = electron.Menu;
const dialog = electron.dialog;
const ipc = electron.ipcMain;

let currentWindow;
class Window {
  constructor() {
    this.pathName = null;
    this.isChanged = false;
  }

  createWindow = () => {
    this.win = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
      },
      show: false,
    });
    this.win.loadFile("index.html");
    this.win.once("ready-to-show", () => {
      this.win.show();
    });
    ipc.on("key-pressed", (arg) => {
      this.isChanged = true;
    });
    this.win.on("close", async (e) => {
      if (!this.isChanged) {
        const opt = dialog.showMessageBoxSync(this.win, {
          type: "none",
          buttons: ["Yes", "Cancel"],
          title: "electronJS-notepad",
          message: "Do you want to quit this App?",
        });
        console.log(opt);
        if (opt === 1) e.preventDefault();
      } else {
        const opt = dialog.showMessageBoxSync(this.win, {
          type: "none",
          buttons: ["Save", "Don't Save", "Cancel"],
          title: "React App",
          message: `Do you want to save changes to File ${
            this.pathName ? this.pathName : "untitled"
          }?`,
        });
        console.log(opt, this.pathName);
        if (opt === 2) {
          e.preventDefault();
        } else if (opt === 0) {
          if (!this.pathName) {
            const res = dialog.showSaveDialogSync();
            console.log(res);

            if (res) {
              this.pathName = res;
              ipc.emit("save-file", JSON.stringify({ filePath: res }));
            }
            e.preventDefault();
          } else {
            ipc.emit("save-file", JSON.stringify({ filePath: this.pathName }));
          }
        }
      }
      console.log("before closing");
    });
    this.win.on("closed", () => {
      this.win = null;
    });
    this.win.on("focus", () => {
      console.log("on focus");
      currentWindow = this;
    });
  };
}

///////////////

const saveFile = () => {
  ipc.emit("save-file", JSON.stringify({ filePath: currentWindow.pathName }));
  currentWindow.isChanged = false;
};
const showOpenDialog = async () => {
  const res = await dialog.showOpenDialog(currentWindow.win);
  console.log(res);
  if (!res.canceled) {
    currentWindow.pathName = res.filePaths[0];
    ipc.emit("open-file", JSON.stringify(res));
    currentWindow.isChanged = false;
  }
  // const setPath =
};

const showSaveAsDialog = async function (event) {
  try {
    console.log(currentWindow.pathName);
    const res = await dialog.showSaveDialog(currentWindow.win);
    console.log(res);

    if (!res.canceled) {
      currentWindow.pathName = res.filePath;
      currentWindow.isChanged = false;
      return ipc.emit("save-file", JSON.stringify(res));
    }
    console.log("canceled");
  } catch (er) {
    console.log(er);
  }
};

app.on("ready", async () => {
  const win = new Window();
  win.createWindow();
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          click: () => {
            const win = new Window();
            win.createWindow();
          },
          accelerator: "CmdOrCtrl + Shift + N",
        },
        { type: "separator" },
        {
          label: "Save As",
          click: await showSaveAsDialog,
          accelerator: "CmdOrCtrl + Shift + S",
        },

        {
          label: "save",
          click: saveFile,
          accelerator: "CmdOrCtrl + S",
        },
        { type: "separator" },
        {
          label: "open file",
          click: await showOpenDialog,
        },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});
