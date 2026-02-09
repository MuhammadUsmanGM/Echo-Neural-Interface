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

// Theme State
let currentTheme = {
    r: 0, g: 242, b: 255, // Default Cyan
    hex: '#00f2ff'
};

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 242, b: 255 };
}

// ==================== PREMIUM PARTICLE SYSTEM ====================
const particles = [];
const PARTICLE_COUNT = 2000;
const SPHERE_RADIUS = 85;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        const i = particles.length;
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
        
        // Use current theme color
        const { r, g, b } = currentTheme;
        const colorVariant = Math.random();
        
        if (colorVariant > 0.85) {
             this.color = `rgba(${Math.min(255, r + 100)}, ${Math.max(0, g - 50)}, ${b}, `;
        } else if (colorVariant > 0.7) {
             this.color = `rgba(${r}, ${g}, ${b}, `;
        } else {
             this.color = `rgba(${r}, ${g}, ${b}, `;
        }
        
        this.offset = Math.random() * Math.PI * 2;
    }

    update(rotationX, rotationY, audioLevel, time) {
        let tempY = this.baseY * Math.cos(rotationX) - this.baseZ * Math.sin(rotationX);
        let tempZ = this.baseY * Math.sin(rotationX) + this.baseZ * Math.cos(rotationX);
        
        let tempX = this.baseX * Math.cos(rotationY) - tempZ * Math.sin(rotationY);
        tempZ = this.baseX * Math.sin(rotationY) + tempZ * Math.cos(rotationY);

        const waveFreq1 = 0.08;
        const waveFreq2 = 0.12;
        const waveSpeed = 0.003;
        
        const baseAmplitude = 15 + (audioLevel * 0.6);
        
        const wave1 = Math.sin(tempY * waveFreq1 + time * waveSpeed + this.offset) * baseAmplitude;
        const wave2 = Math.cos(tempX * waveFreq2 + time * waveSpeed * 1.3) * baseAmplitude * 0.7;
        const wave3 = Math.sin((tempX + tempY) * 0.05 + time * waveSpeed * 0.8) * baseAmplitude * 0.5;
        
        const totalWave = (wave1 + wave2 + wave3) / 3;
        const distortion = 1 + (totalWave / 300);
        
        this.x = tempX * distortion;
        this.y = tempY * distortion;
        this.z = tempZ * distortion;
        
        const perspective = 400;
        const scale = perspective / (perspective + this.z);
        
        this.screenX = 150 + this.x * scale;
        this.screenY = 150 + this.y * scale;
        
        const depthScale = scale * (1 + audioLevel / 200);
        this.screenSize = this.baseSize * depthScale;
        
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

for(let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

// ==================== ANIMATION STATE ====================
let audioLevel = 0;
let targetAudioLevel = 0;
let rotationX = 0;
let rotationY = 0;
let rotationSpeedX = 0.003;
let rotationSpeedY = 0.004;
let time = 0;
let isEchoSpeaking = false;

function animate() {
    audioLevel += (targetAudioLevel - audioLevel) * 0.15;
    
    rotationX += rotationSpeedX;
    rotationY += rotationSpeedY;
    time = Date.now();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Core glow using Theme Color
    const glowRadius = 80 + (audioLevel * 1.5);
    const glowIntensity = 0.15 + (audioLevel / 250);
    const { r, g, b } = currentTheme;
    
    const gradient = ctx.createRadialGradient(150, 150, 20, 150, 150, glowRadius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 300);
    
    particles.sort((a, b) => a.z - b.z);
    
    particles.forEach(p => {
        p.update(rotationX, rotationY, audioLevel, time);
        p.draw();
    });

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

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        statusLabel.innerText = "LISTENING_AGENT";
        statusText.innerText = "AWAITING INPUT...";
        echoContainer.classList.add('listening');
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        
        statusText.innerText = transcript.toUpperCase();
        
        if (event.results[event.results.length - 1].isFinal) {
            handleVoiceCommand(transcript);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            statusText.innerText = "NO INPUT DETECTED";
        }
    };

    recognition.onend = () => {
        if (echoContainer.classList.contains('listening') && !echoContainer.classList.contains('talking') && !isEchoSpeaking) {
            try { recognition.start(); } catch(e) {}
        }
    };
} else {
    statusLabel.innerText = "ERROR";
    statusText.innerText = "SPEECH API UNAVAILABLE";
}

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
        
        if (recognition && !isEchoSpeaking) {
            try { recognition.start(); } catch(e) {}
        }
    };

    let ttsInterval;
    const startTTSVisualization = () => {
        isEchoSpeaking = true;
        ttsInterval = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                targetAudioLevel = 50 + Math.random() * 70;
            } else {
                clearInterval(ttsInterval);
                targetAudioLevel = 0;
                isEchoSpeaking = false;
            }
        }, 80);
    };

    startTTSVisualization();
    window.speechSynthesis.speak(utterance);
}

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
            
            let sum = 0;
            const start = Math.floor(bufferLength * 0.1);
            const end = Math.floor(bufferLength * 0.7);
            
            for (let i = start; i < end; i++) {
                sum += dataArray[i];
            }
            
            const average = sum / (end - start);
            
            targetAudioLevel = Math.min(50, average * 1.5); 
            
            requestAnimationFrame(updateAudioLevel);
        }
        updateAudioLevel();
        
        if (recognition && !isEchoSpeaking) {
            echoContainer.classList.add('listening');
            try { recognition.start(); } catch(e) {}
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
