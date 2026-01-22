"""
Text-to-speech manager for Echo
Handles speaking responses using local TTS
"""
import logging
import pyttsx3
import threading
import queue
from typing import Optional
from src.utils.config import Config


class TTSManager:
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Initialize the TTS engine
        self.engine = pyttsx3.init()

        # Configure TTS settings
        self._configure_tts_engine()

        # Thread management
        self.current_speech_thread = None
        self.speech_queue = queue.Queue()
        self._stop_event = threading.Event()

    def _configure_tts_engine(self):
        """
        Configure the TTS engine with appropriate settings
        """
        try:
            # Set speech rate (words per minute)
            self.engine.setProperty('rate', 180)  # Default: 200

            # Set volume (0.0 to 1.0)
            self.engine.setProperty('volume', 0.9)  # Default: 1.0

            # Set voice (if available)
            voices = self.engine.getProperty('voices')
            if voices:
                # Use female voice if available, otherwise use the first one
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        self.engine.setProperty('voice', voice.id)
                        break
                else:
                    self.engine.setProperty('voice', voices[0].id)

        except Exception as e:
            self.logger.error(f"Error configuring TTS engine: {e}")

    def speak_text(self, text: str):
        """
        Speak the given text synchronously
        """
        if not text:
            self.logger.warning("Empty text provided to speak_text")
            return

        self.logger.info(f"Speaking: {text}")

        try:
            # Stop any currently speaking text
            self.engine.stop()

            # Queue the text to be spoken
            self.engine.say(text)

            # Run the event loop to speak the text
            self.engine.runAndWait()

        except Exception as e:
            self.logger.error(f"Error speaking text: {e}")

    def speak_text_async(self, text: str):
        """
        Speak text asynchronously in a separate thread with resource management
        """
        if not text:
            self.logger.warning("Empty text provided to speak_text_async")
            return

        self.logger.info(f"Speaking asynchronously: {text}")

        # Stop any currently running speech thread
        if self.current_speech_thread and self.current_speech_thread.is_alive():
            self._stop_event.set()
            self.current_speech_thread.join(timeout=1.0)  # Wait up to 1 second

        # Clear the stop event for the new thread
        self._stop_event.clear()

        # Create a new thread for speaking
        self.current_speech_thread = threading.Thread(
            target=self._speak_in_thread,
            args=(text,),
            daemon=True
        )
        self.current_speech_thread.start()

    def _speak_in_thread(self, text: str):
        """
        Internal method to handle speech in a thread with proper resource management
        """
        try:
            # Use the shared engine (engine is thread-safe for our use case)
            self.engine.stop()  # Stop any current speech
            self.engine.say(text)

            # Check if stop was requested before starting to speak
            if not self._stop_event.is_set():
                self.engine.runAndWait()
        except Exception as e:
            self.logger.error(f"Error in async TTS thread: {e}")

    def interrupt_speech(self):
        """
        Interrupt any ongoing speech
        """
        try:
            self.engine.stop()
            self._stop_event.set()
            self.logger.info("Interrupted ongoing speech")
        except Exception as e:
            self.logger.error(f"Error interrupting speech: {e}")

    def set_voice(self, voice_index: int = 0):
        """
        Set the voice to use for TTS
        """
        try:
            voices = self.engine.getProperty('voices')
            if voices and 0 <= voice_index < len(voices):
                self.engine.setProperty('voice', voices[voice_index].id)
                self.logger.info(f"Voice changed to: {voices[voice_index].name}")
            else:
                self.logger.warning(f"Invalid voice index: {voice_index}")
        except Exception as e:
            self.logger.error(f"Error setting voice: {e}")

    def set_rate(self, rate: int):
        """
        Set the speech rate (words per minute)
        """
        try:
            self.engine.setProperty('rate', rate)
            self.logger.info(f"Speech rate set to: {rate}")
        except Exception as e:
            self.logger.error(f"Error setting speech rate: {e}")

    def set_volume(self, volume: float):
        """
        Set the speech volume (0.0 to 1.0)
        """
        try:
            self.engine.setProperty('volume', volume)
            self.logger.info(f"Volume set to: {volume}")
        except Exception as e:
            self.logger.error(f"Error setting volume: {e}")

    def stop_speaking(self):
        """
        Stop any ongoing speech
        """
        try:
            self.engine.stop()
            self._stop_event.set()
            self.logger.info("Stopped ongoing speech")
        except Exception as e:
            self.logger.error(f"Error stopping speech: {e}")

    def get_available_voices(self):
        """
        Get list of available voices
        """
        try:
            voices = self.engine.getProperty('voices')
            return [(i, voice.name) for i, voice in enumerate(voices)]
        except Exception as e:
            self.logger.error(f"Error getting available voices: {e}")
            return []

    def cleanup(self):
        """
        Clean up resources used by the TTS manager
        """
        try:
            # Stop any ongoing speech
            self.engine.stop()

            # Wait for any current thread to finish
            if self.current_speech_thread and self.current_speech_thread.is_alive():
                self.current_speech_thread.join(timeout=1.0)

            self.logger.info("TTS resources cleaned up")
        except Exception as e:
            self.logger.error(f"Error during TTS cleanup: {e}")

    def __del__(self):
        """
        Destructor to ensure cleanup
        """
        try:
            self.cleanup()
        except:
            pass  # Ignore errors during destruction