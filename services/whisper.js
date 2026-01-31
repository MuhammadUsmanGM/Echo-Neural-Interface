// This service will handle local speech-to-text using Whisper
// Note: Requires whisper.cpp or a similar local engine
const { spawn } = require('child_process');
const path = require('path');

class WhisperService {
    constructor() {
        this.isRecording = false;
    }

    startListening(callback) {
        console.log("Starting voice listener...");
        this.isRecording = true;
        // In a real implementation, we would use node-record-lpcm16 
        // to stream audio to a local Whisper instance.
        // For the initial prototype, we can use a hotkey or just simulate detection.
    }

    stopListening() {
        this.isRecording = false;
    }
}

module.exports = WhisperService;
