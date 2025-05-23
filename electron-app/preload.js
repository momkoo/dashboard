// electron-app/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Node.js API를 렌더러 프로세스에 직접 노출하지 않고,
// 허용된 함수만 노출하여 보안을 강화합니다.
contextBridge.exposeInMainWorld('electronAPI', {
  // 예시: 메인 프로세스로 메시지를 보내는 함수
  sendMessageToMain: (message) => ipcRenderer.send('message-from-renderer', message),

  // 예시: 메인 프로세스로부터 메시지를 받는 리스너 설정
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (event, value) => callback(value))
});

// 참고: 웹 페이지의 DOM에 직접 접근하거나 수정하는 코드는 여기에 두지 마십시오.
// 이는 보안 위험을 초래할 수 있습니다.