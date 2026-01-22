"""
Speech processor module for Echo
Handles speech-to-text conversion using local Whisper
"""
import asyncio
import logging
import os
from typing import Optional
from src.utils.config import Config


class SpeechProcessor:
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Initialize the Whisper model once and reuse it
        self._whisper_model = None
        try:
            import whisper
            self._whisper_model = whisper.load_model(self.config.whisper_model)
        except ImportError:
            self.logger.error("Whisper Python library not installed. Install with: pip install openai-whisper")
        except Exception as e:
            self.logger.error(f"Error loading Whisper model: {e}")

    async def process_audio(self, audio_file_path: str) -> Optional[str]:
        """
        Process audio file using local Whisper and return transcribed text
        """
        if not self._whisper_model:
            self.logger.error("Whisper model not loaded. Cannot process audio.")
            return None

        try:
            # Transcribe using Whisper with the cached model
            transcription = await self._transcribe_with_cached_model(audio_file_path)

            if transcription:
                self.logger.info(f"Transcription successful: {transcription}")
                return transcription.strip()
            else:
                self.logger.warning("Transcription returned empty result")
                return None

        except Exception as e:
            self.logger.error(f"Error processing audio: {e}")
            return None

    async def _transcribe_with_cached_model(self, audio_file_path: str) -> Optional[str]:
        """
        Transcribe audio file using the cached Whisper model
        """
        try:
            # Use the cached model for transcription
            result = self._whisper_model.transcribe(audio_file_path)
            transcription = result.get("text", "").strip()

            return transcription

        except Exception as e:
            self.logger.error(f"Error during Whisper transcription: {e}")
            return None

    def reload_model(self, model_name: str = None):
        """
        Reload the Whisper model (useful for changing models at runtime)
        """
        try:
            import whisper
            model_to_load = model_name or self.config.whisper_model
            self._whisper_model = whisper.load_model(model_to_load)
            self.logger.info(f"Successfully reloaded Whisper model: {model_to_load}")
            return True
        except Exception as e:
            self.logger.error(f"Error reloading Whisper model: {e}")
            return False