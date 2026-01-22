# Echo Quick Start Guide

## Prerequisites
- Python 3.8+
- FFmpeg installed and in PATH
- Ollama installed and running

## One-Time Setup

### 1. Install Dependencies
```bash
# Install Python packages
pip install -r requirements.txt
```

### 2. Install Ollama Model
```bash
# In a separate terminal, start Ollama
ollama serve

# In another terminal, download a model
ollama pull llama2
# or
ollama pull mistral
```

## Running Echo

### 1. Start Ollama Server
Keep this terminal running:
```bash
ollama serve
```

### 2. Run Echo
In a new terminal:
```bash
# Navigate to Echo directory
cd C:\path\to\echo

# Activate virtual environment
venv\Scripts\activate

# Run Echo
python main.py
```

## Using Echo

Speak the wake word followed by a command:
- "Hello Echo, what time is it?"
- "Hello Echo, open calculator"
- "Hello Echo, list files in current directory"
- "Hello Echo, open VS Code"

## Available Commands

- **Time/Date**: "what time is it?", "what date is it?"
- **Open Apps**: "open calculator", "open notepad", "open vs code"
- **File Operations**: "list files in current directory", "read file filename.txt"
- **System Info**: Coming soon...

## Troubleshooting

If Echo doesn't respond:
1. Check that Ollama server is running
2. Verify your microphone is working
3. Make sure you're speaking the wake word clearly
4. Check the console for error messages

## Stopping Echo

Press `Ctrl+C` in the terminal where Echo is running to stop it gracefully.