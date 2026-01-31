const statusText = document.getElementById('status-text');
const blobsContainer = document.querySelector('.blobs-container');
const blobs = document.querySelectorAll('.blob');
const innerSphere = document.querySelector('.sphere-inner');

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
}

async function handleVoiceCommand(text) {
    statusText.innerText = "THINKING...";
    blobsContainer.classList.add('processing');
    
    try {
        const result = await window.electronAPI.processInput(text);
        statusText.innerText = result.text.toUpperCase();
        
        // --- NEW: TTS Integration ---
        speakResponse(result.text);
        
    } catch (err) {
        console.error("Processing Error:", err);
        statusText.innerText = "ERROR IN BRAIN";
    } finally {
        blobsContainer.classList.remove('processing');
    }
}

function speakResponse(text) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Customize the voice to sound more "JARVIS-like"
    const voices = window.speechSynthesis.getVoices();
    // Try to find a professional sounding male voice or a high-quality neutral one
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft David'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 0.9; // Slightly lower pitch for that JARVIS feel
    utterance.rate = 1.0;  // Natural speed

    // Visual feedback while talking
    utterance.onstart = () => {
        blobsContainer.classList.add('talking');
    };
    utterance.onend = () => {
        blobsContainer.classList.remove('talking');
        // Resume listening automatically after Echo finishes talking
        if (recognition) recognition.start();
    };

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

            for (let i = 0; i < array.length; i++) {
                values += array[i];
            }

            const average = values / array.length;
            updateWavyVisuals(average);
        };
        
        if (recognition) recognition.start();
    } catch (err) {
        console.error("Mic access denied:", err);
        statusText.innerText = "MIC ACCESS DENIED";
    }
}

function updateWavyVisuals(volume) {
    const scale = 1 + (volume / 100);
    const speed = 1 + (volume / 20);
    
    // Animate the whole container scale
    blobsContainer.style.transform = `scale(${1 + (volume / 200)})`;
    
    // Animate individual blobs speed and size
    blobs.forEach((blob, index) => {
        const s = 1 + (volume / (100 + index * 50));
        blob.style.transform = `scale(${s})`;
        // Speed up morphing animation
        blob.style.animationDuration = `${(4 - (volume / 40))}s`;
    });

    // Inner sphere intensity
    innerSphere.style.boxShadow = `0 0 ${30 + volume}px var(--glow-color)`;
}

// Click anywhere on wrapper to start
document.querySelector('.oracle-wrapper').addEventListener('click', () => {
    if (!audioContext) {
        startVisualizer();
    }
});
