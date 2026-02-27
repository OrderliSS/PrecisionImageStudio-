const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
