// electron-app/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

// 개발 모드 확인
const isDev = process.env.NODE_ENV === 'development';
console.log(`[Electron Main] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Electron Main] isDev: ${isDev}`);

function createWindow() {
  // 브라우저 창 생성
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload 스크립트 (필요시)
      nodeIntegration: false, // 보안을 위해 Node.js 통합 비활성화
      contextIsolation: true, // 보안을 위해 컨텍스트 격리 활성화
      webSecurity: false // 개발 시 CORS 문제 방지를 위해 일시적으로 비활성화 (프로덕션에서는 활성화 권장)
    }
  });

  // Next.js 개발 서버 또는 빌드된 프론트엔드 로드
  if (isDev) {
    const frontendDevUrl = 'http://localhost:3000';
    console.log(`[Electron Main] Loading frontend from development server: ${frontendDevUrl}`);
    mainWindow.loadURL(frontendDevUrl);
    // 개발자 도구 열기
    mainWindow.webContents.openDevTools();
  } else {
    // Next.js 빌드된 정적 파일 로드
    // Next.js 앱이 'frontend/out' 폴더에 빌드된다고 가정
    const indexPath = path.join(__dirname, '..', 'frontend', 'out', 'index.html');
    console.log(`[Electron Main] Loading frontend from built file: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }
}

// 앱이 준비되면 창 생성
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS에서 Dock 아이콘 클릭 시 창이 없으면 새 창 생성
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 창이 닫히면 앱 종료
app.on('window-all-closed', () => {
  // macOS가 아니면 앱 종료
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Electron 앱의 환경 변수 설정 (선택 사항)
// process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'; // 개발 시 보안 경고 비활성화
