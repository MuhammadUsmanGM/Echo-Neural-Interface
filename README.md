# Echo - Voice Controlled Command Runner

Echo is a voice-controlled command runner with AI understanding. It's designed as a simple, safe system that responds to voice commands and performs actions on your computer, similar to Jarvis from Iron Man but focused on practical functionality rather than magical capabilities.

## Features

- Voice activation with wake word ("hello echo")
- Local speech-to-text using Whisper
- Local AI processing using Ollama
- Safe command execution with built-in safety checks
- Text-to-speech responses
- Cross-platform compatibility

## Prerequisites

Before running Echo, you need to install the following:

1. **Python 3.8+**
2. **FFmpeg** (required by Whisper)
3. **Ollama** (for local AI processing)
4. **Local Ollama model** (e.g., llama2)

### Installing FFmpeg

- **Windows**: Download from https://ffmpeg.org/download.html and add to PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)

### Installing Ollama

1. Download from https://ollama.ai/
2. Follow the installation instructions for your platform
3. Pull a model: `ollama pull llama2`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd echo
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install Whisper model (if not already installed):
```bash
pip install openai-whisper
```

## Configuration

Echo can be configured using environment variables:

```bash
export ECHO_WAKE_WORD="hello echo"           # Wake word to activate Echo
export WHISPER_MODEL="tiny"                  # Whisper model (tiny, base, small, medium, large)
export OLLAMA_MODEL="llama2"                 # Ollama model to use
export OLLAMA_HOST="http://localhost:11434"  # Ollama server address
export AUDIO_CHUNK_SIZE=1024                 # Audio chunk size
export SAMPLE_RATE=16000                     # Audio sample rate
export LISTEN_DURATION=5                     # Duration to listen for (seconds)
export DEBUG_MODE=false                      # Enable debug mode
```

Or copy the `.env.example` file and modify it:
```bash
cp .env.example .env
# Edit .env with your preferred editor
```

## Usage

1. Start Ollama service:
```bash
ollama serve
```

2. Run Echo:
```bash
python main.py
```

3. Speak the wake word followed by a command:
- "Hello echo, open VS Code"
- "Hello echo, what time is it?"
- "Hello echo, list files in current directory"

## Commands Supported

Echo supports various commands including:

- Opening applications: "open vs code", "open calculator"
- Reading files: "read file readme.txt"
- Creating files: "create file new.txt with content Hello World"
- Listing directories: "list files in current directory"
- Time/date queries: "what time is it?"

## Safety Features

- Commands are validated before execution
- Dangerous operations are blocked
- Path access is restricted to safe directories
- Applications must be in the allowed list

## Architecture

Echo consists of several modules:

- `main.py`: Main application entry point
- `src/listeners/audio_listener.py`: Handles microphone input
- `src/processors/speech_processor.py`: Converts speech to text using Whisper
- `src/processors/command_interpreter.py`: Interprets commands using Ollama
- `src/responses/tts_manager.py`: Handles text-to-speech responses
- `src/utils/config.py`: Configuration management

## Troubleshooting

- If you get audio errors, make sure your microphone is properly connected
- If Whisper fails, ensure FFmpeg is installed and in your PATH
- If Ollama is not responding, make sure the service is running
- Check logs for detailed error information

## Contributing

Feel free to submit issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT