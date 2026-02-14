const { nativeImage } = require('electron');

function createTrayIcon() {
  // Create a simple 16x16 transparent PNG buffer
  // This is a minimal valid PNG
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABTSURBVDhPY3wQ5/yfgQrARDCDMQAx08G2IQzABqB+QAaA+QGZBaYf2QCyAAYA5gdkAIgfkAEgfkAGgPgBGQDiB2QAiB+QASA+2EAwA0w/siH//wMA+14t8X8Gg0AAAAAASUVORK5CYII=', 'base64');
  return nativeImage.createFromBuffer(buffer);
}

module.exports = { createTrayIcon };
