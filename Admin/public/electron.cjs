const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1600,
    minHeight: 950,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  // Load local Vite dev server in development, or compiled dist/index.html in production
  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Maximize the window to occupy full screen by default
  win.maximize();

  // Open the DevTools automatically only in development mode
  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
