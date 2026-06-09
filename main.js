const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function verifySteelSystem(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const hasSteelTitle = data.includes('钢铁企业') || data.includes('钢铁生产') || data.includes('炼钢') || data.includes('连铸') || data.includes('steel-production');
        resolve(hasSteelTitle);
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForSteelServer(url, maxRetries = 30, interval = 2000) {
  console.log(`🔍 正在验证钢铁系统服务: ${url}`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const isSteel = await verifySteelSystem(url);
      if (isSteel) {
        console.log(`✅ 确认钢铁系统服务已就绪，第 ${i + 1} 次验证成功`);
        return true;
      }
      console.log(`⏳ 等待钢铁系统启动... (${i + 1}/${maxRetries})`);
    } catch (e) {
      console.log(`⚠️ 验证异常: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, interval));
  }
  console.log('❌ 超过最大重试次数，但仍尝试加载');
  return true;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '大型钢铁企业炼钢-连铸-轧制一体化生产调度与质量追溯系统',
    backgroundColor: '#f0f2f5',
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  const loadUrl = async () => {
    if (app.isPackaged) {
      const startUrl = `file://${path.join(__dirname, 'dist-web', 'index.html')}`;
      console.log(`📦 生产模式加载: ${startUrl}`);
      mainWindow.loadURL(startUrl);
    } else {
      const devUrl = 'http://localhost:5173';
      console.log(`🛠 开发模式，等待服务就绪...`);
      await waitForSteelServer(devUrl);
      console.log(`🌐 开发模式加载: ${devUrl}`);
      mainWindow.loadURL(devUrl);
      mainWindow.webContents.openDevTools();
    }

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        (function() {
          const title = document.title || '';
          const h1 = document.querySelector('h1');
          const hasSteel = title.includes('钢铁') || (h1 && h1.textContent && h1.textContent.includes('钢铁'));
          if (!hasSteel) {
            console.warn('⚠️ 检测到页面内容不是钢铁系统，尝试清除缓存重新加载...');
            window.location.reload(true);
          } else {
            console.log('✅ 钢铁生产调度系统加载成功！');
            console.log('页面标题:', title);
            console.log('菜单:', Array.from(document.querySelectorAll('.menu-item')).map(i => i.textContent.trim()).join(' | '));
          }
        })();
      `).catch(() => {});
    });
  };

  loadUrl();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('========================================');
  console.log('🏭 钢铁生产调度系统启动中...');
  console.log(`📅 启动时间: ${new Date().toLocaleString()}`);
  console.log(`📁 应用路径: ${__dirname}`);
  console.log('========================================');
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

process.on('uncaughtException', (err) => {
  console.error('❌ 主进程异常:', err);
});
