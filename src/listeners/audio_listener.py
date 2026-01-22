"""
Audio listener module for Echo
Handles microphone input and audio recording
"""
import asyncio
import logging
import wave
import tempfile
import threading
from typing import Optional
import pyaudio
import numpy as np
from scipy import signal
from src.utils.config import Config


class AudioListener:
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.is_listening = False
        self.audio = pyaudio.PyAudio()

        # Audio stream parameters
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = self.config.sample_rate
        self.chunk = self.config.audio_chunk_size

        # Preprocessing parameters
        self.noise_floor = 0
        self.noise_samples = 0
        self.max_noise_samples = 100  # For adaptive noise floor calculation

    def _apply_audio_preprocessing(self, audio_data: np.ndarray) -> np.ndarray:
        """Apply preprocessing to improve audio quality"""
        # Apply noise reduction
        if self.noise_floor > 0:
            # Simple noise gating - suppress values below noise floor
            audio_data = np.where(np.abs(audio_data) > self.noise_floor, audio_data, 0)

        # Apply a simple low-pass filter to remove high-frequency noise
        nyquist = self.rate / 2.0
        cutoff = 3400.0  # Human voice typically below 3.4kHz
        normal_cutoff = cutoff / nyquist
        b, a = signal.butter(3, normal_cutoff, btype='low', analog=False)
        filtered_audio = signal.filtfilt(b, a, audio_data)

        # Normalize the audio to prevent clipping
        max_val = np.max(np.abs(filtered_audio))
        if max_val > 0:
            filtered_audio = filtered_audio / max_val * 0.8  # Reduce to 80% to prevent clipping

        return filtered_audio.astype(np.int16)

    def _update_noise_floor(self, audio_data: np.ndarray):
        """Update the noise floor estimate adaptively"""
        # Calculate RMS of current audio frame
        rms = np.sqrt(np.mean(audio_data**2))

        if self.noise_samples < self.max_noise_samples:
            self.noise_floor = ((self.noise_floor * self.noise_samples) + rms) / (self.noise_samples + 1)
            self.noise_samples += 1
        else:
            # Exponential moving average for adaptive noise floor
            alpha = 0.05  # Slow adaptation rate
            self.noise_floor = alpha * rms + (1 - alpha) * self.noise_floor

    def _is_silent(self, snd_data: bytes) -> bool:
        """Check if the audio data is below the silence threshold"""
        arr = np.frombuffer(snd_data, dtype=np.int16)
        avg_amplitude = np.mean(np.abs(arr))
        return avg_amplitude < (self.config.silence_threshold * 32768)

    def _record_audio(self) -> Optional[str]:
        """Record audio from microphone and save to temporary file"""
        self.logger.info("Recording audio...")

        frames = []
        silent_chunks = 0
        max_silent_chunks = self.config.sample_rate // self.config.audio_chunk_size  # 1 sec worth of chunks

        # Reset noise floor at the beginning of recording
        self.noise_floor = 0
        self.noise_samples = 0

        # Open audio stream
        stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.rate,
            input=True,
            frames_per_buffer=self.chunk
        )

        try:
            while self.is_listening:
                data = stream.read(self.chunk)

                # Convert to numpy array for preprocessing
                audio_array = np.frombuffer(data, dtype=np.int16)

                # Update noise floor estimate
                self._update_noise_floor(audio_array)

                # Apply preprocessing if needed
                processed_audio = self._apply_audio_preprocessing(audio_array)

                # Convert back to bytes
                processed_data = processed_audio.tobytes()

                frames.append(processed_data)

                # Check for silence to stop early
                if self._is_silent(processed_data):
                    silent_chunks += 1
                    if silent_chunks > max_silent_chunks:
                        break
                else:
                    silent_chunks = 0

                # Stop if we exceed max duration
                recorded_frames = len(frames)
                if recorded_frames * self.chunk > self.config.max_audio_duration * self.rate:
                    break

        except Exception as e:
            self.logger.error(f"Error during recording: {e}")
        finally:
            stream.stop_stream()
            stream.close()

        if not frames:
            return None

        # Save to temporary WAV file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_file.close()

        wf = wave.open(temp_file.name, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(self.audio.get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(frames))
        wf.close()

        self.logger.info(f"Audio recorded to: {temp_file.name}")
        return temp_file.name

    async def listen_for_audio(self) -> Optional[str]:
        """Listen for audio and return path to recorded file"""
        if self.is_listening:
            self.logger.warning("Already listening, ignoring request")
            return None

        self.is_listening = True
        try:
            return await asyncio.get_event_loop().run_in_executor(None, self._record_audio)
        finally:
            self.is_listening = False

    def start_manual_listen(self) -> Optional[str]:
        """Start listening manually (when user presses a key)"""
        self.logger.info("Manual listen triggered")
        self.is_listening = True
        return self._record_audio()

    async def start_listening(self, speech_processor, command_interpreter, tts_manager):
        """Start the main listening loop"""
        self.logger.info("Starting audio listener loop...")
        tts_manager.speak_text("Echo is ready to listen.")

        while True:
            try:
                # Record audio
                audio_file = await self.listen_for_audio()

                if audio_file:
                    # Process the audio to text
                    text = await speech_processor.process_audio(audio_file)

                    if text:
                        self.logger.info(f"Heard: {text}")

                        # Check for wake word and process command
                        if self.config.wake_word.lower() in text.lower():
                            command = text.lower().replace(self.config.wake_word.lower(), "").strip()
                            if command:
                                await command_interpreter.execute_command(command, tts_manager)
                        else:
                            self.logger.debug("Wake word not detected, ignoring audio")

                    # Clean up temp file
                    import os
                    if os.path.exists(audio_file):
                        os.unlink(audio_file)

                # Small delay to prevent excessive CPU usage
                await asyncio.sleep(0.1)

            except KeyboardInterrupt:
                self.logger.info("Stopping audio listener...")
                break
            except Exception as e:
                self.logger.error(f"Error in listening loop: {e}")
                await asyncio.sleep(1)  # Wait before retrying

    def reset_noise_floor(self):
        """Reset the noise floor estimation"""
        self.noise_floor = 0
        self.noise_samples = 0

    def __del__(self):
        """Clean up audio resources"""
        if hasattr(self, 'audio'):
            self.audio.terminate()