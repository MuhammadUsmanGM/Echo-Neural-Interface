# Echo - Voice-Controlled Command Runner

## Overview
Echo is a voice-controlled command runner with AI understanding. It's designed as a simple, safe system that responds to voice commands and performs actions on your computer, similar to Jarvis from Iron Man but focused on practical functionality rather than magical capabilities.

## Architecture
Echo is not one program but a small system made of simple parts that talk to each other:

```
You speak
   ↓
Microphone records audio
   ↓
Whisper converts voice → text
   ↓
Echo checks for wake word ("hello echo")
   ↓
Command understanding (Gemini / rules)
   ↓
Safety check
   ↓
Laptop does the action
   ↓
Echo speaks back
```

## Components

### 1. Listening (Echo's ears)
Echo does NOT listen all the time in a heavy way.
- Press a key OR listen in short bursts (5–10 seconds)
- Low CPU usage to prevent lag and crashes on systems with limited resources (4GB RAM)
- Records commands like: "Hello Echo open VS Code"

### 2. Speech → Text (Whisper)
- Whisper runs locally using the tiny model
- Converts speech to text: "hello echo open vs code"
- Uses CPU only, takes ~1–3 seconds
- Works offline

### 3. Wake word detection (Echo wakes up)
- Checks if "hello echo" is in the text
- If wake word is NOT found, Echo ignores the audio
- This keeps Echo from doing random things

```python
if "hello echo" in text:
    activated = True
```

### 4. Understanding the command (Echo's brain)
Extracts the command after the wake word:
- Input: "open vs code"

#### Option A (Recommended): AI-Powered Understanding
- Send text to Gemini free API
- Gemini returns structured intent
```json
{
  "action": "open_app",
  "app": "vscode"
}
```

#### Option B (Fallback): Rule-Based Understanding
- Simple keyword matching
- No AI needed
```python
if "open" in text and "code" in text:
    action = "open_vscode"
```

### 5. Safety check (Critical)
Before any action runs, Echo verifies:
- Is this action allowed?
- Is the path safe?
- Is the app known?

This prevents:
- Deleting system files
- Running dangerous commands
- Accidental damage

Echo never executes raw AI commands without verification.

### 6. Action execution (Echo's hands)
Python controls the laptop to perform actions:
- Open VS Code: `subprocess.Popen(["code"])`
- Open a folder in VS Code: `subprocess.Popen(["code", "flow-col"])`
- Read a file: `with open("notes.txt") as f: content = f.read()`
- Create files/folders

### 7. Response (Echo speaks back)
- Uses pyttsx3 (offline TTS)
- Provides feedback: "Opening VS Code"
- Makes it feel alive but remains lightweight

## Version 1 Capabilities
✅ Wake on "Hello Echo"
✅ Open apps
✅ Open projects in VS Code
✅ Read files
✅ Create files/folders
✅ Speak responses

## Limitations (By Design)
❌ Think on its own
❌ Run commands without permission
❌ Learn continuously
❌ Control your laptop when not activated

This intentional design ensures safety and stability.