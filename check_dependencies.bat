@echo off
echo Checking Echo dependencies...

echo.
echo Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo.
echo Checking pip...
pip --version
if errorlevel 1 (
    echo ERROR: pip not found.
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Virtual environment not found. Run 'python -m venv venv' first.
    pause
    exit /b 1
)

echo.
echo Checking Python packages...
python -c "import pyaudio; print('✓ PyAudio: OK')" 2>nul || echo '✗ PyAudio: MISSING'
python -c "import numpy; print('✓ NumPy: OK')" 2>nul || echo '✗ NumPy: MISSING'
python -c "import scipy; print('✓ SciPy: OK')" 2>nul || echo '✗ SciPy: MISSING'
python -c "import whisper; print('✓ Whisper: OK')" 2>nul || echo '✗ Whisper: MISSING'
python -c "import pyttsx3; print('✓ Pyttsx3: OK')" 2>nul || echo '✗ Pyttsx3: MISSING'
python -c "import requests; print('✓ Requests: OK')" 2>nul || echo '✗ Requests: MISSING'

echo.
echo Checking FFmpeg...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo ✗ FFmpeg: MISSING - Required for Whisper
) else (
    echo ✓ FFmpeg: OK
)

echo.
echo Checking Ollama...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Ollama: MISSING - Required for AI processing
) else (
    echo ✓ Ollama: OK
    echo Checking if Ollama is running...
    ollama list >nul 2>&1
    if errorlevel 1 (
        echo ⚠ Ollama: INSTALLED but NOT RUNNING
        echo    Start with: ollama serve
    ) else (
        echo ✓ Ollama: RUNNING
    )
)

echo.
echo Dependency check complete!
pause