"""
Configuration manager for Echo
Handles all configuration settings for the application
"""
import os
from typing import Dict, Any


class Config:
    def __init__(self):
        self.wake_word = os.getenv("ECHO_WAKE_WORD", "hello echo")
        self.whisper_model = os.getenv("WHISPER_MODEL", "tiny")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama2")
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.audio_chunk_size = int(os.getenv("AUDIO_CHUNK_SIZE", "1024"))
        self.sample_rate = int(os.getenv("SAMPLE_RATE", "16000"))
        self.listen_duration = int(os.getenv("LISTEN_DURATION", "5"))  # seconds
        self.silence_threshold = float(os.getenv("SILENCE_THRESHOLD", "0.01"))
        self.max_audio_duration = int(os.getenv("MAX_AUDIO_DURATION", "10"))  # seconds
        self.debug_mode = os.getenv("DEBUG_MODE", "false").lower() == "true"

        # Safety settings
        self.allowed_commands = [
            "open_app", "read_file", "create_file", "list_directory",
            "search_file", "speak_response", "get_time", "get_date"
        ]

        # Allowed applications that can be opened
        self.allowed_apps = [
            "code", "notepad", "calculator", "chrome", "firefox",
            "explorer", "cmd", "powershell"
        ]

        # Restricted paths for safety
        self.restricted_paths = [
            "C:/Windows", "C:/Program Files", "C:/ProgramData",
            "/etc", "/bin", "/sbin", "/usr/bin", "/usr/sbin"
        ]

    def get_ollama_config(self) -> Dict[str, Any]:
        """Get Ollama-specific configuration"""
        return {
            "model": self.ollama_model,
            "host": self.ollama_host
        }

    def get_whisper_config(self) -> Dict[str, Any]:
        """Get Whisper-specific configuration"""
        return {
            "model": self.whisper_model
        }

    def is_safe_path(self, path: str) -> bool:
        """Check if a path is safe to access"""
        normalized_path = os.path.abspath(path).lower()

        for restricted in self.restricted_paths:
            if normalized_path.startswith(restricted.lower()):
                return False

        return True

    def is_allowed_command(self, command: str) -> bool:
        """Check if a command is allowed"""
        return command in self.allowed_commands