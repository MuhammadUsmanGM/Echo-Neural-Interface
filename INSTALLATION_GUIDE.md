# Echo Project Setup Guide

This guide will walk you through installing all the necessary dependencies to run the Echo voice assistant.

## Prerequisites

### 1. Python Installation
- Download Python 3.8 or higher from [python.org](https://www.python.org/downloads/)
- During installation, make sure to check "Add Python to PATH"
- Verify installation by opening command prompt and typing:
  ```
  python --version
  ```

### 2. Git Installation (Optional but Recommended)
- Download Git from [git-scm.com](https://git-scm.com/downloads)
- Follow the installation wizard with default settings

## Step-by-Step Installation

### Step 1: Install FFmpeg (Required for Whisper)
FFmpeg is needed for audio processing in Whisper.

**Option A: Manual Installation**
1. Go to https://ffmpeg.org/download.html
2. Download the Windows build
3. Extract the folder to `C:\ffmpeg`
4. Add `C:\ffmpeg\bin` to your system PATH:
   - Press Win + X and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System Variables", find and select "Path", then click "Edit"
   - Click "New" and add `C:\ffmpeg\bin`
   - Click "OK" to close all dialogs
   - Restart your command prompt

**Option B: Using Chocolatey (if you have it installed)**
```
choco install ffmpeg
```

### Step 2: Install Ollama (Local AI Model Runner)

1. Go to https://ollama.ai/
2. Download and install the Ollama application for Windows
3. After installation, open Command Prompt as Administrator and run:
   ```
   ollama serve
   ```
4. In a new command prompt window, download a model:
   ```
   ollama pull llama2
   ```
   Or for better performance:
   ```
   ollama pull mistral
   ```
5. Verify Ollama is working:
   ```
   ollama list
   ```

### Step 3: Clone or Download the Echo Project

**Option A: Using Git**
```
git clone <your-echo-project-repo-url>
cd echo
```

**Option B: Download ZIP**
1. Download the project as a ZIP file
2. Extract it to a folder (e.g., `C:\echo`)
3. Open Command Prompt and navigate to the folder:
   ```
   cd C:\echo
   ```

### Step 4: Create Virtual Environment

1. Open Command Prompt in your Echo project directory
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```
   venv\Scripts\activate
   ```
   You should see `(venv)` at the beginning of your command prompt

### Step 5: Install Python Dependencies

1. Make sure you're in the Echo project directory with the virtual environment activated
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

   If you encounter issues, install packages individually:
   ```
   pip install pyaudio numpy scipy openai-whisper pyttsx3 requests
   ```

### Step 6: Install Additional Audio Dependencies (Windows)

Some systems may need Microsoft Visual C++ Build Tools for PyAudio:

1. Download and install Microsoft C++ Build Tools from:
   https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. During installation, select "C++ build tools" workload
3. Retry installing PyAudio:
   ```
   pip install pyaudio
   ```

### Step 7: Verify Installation

1. Make sure Ollama is running:
   ```
   ollama serve
   ```
   Keep this command prompt open (do not close it)

2. In a new command prompt, navigate to your Echo project directory and activate the virtual environment:
   ```
   cd C:\echo
   venv\Scripts\activate
   ```

3. Test if everything is working by running:
   ```
   python -c "import whisper; print('Whisper imported successfully')"
   python -c "import pyttsx3; print('Pyttsx3 imported successfully')"
   python -c "import pyaudio; print('PyAudio imported successfully')"
   ```

### Step 8: Run Echo

1. Make sure Ollama is running in one command prompt
2. In another command prompt:
   ```
   cd C:\echo
   venv\Scripts\activate
   python main.py
   ```

## Troubleshooting Common Issues

### Issue: "Microsoft Visual C++ 14.0 is required"
- Install Microsoft C++ Build Tools as mentioned in Step 6

### Issue: "pyaudio installation fails"
- Try installing pre-compiled wheel:
  ```
  pip install pipwin
  pipwin install pyaudio
  ```

### Issue: "No module named 'whisper'"
- Make sure you installed openai-whisper:
  ```
  pip install openai-whisper
  ```

### Issue: "No audio devices found"
- Check if your microphone is properly connected and enabled in Windows Sound settings
- Test your microphone in another application first

### Issue: "Ollama not responding"
- Make sure Ollama service is running
- Check if port 11434 is not blocked by firewall
- Try restarting the Ollama service

### Issue: "CUDA not available" (if using GPU)
- Whisper will automatically fall back to CPU processing
- The application will still work, just potentially slower

## Quick Test Commands

Once Echo is running, try these commands:
- "Hello Echo what time is it?" (should respond with current time)
- "Hello Echo open calculator" (should open calculator)
- "Hello Echo list files in current directory" (should list files)

## Updating Models

To update your Ollama models later:
```
ollama pull llama2  # or whatever model you're using
```

## Deactivating Virtual Environment

When you're done working with Echo:
```
deactivate
```

---

**Note**: The first time you run Echo, it may take a bit longer as Whisper loads its model into memory. Subsequent runs will be faster.