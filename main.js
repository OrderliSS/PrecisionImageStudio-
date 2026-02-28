const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 850,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#ffffff',
            symbolColor: '#74b1be',
            height: 40
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('index.html');

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Browser Console] level ${level}: ${message} (line ${line})`);
    });
    // win.webContents.openDevTools(); // Optional, keep hidden for now.
}

app.whenReady().then(() => {
    // Enable Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy
    // to unlock SharedArrayBuffer and multi-threaded Wasm
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Cross-Origin-Embedder-Policy': ['require-corp'],
                'Cross-Origin-Opener-Policy': ['same-origin'],
            }
        });
    });

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

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }
        ]
    });
    if (!canceled && filePaths.length > 0) {
        const bitmap = fs.readFileSync(filePaths[0]);
        return Buffer.from(bitmap).toString('base64');
    }
    return null;
});

ipcMain.handle('dialog:saveFile', async (event, base64Data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save Image',
        defaultPath: 'precision-studio-out.png',
        filters: [
            { name: 'Images', extensions: ['png'] }
        ]
    });

    if (!canceled && filePath) {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return true;
    }
    return false;
});
