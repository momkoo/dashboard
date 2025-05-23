// backend-nodejs/debug.js - 디버깅용 스크립트
const { chromium } = require('playwright');

async function testPlaywright() {
    console.log('Testing Playwright installation...');
    
    let browser;
    try {
        browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        console.log('✅ Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('✅ Page created successfully');
        
        await page.goto('https://www.google.com', { timeout: 10000 });
        console.log('✅ Navigation successful');
        
        const title = await page.title();
        console.log(`✅ Page title: ${title}`);
        
        const screenshot = await page.screenshot();
        console.log(`✅ Screenshot taken: ${screenshot.length} bytes`);
        
    } catch (error) {
        console.error('❌ Playwright test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (browser) {
            await browser.close();
            console.log('✅ Browser closed');
        }
    }
}

// 네트워크 연결 테스트
async function testNetwork() {
    console.log('Testing network connectivity...');
    
    const urls = [
        'https://www.google.com',
        'https://www.github.com',
        'https://www.example.com'
    ];
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            console.log(`✅ ${url}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.error(`❌ ${url}: ${error.message}`);
        }
    }
}

// 포트 확인
function checkPorts() {
    const net = require('net');
    const ports = [3000, 8081, 8080, 8000];
    
    ports.forEach(port => {
        const server = net.createServer();
        server.listen(port, () => {
            console.log(`✅ Port ${port} is available`);
            server.close();
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`❌ Port ${port} is already in use`);
            } else {
                console.log(`❌ Port ${port}: ${err.message}`);
            }
        });
    });
}

async function runAllTests() {
    console.log('=== 시스템 진단 시작 ===\n');
    
    console.log('1. 포트 확인');
    checkPorts();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n2. 네트워크 연결 확인');
    await testNetwork();
    
    console.log('\n3. Playwright 테스트');
    await testPlaywright();
    
    console.log('\n=== 시스템 진단 완료 ===');
}

if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testPlaywright, testNetwork, checkPorts };

// frontend/debug-frontend.js - 프론트엔드 디버깅
// 브라우저 콘솔에서 실행할 수 있는 디버깅 코드

const debugFrontend = {
    // API 연결 테스트
    async testBackendConnection() {
        const endpoints = [
            '/api/web-source/list',
            '/health' // 직접 백엔드 호출
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                console.log(`✅ ${endpoint}:`, response.status, data);
            } catch (error) {
                console.error(`❌ ${endpoint}:`, error.message);
            }
        }
    },
    
    // 직접 백엔드 API 테스트
    async testDirectBackend() {
        const baseUrl = 'http://localhost:8081';
        const endpoints = [
            '/health',
            '/sources/list'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(baseUrl + endpoint);
                const data = await response.json();
                console.log(`✅ Direct ${endpoint}:`, response.status, data);
            } catch (error) {
                console.error(`❌ Direct ${endpoint}:`, error.message);
            }
        }
    },
    
    // URL 분석 테스트
    async testUrlAnalysis(url = 'https://www.example.com') {
        try {
            console.log(`Testing URL analysis for: ${url}`);
            
            const response = await fetch('/api/web-source/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });
            
            const data = await response.json();
            console.log('Analysis result:', data);
            
            if (data.screenshot) {
                console.log(`Screenshot size: ${data.screenshot.length} characters`);
                // 스크린샷을 이미지로 표시
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${data.screenshot}`;
                img.style.maxWidth = '300px';
                document.body.appendChild(img);
            }
            
            if (data.dom_info) {
                console.log(`DOM elements found: ${data.dom_info.length}`);
                console.table(data.dom_info.slice(0, 5)); // 처음 5개만 표시
            }
            
        } catch (error) {
            console.error('URL analysis test failed:', error);
        }
    },
    
    // 로컬 스토리지 확인
    checkLocalStorage() {
        console.log('Local Storage contents:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value?.substring(0, 100) + (value?.length > 100 ? '...' : ''));
        }
    }
};

// 브라우저 콘솔에서 사용 가능하도록 전역으로 설정
if (typeof window !== 'undefined') {
    window.debugFrontend = debugFrontend;
    console.log('Debug tools loaded. Use window.debugFrontend to access debugging functions.');
}