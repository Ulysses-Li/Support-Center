const http = require('http');
const { readFile } = require('fs/promises');
const path = require('path');

const root = process.cwd();
const port = Number(process.env.PORT || 5500);
const host = '127.0.0.1';

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8'
};

// 傳統 script 版本也保留本機 server，方便用 HTTP 驗證完整載入順序。
const server = http.createServer(async (request, response) => {
    try {
        const url = new URL(request.url, `http://${host}:${port}`);

        // 用意：目前預設入口是 Thread Milling；之後新增總覽頁時，只需調整這個轉址。
        if (url.pathname === '/' || url.pathname === '/index.html') {
            response.writeHead(302, { Location: '/Thread_Milling/index.html' });
            response.end();
            return;
        }

        const requestPath = decodeURIComponent(url.pathname.slice(1));
        const filePath = path.resolve(root, requestPath);

        if (!filePath.startsWith(root)) {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }

        const content = await readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
        });
        response.end(content);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
});

server.listen(port, host, () => {
    console.log(`NC Program dev server: http://${host}:${port}/`);
});
