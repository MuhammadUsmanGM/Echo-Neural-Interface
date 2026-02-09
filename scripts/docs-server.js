const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');

const PREFERRED_PORTS = [1138, 1139, 1140, 1141];
const DOCS_DIR = path.join(__dirname, '..', 'echo-docs', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

function startServer(portIndex = 0) {
  if (portIndex >= PREFERRED_PORTS.length) {
    console.log(chalk.red('\n❌ Unable to find an available port for the Documentation Hub.'));
    console.log(chalk.gray('Checked ports: ' + PREFERRED_PORTS.join(', ')));
    return;
  }

  const PORT = PREFERRED_PORTS[portIndex];

  if (!fs.existsSync(DOCS_DIR)) {
    console.log(chalk.red('\n❌ Documentation build not found!'));
    console.log(chalk.gray('Please build the docs first by running:'));
    console.log(chalk.cyan('  cd echo-docs && npm install && npm run build\n'));
    return;
  }

  const server = http.createServer((req, res) => {
    let filePath = path.join(DOCS_DIR, req.url === '/' ? 'index.html' : req.url);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DOCS_DIR, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(chalk.yellow(`⚠️  Port ${PORT} is in use, attempting next available port...`));
      startServer(portIndex + 1);
    } else {
      console.log(chalk.red(`\n❌ Server error: ${err.message}`));
    }
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(chalk.cyan.bold('\n📚 Echo Documentation Hub'));
    console.log(chalk.white(`  Server running at: ${chalk.underline(url)}`));
    if (PORT !== PREFERRED_PORTS[0]) {
      console.log(chalk.yellow(`  (Port ${PREFERRED_PORTS[0]} was occupied)`));
    }
    console.log(chalk.gray('  Press Ctrl+C to stop the server.\n'));

    const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${openCmd} ${url}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
