const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取 API 地址
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  
  // 获取应用信息
  getAppInfo: () => ipcRenderer.invoke('app-info'),
  
  // 打开开发者工具
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  
  // 发送消息到主进程
  send: (channel, data) => {
    const validChannels = ['to-main']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  
  // 接收主进程消息
  receive: (channel, func) => {
    const validChannels = ['from-main']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})