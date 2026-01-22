"""
Echo - Voice Controlled Command Runner
Main entry point for the application
"""

import asyncio
import logging
import signal
import sys
from src.listeners.audio_listener import AudioListener
from src.processors.speech_processor import SpeechProcessor
from src.processors.command_interpreter import CommandInterpreter
from src.responses.tts_manager import TTSManager
from src.utils.config import Config


def setup_logging():
    """Setup basic logging for the application"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


class EchoApplication:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = None
        self.tts_manager = None
        self.audio_listener = None
        self.speech_processor = None
        self.command_interpreter = None
        self.running = False

    async def initialize(self):
        """Initialize all components of the Echo application"""
        self.logger.info("Initializing Echo - Voice Controlled Assistant")

        # Load configuration
        self.config = Config()

        # Initialize components
        self.tts_manager = TTSManager(self.config)
        self.audio_listener = AudioListener(self.config)
        self.speech_processor = SpeechProcessor(self.config)
        self.command_interpreter = CommandInterpreter(self.config, self.tts_manager)

        # Verify initialization
        if not self.speech_processor._whisper_model:
            self.logger.error("Failed to initialize Whisper model. Please install openai-whisper.")
            return False

        return True

    async def start(self):
        """Start the Echo application"""
        self.running = True
        self.logger.info("Starting Echo application")

        # Greet the user
        self.tts_manager.speak_text_async("Echo is ready to listen.")

        try:
            # Start the main listening loop
            await self.audio_listener.start_listening(
                self.speech_processor,
                self.command_interpreter,
                self.tts_manager
            )
        except KeyboardInterrupt:
            self.logger.info("Received interrupt signal")
        except Exception as e:
            self.logger.error(f"Error in Echo application: {e}")
            raise

    async def shutdown(self):
        """Properly shut down all components"""
        self.logger.info("Shutting down Echo...")
        self.running = False

        # Stop any ongoing speech
        if self.tts_manager:
            self.tts_manager.stop_speaking()

        # Perform cleanup on all components
        if self.tts_manager:
            self.tts_manager.cleanup()

        self.logger.info("Echo has been shut down successfully")

    def signal_handler(self, signum, frame):
        """Handle system signals for graceful shutdown"""
        self.logger.info(f"Received signal {signum}, initiating shutdown...")
        # Since this runs in a signal handler, we can't use async functions here
        # We'll set a flag that will be checked in the main loop


async def main():
    """Main function to run the Echo application"""
    setup_logging()
    logger = logging.getLogger(__name__)

    app = EchoApplication()

    try:
        # Initialize the application
        if not await app.initialize():
            logger.error("Failed to initialize Echo application")
            return

        # Register signal handlers for graceful shutdown
        def signal_handler(signum, frame):
            app.signal_handler(signum, frame)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        # Start the application
        await app.start()

    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Error running Echo: {e}")
        raise
    finally:
        # Ensure cleanup happens
        await app.shutdown()


if __name__ == "__main__":
    asyncio.run(main())