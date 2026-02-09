const statusText = document.getElementById('status-content');
const statusLabel = document.getElementById('status-label');
const echoContainer = document.querySelector('.echo-container');
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

// Canvas Setup with Hi-DPI support
let width, height, dpr;
function resize() {
    dpr = window.devicePixelRatio || 1;
    width = canvas.width = 300 * dpr;
    height = canvas.height = 300 * dpr;
    canvas.style.width = '300px';
    canvas.style.height = '300px';
    ctx.scale(dpr, dpr);
}
resize();
window.addEventListener('resize', resize);

// UPDATED: Theme State - Emerald Green Brand Colors
let currentTheme = {
    r: 80, g: 200, b: 120, // Emerald Green (matches CLI logo)
    hex: '#50C878'
};

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 80, g: 200, b: 120 };
}

// ==================== PREMIUM PARTICLE SYSTEM ====================
const particles = [];
const PARTICLE_COUNT = 2000;
const SPHERE_RADIUS = 85;
const CONNECTION_DISTANCE = 45; // For neural network connections

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        const i = particles.length;
        // Fibonacci sphere distribution for even particle placement
        const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        
        this.x = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
        this.y = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
        this.z = SPHERE_RADIUS * Math.cos(phi);
        
        this.baseX = this.x;
        this.baseY = this.y;
        this.baseZ = this.z;
        
        this.size = Math.random() * 1.8 + 0.4;
        this.baseSize = this.size;
        
        // Use current theme color with variations
        const { r, g, b } = currentTheme;
        const colorVariant = Math.random();
        
        if (colorVariant > 0.85) {
            // Brighter emerald
            this.color = `rgba(${Math.min(255, r + 100)}, ${Math.min(255, g + 55)}, ${b}, `;
        } else if (colorVariant > 0.7) {
            // Core emerald
            this.color = `rgba(${r}, ${g}, ${b}, `;
        } else {
            // Deeper emerald
            this.color = `rgba(${Math.max(0, r - 20)}, ${g}, ${b}, `;
        }
        
        this.offset = Math.random() * Math.PI * 2;
        
        // NEW: For neural connections
        this.connections = [];
    }

    update(rotationX, rotationY, audioLevel, bassLevel, time) {
        // 3D rotation math
        let tempY = this.baseY * Math.cos(rotationX) - this.baseZ * Math.sin(rotationX);
        let tempZ = this.baseY * Math.sin(rotationX) + this.baseZ * Math.cos(rotationX);
        
        let tempX = this.baseX * Math.cos(rotationY) - tempZ * Math.sin(rotationY);
        tempZ = this.baseX * Math.sin(rotationY) + tempZ * Math.cos(rotationY);

        // Multi-frequency wave distortions
        const waveFreq1 = 0.08;
        const waveFreq2 = 0.12;
        const waveSpeed = 0.003;
        
        // Bass frequencies affect amplitude more
        const baseAmplitude = 15 + (audioLevel * 0.6) + (bassLevel * 0.8);
        
        const wave1 = Math.sin(tempY * waveFreq1 + time * waveSpeed + this.offset) * baseAmplitude;
        const wave2 = Math.cos(tempX * waveFreq2 + time * waveSpeed * 1.3) * baseAmplitude * 0.7;
        const wave3 = Math.sin((tempX + tempY) * 0.05 + time * waveSpeed * 0.8) * baseAmplitude * 0.5;
        
        const totalWave = (wave1 + wave2 + wave3) / 3;
        const distortion = 1 + (totalWave / 300);
        
        this.x = tempX * distortion;
        this.y = tempY * distortion;
        this.z = tempZ * distortion;
        
        // Perspective projection
        const perspective = 400;
        const scale = perspective / (perspective + this.z);
        
        this.screenX = 150 + this.x * scale;
        this.screenY = 150 + this.y * scale;
        
        const depthScale = scale * (1 + audioLevel / 200);
        this.screenSize = this.baseSize * depthScale;
        
        // Brightness calculation
        const depthBrightness = (this.z + SPHERE_RADIUS) / (SPHERE_RADIUS * 2);
        const waveBrightness = (totalWave + baseAmplitude * 2) / (baseAmplitude * 4);
        const audioBrightness = audioLevel / 100;
        
        this.screenAlpha = Math.min(0.9, Math.max(0.15, 
            depthBrightness * 0.4 + 
            waveBrightness * 0.3 + 
            audioBrightness * 0.3
        ));
    }

    draw() {
        const gradient = ctx.createRadialGradient(
            this.screenX, this.screenY, 0,
            this.screenX, this.screenY, this.screenSize * 2
        );
        gradient.addColorStop(0, this.color + this.screenAlpha + ')');
        gradient.addColorStop(1, this.color + '0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.screenX, this.screenY, this.screenSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Enhanced glow for bright particles
        if (this.screenAlpha > 0.6) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color + this.screenAlpha + ')';
            ctx.beginPath();
            ctx.arc(this.screenX, this.screenY, this.screenSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Initialize particles
for(let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

// NEW: Neural network connections
function drawConnections(audioLevel) {
    if (audioLevel < 10) return; // Only draw when there's audio
    
    const { r, g, b } = currentTheme;
    const maxConnections = Math.min(300, Math.floor(audioLevel * 5)); // More connections with more audio
    let connectionCount = 0;
    
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length && connectionCount < maxConnections; i++) {
        const p1 = particles[i];
        if (p1.z > 0) continue; // Only connect front-facing particles
        
        for (let j = i + 1; j < particles.length && connectionCount < maxConnections; j++) {
            const p2 = particles[j];
            if (p2.z > 0) continue;
            
            const dx = p1.screenX - p2.screenX;
            const dy = p1.screenY - p2.screenY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < CONNECTION_DISTANCE) {
                const opacity = (1 - distance / CONNECTION_DISTANCE) * 0.3 * (audioLevel / 50);
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(p1.screenX, p1.screenY);
                ctx.lineTo(p2.screenX, p2.screenY);
                ctx.stroke();
                
                connectionCount++;
            }
        }
    }
}

// ==================== ANIMATION STATE ====================
let audioLevel = 0;
let bassLevel = 0;
let targetAudioLevel = 0;
let targetBassLevel = 0;
let rotationX = 0;
let rotationY = 0;
let rotationSpeedX = 0.003;
let rotationSpeedY = 0.004;
let time = 0;
let isEchoSpeaking = false;

function animate() {
    // Smooth audio transitions
    audioLevel += (targetAudioLevel - audioLevel) * 0.15;
    bassLevel += (targetBassLevel - bassLevel) * 0.12;
    
    rotationX += rotationSpeedX;
    rotationY += rotationSpeedY;
    time = Date.now();
    
    // Trail effect (motion blur)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Core glow using Theme Color
    const glowRadius = 80 + (audioLevel * 1.5) + (bassLevel * 2);
    const glowIntensity = 0.15 + (audioLevel / 250) + (bassLevel / 300);
    const { r, g, b } = currentTheme;
    
    const gradient = ctx.createRadialGradient(150, 150, 20, 150, 150, glowRadius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 300);
    
    // Sort particles by depth for proper rendering
    particles.sort((a, b) => a.z - b.z);
    
    // Update and draw particles
    particles.forEach(p => {
        p.update(rotationX, rotationY, audioLevel, bassLevel, time);
        p.draw();
    });
    
    // NEW: Draw neural network connections
    drawConnections(audioLevel);

    requestAnimationFrame(animate);
}
animate();

// ==================== AUDIO & SPEECH RECOGNITION ====================

// Theme application
if (window.electronAPI) {
    window.electronAPI.onApplyTheme((themeColors) => {
        document.documentElement.style.setProperty('--core-color', themeColors.core);
        document.documentElement.style.setProperty('--glow-color', themeColors.glow);
        
        // Update JS Theme State
        const rgb = hexToRgb(themeColors.core);
        currentTheme = { r: rgb.r, g: rgb.g, b: rgb.b, hex: themeColors.core };
        
        // Re-initialize particles to apply new color instantly
        particles.forEach(p => p.reset());
    });
}

let audioContext;
let analyser;
let microphone;
let dataArray;

// ==================== SPEECH RECOGNITION ENGINES ====================
class VoiceEngine {
    constructor() {
        this.provider = 'browser';
        this.recognition = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.silenceTimer = null;
        this.lastAudioTime = Date.now();
        this.stream = null;
    }

    async init() {
        if (window.electronAPI) {
            const config = await window.electronAPI.getVoiceConfig();
            this.provider = config.provider || 'browser';
        }

        if (this.provider === 'browser') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';

                this.recognition.onstart = () => {
                    statusLabel.innerText = "LISTENING_AGENT";
                    statusText.innerText = "AWAITING INPUT...";
                    echoContainer.classList.add('listening');
                };

                this.recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    if (interimTranscript) {
                        statusText.innerText = interimTranscript.toUpperCase();
                    }

                    if (finalTranscript.trim()) {
                        this.stop();
                        handleVoiceCommand(finalTranscript.trim());
                    }
                };

                this.recognition.onerror = (event) => {
                    console.error("Speech recognition error:", event.error);
                    if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        statusLabel.innerText = "ERROR";
                        statusText.innerText = "RECOGNITION FAILED";
                    }
                };

                this.recognition.onend = () => {
                    if (!isEchoSpeaking && this.provider === 'browser') {
                        setTimeout(() => this.restartListening(), 500);
                    }
                };
            }
        }
    }

    async start(stream) {
        this.stream = stream;
        this.isRecording = true;
        
        if (this.provider === 'browser' && this.recognition) {
            try {
                this.recognition.start();
            } catch (e) {
                console.log("Recognition already started");
            }
        } else if (this.provider === 'whisper' && stream) {
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.lastAudioTime = Date.now();

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                if (this.audioChunks.length === 0) {
                    this.restartListening();
                    return;
                }

                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const arrayBuffer = await audioBlob.arrayBuffer();
                
                statusLabel.innerText = "WHISPER_AI";
                statusText.innerText = "TRANSCRIBING NEURAL DATA...";
                
                try {
                    const result = await window.electronAPI.transcribeAudio(arrayBuffer);
                    if (result.success && result.text.trim()) {
                        handleVoiceCommand(result.text);
                    } else {
                        this.restartListening();
                    }
                } catch (error) {
                    console.error("Whisper Error:", error);
                    this.restartListening();
                }
            };

            this.mediaRecorder.start();
            statusLabel.innerText = "WHISPER_ACTIVE";
            statusText.innerText = "RECORDING DATA...";
            echoContainer.classList.add('listening');
        }
    }

    stop() {
        this.isRecording = false;
        if (this.provider === 'browser' && this.recognition) {
            this.recognition.stop();
        } else if (this.provider === 'whisper' && this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        echoContainer.classList.remove('listening');
    }

    restartListening() {
        if (!isEchoSpeaking) {
            this.start(this.stream);
        }
    }

    // Called by the visualizer to detect silence for Whisper
    processAudioLevel(level) {
        if (this.provider !== 'whisper' || !this.isRecording) return;

        const now = Date.now();
        if (level > 2) { // 2 is noise floor
            this.lastAudioTime = now;
        }

        if (now - this.lastAudioTime > 1500 && this.audioChunks.length > 0) {
            this.stop();
        }
    }
}

const voiceEngine = new VoiceEngine();
voiceEngine.init();

async function handleVoiceCommand(text) {
    statusLabel.innerText = "ANALYZING";
    statusText.innerText = "PROCESSING DATA...";
    echoContainer.classList.remove('listening');
    echoContainer.classList.add('processing');
    
    rotationSpeedX = 0.02;
    rotationSpeedY = 0.02;

    try {
        if (window.electronAPI) {
            const result = await window.electronAPI.processInput(text);
            
            echoContainer.classList.remove('processing');
            echoContainer.classList.add('talking');
            
            statusLabel.innerText = "SYSTEM_ACTIVE";
            statusText.innerText = "TRANSMITTING RESPONSE";
            
            speakResponse(result.text);
        } else {
            echoContainer.classList.remove('processing');
            echoContainer.classList.add('talking');
            statusLabel.innerText = "SYSTEM_ACTIVE";
            statusText.innerText = "TRANSMITTING RESPONSE";
            speakResponse(`You said: ${text}`);
        }
    } catch (err) {
        console.error("Processing Error:", err);
        statusLabel.innerText = "ERROR";
        statusText.innerText = "SYSTEM FAILURE";
        echoContainer.classList.remove('processing');
        speakResponse("I encountered a critical system error. Please try again.");
    }
}

function speakResponse(text) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = [
            'Google UK English Male',
            'Microsoft David',
            'Google US English',
            'Alex',
            'Daniel'
        ];
        
        for (let voiceName of preferredVoices) {
            const voice = voices.find(v => v.name.includes(voiceName));
            if (voice) {
                utterance.voice = voice;
                break;
            }
        }
    };
    
    if (window.speechSynthesis.getVoices().length) {
        setVoice();
    } else {
        window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.pitch = 0.95;
    utterance.rate = 1.05;
    utterance.volume = 1.0;

    utterance.onend = () => {
        echoContainer.classList.remove('talking');
        statusLabel.innerText = "LISTENING_AGENT";
        statusText.innerText = "AWAITING INPUT...";
        
        rotationSpeedX = 0.003;
        rotationSpeedY = 0.004;
        
        if (voiceEngine && !isEchoSpeaking) {
            voiceEngine.start(voiceEngine.stream);
        }
    };

    let ttsInterval;
    const startTTSVisualization = () => {
        isEchoSpeaking = true;
        ttsInterval = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                targetAudioLevel = 50 + Math.random() * 70;
                targetBassLevel = 30 + Math.random() * 40;
            } else {
                clearInterval(ttsInterval);
                targetAudioLevel = 0;
                targetBassLevel = 0;
                isEchoSpeaking = false;
            }
        }, 80);
    };

    startTTSVisualization();
    window.speechSynthesis.speak(utterance);
}

// ENHANCED: Audio visualizer with frequency band separation
async function startVisualizer() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.smoothingTimeConstant = 0.85;
        analyser.fftSize = 512;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        microphone.connect(analyser);
        
        function updateAudioLevel() {
            if (isEchoSpeaking) {
                requestAnimationFrame(updateAudioLevel);
                return;
            }

            analyser.getByteFrequencyData(dataArray);
            
            // Separate frequency bands
            let bassSum = 0;
            let midSum = 0;
            
            const bassEnd = Math.floor(bufferLength * 0.15); // Bass: 0-15%
            const midStart = Math.floor(bufferLength * 0.1);
            const midEnd = Math.floor(bufferLength * 0.7); // Mid: 10-70%
            
            // Bass frequencies (low end)
            for (let i = 0; i < bassEnd; i++) {
                bassSum += dataArray[i];
            }
            
            // Mid frequencies
            for (let i = midStart; i < midEnd; i++) {
                midSum += dataArray[i];
            }
            
            const bassAverage = bassSum / bassEnd;
            const midAverage = midSum / (midEnd - midStart);
            
            targetBassLevel = Math.min(50, bassAverage * 1.8);
            targetAudioLevel = Math.min(50, midAverage * 1.5); 
            
            // Feed level to voice engine for silence detection
            voiceEngine.processAudioLevel(targetAudioLevel);
            
            requestAnimationFrame(updateAudioLevel);
        }
        updateAudioLevel();
        
        if (voiceEngine && !isEchoSpeaking) {
            voiceEngine.start(stream);
        }
        
        statusLabel.innerText = "ONLINE";
        statusText.innerText = "AWAITING COMMAND";
        
    } catch (err) {
        console.error("Microphone access error:", err);
        statusLabel.innerText = "ERROR";
        statusText.innerText = "MIC ACCESS DENIED";
    }
}

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!audioContext) {
            startVisualizer();
            statusLabel.innerText = "ONLINE";
            statusText.innerText = "AWAITING COMMAND";
        }
    }, 1000);
});

document.querySelector('.oracle-wrapper').addEventListener('click', () => {
    if (!audioContext) startVisualizer();
});

document.addEventListener('contextmenu', e => e.preventDefault());
