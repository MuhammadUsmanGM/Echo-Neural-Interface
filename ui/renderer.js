const statusText = document.getElementById('status-text');
const echoContainer = document.querySelector('.echo-container');
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

// Canvas Setup
let width, height;
function resize() {
    width = canvas.width = 300; // Hi-DPI
    height = canvas.height = 300;
}
resize();
window.addEventListener('resize', resize);

// Particle System
const particles = [];
const PARTICLE_COUNT = 1500; // High particle count for density
const SPHERE_RADIUS = 80;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        // Random point on sphere surface
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        this.x = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
        this.y = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
        this.z = SPHERE_RADIUS * Math.cos(phi);
        
        this.baseX = this.x;
        this.baseY = this.y;
        this.baseZ = this.z;
        
        this.size = Math.random() * 1.5 + 0.5;
        this.color = `rgba(0, 242, 255, ${Math.random() * 0.5 + 0.2})`; // Core Cyan
    }

    update(rotationX, rotationY, audioLevel, time) {
        // 1. Basic 3D Rotation
        let y = this.y * Math.cos(rotationX) - this.z * Math.sin(rotationX);
        let z = this.y * Math.sin(rotationX) + this.z * Math.cos(rotationX);
        this.y = y;
        this.z = z;

        let x = this.x * Math.cos(rotationY) - this.z * Math.sin(rotationY);
        z = this.x * Math.sin(rotationY) + this.z * Math.cos(rotationY);
        this.x = x;
        this.z = z;

        // 2. Wavy "Liquid" Behavior Control
        // We use sine waves based on the particle's original position (baseY) and current time
        // The 'audioLevel' controls the AMPLITUDE (height) of the waves
        
        const waveFrequency = 0.1; 
        const waveSpeed = 0.005;
        const waveAmplitude = audioLevel * 0.8; // How high the wave spikes

        // Calculate a ripple offset
        const ripple = Math.sin(this.baseY * waveFrequency + time * waveSpeed) * waveAmplitude;
        const ripple2 = Math.cos(this.baseX * waveFrequency + time * waveSpeed) * waveAmplitude;

        // Apply the ripple to the particle's distance from center (radius)
        // This makes the sphere surface distort
        const distortion = 1 + (ripple + ripple2) / 200;
        
        this.currentX = this.x * distortion;
        this.currentY = this.y * distortion;
        
        // Perspective projection
        const scale = 300 / (300 + this.z);
        this.screenX = width/2 + this.currentX * scale;
        this.screenY = height/2 + this.currentY * scale;
        this.screenSize = this.size * scale;
        
        // Brightness reacts to the wave peak
        const brightness = 0.5 + (audioLevel / 100) + (ripple / 50);
        this.screenAlpha = Math.min(1, Math.max(0.1, brightness)); 
    }

    draw() {
        ctx.fillStyle = this.color.replace('rgba', 'rgb').replace(')', `, ${this.screenAlpha})`); 
        ctx.beginPath();
        ctx.arc(this.screenX, this.screenY, this.screenSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize Particles
for(let i=0; i<PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

let audioLevel = 0;
let rotationX = 0.005;
let rotationY = 0.005;

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Time variable for wave phase
    const time = Date.now();
    
    // Core glow (Dynamic Pulse)
    // The glow should pulsate with the sound too
    const corePulse = 10 + (audioLevel * 2); // Expands up to +50px
    const gradient = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, 120 + corePulse);
    gradient.addColorStop(0, `rgba(0, 242, 255, ${0.1 + audioLevel/300})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Speed up rotation slightly when loud, otherwise gentle spin
    const speedMultiplier = 1 + (audioLevel / 500); 
    
    particles.forEach(p => {
        // Pass time to drive the ripple
        p.update(rotationX * speedMultiplier, rotationY * speedMultiplier, audioLevel, time);
        p.draw();
    });

    requestAnimationFrame(animate);
}
animate();

// --- LOGIC ---

// Load and apply theme
window.electronAPI.onApplyTheme((themeColors) => {
    document.documentElement.style.setProperty('--core-color', themeColors.core);
    document.documentElement.style.setProperty('--glow-color', themeColors.glow);
    // Update particle colors? For now just use CSS var for HUD
});

let audioContext;
let analyser;
let microphone;
let javascriptNode;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        statusText.innerText = "LISTENING...";
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
} else {
    statusText.innerText = "NO SPEECH API";
}

async function handleVoiceCommand(text) {
    statusText.innerText = "PROCESSING";
    echoContainer.classList.add('processing');
    
    // Visual feedback: Spin fast
    rotationY = 0.05;

    try {
        const result = await window.electronAPI.processInput(text);
        
        echoContainer.classList.remove('processing');
        echoContainer.classList.add('talking');
        statusText.innerText = result.action ? `ACTION: ${result.action.toUpperCase()}` : "SPEAKING";
        
        speakResponse(result.text);
        
    } catch (err) {
        console.error("Processing Error:", err);
        statusText.innerText = "SYSTEM ERROR";
        echoContainer.classList.remove('processing');
        speakResponse("I encountered a critical error.");
    } finally {
        rotationY = 0.005; // Reset speed
    }
}

function speakResponse(text) {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft David') || v.name.includes('Google US English'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 0.9;
    utterance.rate = 1.0;

    utterance.onend = () => {
        echoContainer.classList.remove('talking');
        statusText.innerText = "LISTENING...";
        if (recognition) {
            try { recognition.start(); } catch(e) {}
        }
    };

    // Simulate audio level for TTS (fake visualizer for output)
    const flickerInterval = setInterval(() => {
        audioLevel = Math.random() * 50; 
        if(!window.speechSynthesis.speaking) {
            clearInterval(flickerInterval);
            audioLevel = 0;
        }
    }, 50);

    window.speechSynthesis.speak(utterance);
}

async function startVisualizer() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 256;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            for (let i = 0; i < array.length; i++) { values += array[i]; }
            
            // Set global audio level for particles
            audioLevel = values / array.length; 
        };
        
        if (recognition) {
            try { recognition.start(); } catch(e) {}
        }
    } catch (err) {
        console.error("Mic access denied:", err);
        statusText.innerText = "MIC ACCESS DENIED";
    }
}

// Click anywhere on wrapper to start
document.querySelector('.oracle-wrapper').addEventListener('click', () => {
    if (!audioContext) {
        startVisualizer();
        statusText.innerText = "INITIALIZING...";
    }
});
