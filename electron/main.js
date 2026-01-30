const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const { spawn } = require('child_process');

// 保持对窗口对象的全局引用，避免垃圾回收导致窗口关闭
let mainWindow;
let serverProcess; // 保存服务器进程引用

function startServer() {
  // 启动Express服务器作为子进程
  let backendPath;
  if (app.isPackaged) {
    // 打包后的环境中，server 目录在 asar 的同级 resources 目录下
    backendPath = path.join(process.resourcesPath, 'server', 'index.js');
  } else {
    // 开发环境中，server 目录在项目根目录
    backendPath = path.join(__dirname, '..', 'server', 'index.js');
  }
  try {
    serverProcess = spawn('node', [backendPath, '8888'], {
      stdio: 'inherit',
      env: { ...process.env }
    })

    if (serverProcess) {
      console.log('Express server started on port 8888')

      serverProcess.stdout.on('data', (data) => {
        console.log(`服务器输出: ${data}`);
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`服务器错误: ${data}`);
      });

      serverProcess.on('close', (code) => {
        console.log(`服务器进程退出，代码 ${code}`);
      });
    } else {
      console.error('Failed to start server process');
    }
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

function createWindow () {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '.', 'preload.js')
    },
    maximize: true  // 添加这一行使窗口启动时最大化
  });

  // 加载前端页面 - 假设前端构建后在dist目录
  // const indexPath = path.join(__dirname, '..', 'product', 'dist', 'index.html');
  mainWindow.loadURL('http://localhost:8888');

  // 打开开发者工具（可选）
  mainWindow.webContents.openDevTools();

  // 窗口关闭事件处理
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Electron 应用初始化完成并准备创建浏览器窗口
app.whenReady().then(() => {
  // 在创建窗口之前启动服务器
  startServer();
  createWindow();
});

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// 应用即将退出时，确保服务器进程也被终止
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill(); // 终止服务器进程
  }
});

// 处理来自渲染进程的消息
ipcMain.handle('get-api-url', () => {
  return 'http://localhost:8888'
})