const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { execFile } = require('child_process');

class WhisperService {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
        this.mode = config.mode || 'cloud'; // 'cloud' or 'local'
        this.localPath = config.localPath;
        this.modelPath = config.modelPath;
    }

    async transcribe(audioBuffer) {
        if (this.mode === 'local') {
            return this.transcribeLocal(audioBuffer);
        } else {
            return this.transcribeCloud(audioBuffer);
        }
    }

    async transcribeCloud(audioBuffer) {
        if (!this.apiKey) {
            throw new Error('OpenAI API Key is required for Whisper Cloud.');
        }

        const tempDir = app.getPath('temp');
        const tempFilePath = path.join(tempDir, `echo_voice_${Date.now()}.wav`);
        
        try {
            fs.writeFileSync(tempFilePath, audioBuffer);
            const formData = new FormData();
            formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
            formData.append('model', 'whisper-1');

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Whisper API Error');
            }

            const data = await response.json();
            return data.text;
        } finally {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }
    }

    async transcribeLocal(audioBuffer) {
        if (!this.localPath || !fs.existsSync(this.localPath)) {
            throw new Error('Local Whisper binary not found. Please run local setup.');
        }

        const tempDir = app.getPath('temp');
        const inputPath = path.join(tempDir, `echo_in_${Date.now()}.wav`);
        
        try {
            // Note: For whisper.cpp local, we MUST have a 16kHz WAV.
            // In a production app, we would use ffmpeg here to ensure format.
            // For now, we assume the buffer is compatible or provided correctly.
            fs.writeFileSync(inputPath, audioBuffer);

            return new Promise((resolve, reject) => {
                const args = ['-m', this.modelPath, '-f', inputPath, '-nt'];
                execFile(this.localPath, args, (error, stdout, stderr) => {
                    if (error) {
                        return reject(new Error('Local Whisper Error: ' + stderr));
                    }
                    // whisper.cpp output often contains timestamps like [00:00:00.000 -> 00:00:02.000]
                    const cleanOutput = stdout.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s+->\s+\d{2}:\d{2}:\d{2}\.\d{3}\]\s+/g, '').trim();
                    resolve(cleanOutput);
                });
            });
        } finally {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        }
    }
}

module.exports = WhisperService;
