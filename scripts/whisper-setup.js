const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const ConfigManager = require('./config-manager');

const config = new ConfigManager();

const MODELS = {
  'tiny.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
  'base.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin'
};

const BINARY_URLS = {
  'win32': 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-v1.5.4-bin-win-msvc-x64.zip'
};

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function setup() {
  console.log(chalk.cyan.bold('\n🏠 Echo Local Whisper Setup\n'));
  
  const binDir = path.join(__dirname, '..', 'bin');
  const modelDir = path.join(binDir, 'models');
  
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir);
  if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir);

  const spinner = ora('Initializing environment...').start();
  
  try {
    // 1. Download Model
    const modelPath = path.join(modelDir, 'ggml-base.en.bin');
    if (!fs.existsSync(modelPath)) {
      spinner.text = 'Downloading Neural Model (ggml-base.en.bin - 140MB)... This may take a moment.';
      await downloadFile(MODELS['base.en'], modelPath);
      spinner.succeed('Neural Model downloaded.');
    } else {
      spinner.info('Neural Model already exists.');
    }

    // 2. Binary Detection/Download
    spinner.start('Checking for Whisper binary...');
    const whisperExe = process.platform === 'win32' ? 'main.exe' : 'whisper';
    const localBinary = path.join(binDir, whisperExe);

    if (!fs.existsSync(localBinary)) {
      spinner.text = 'Whisper binary not found. Please follow the instructions in README to add whisper.cpp binary to /bin folder.';
      spinner.warn('Binary missing.');
      console.log(chalk.yellow('\nTo complete setup:'));
      console.log(chalk.white('1. Download whisper.cpp binary for your OS.'));
      console.log(chalk.white('2. Place the executable in: ') + chalk.cyan(binDir));
      console.log(chalk.white('3. Rename it to "whisper" (or "main.exe" on Windows).\n'));
    } else {
      spinner.succeed('Whisper binary detected.');
    }

    config.set('voiceProvider', 'whisper-local');
    config.set('localWhisperPath', localBinary);
    config.set('localWhisperModel', modelPath);

    console.log(chalk.green.bold('\n✓ Local Whisper configured.'));
    console.log(chalk.gray('Echo will now use your machine for all speech-to-text processing.\n'));

  } catch (error) {
    spinner.fail('Setup failed: ' + error.message);
  }
}

if (require.main === module) {
  setup();
}

module.exports = { setup };
