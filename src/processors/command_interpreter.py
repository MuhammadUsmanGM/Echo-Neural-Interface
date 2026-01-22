"""
Command interpreter module for Echo
Handles command understanding using local Ollama
"""
import asyncio
import logging
import json
import subprocess
import os
from typing import Dict, Any, Optional
from src.utils.config import Config
from src.responses.tts_manager import TTSManager
from src.utils.cache import CommandCache


class CommandInterpreter:
    def __init__(self, config: Config, tts_manager: TTSManager):
        self.config = config
        self.tts_manager = tts_manager
        self.logger = logging.getLogger(__name__)

        # Initialize command cache
        self.command_cache = CommandCache()

    async def execute_command(self, command_text: str, tts_manager: TTSManager):
        """
        Execute a command by interpreting it and performing the appropriate action
        """
        self.logger.info(f"Processing command: {command_text}")

        try:
            # Check if this command has been interpreted before
            cached_interpretation = self.command_cache.get_cached_interpretation(command_text)

            if cached_interpretation:
                self.logger.info("Using cached command interpretation")
                interpretation = cached_interpretation
            else:
                # Interpret the command using Ollama
                interpretation = await self.interpret_command(command_text)

                # Cache the interpretation if successful
                if interpretation:
                    self.command_cache.cache_interpretation(command_text, interpretation)

            if not interpretation:
                self.logger.warning("Could not interpret command")
                tts_manager.speak_text("Sorry, I didn't understand that command.")
                return

            # Validate the command is safe to execute
            if not self._is_safe_command(interpretation):
                self.logger.warning(f"Unsafe command blocked: {interpretation}")
                tts_manager.speak_text("That command is not allowed for safety reasons.")
                return

            # Generate a hash for the command to check for cached results
            command_hash = self._generate_command_hash(interpretation)

            # Check if we have a cached result for this specific command execution
            cached_result = self.command_cache.get_cached_result(command_hash)

            if cached_result:
                self.logger.info("Using cached command result")
                result = cached_result
            else:
                # Execute the interpreted command
                result = await self._execute_parsed_command(interpretation)

                # Cache the result if it's not a dynamic command
                if result and not self._is_dynamic_command(interpretation):
                    self.command_cache.cache_result(command_hash, result)

            if result:
                self.logger.info(f"Command executed successfully: {result}")
                tts_manager.speak_text(result)
            else:
                self.logger.warning("Command execution returned no result")
                tts_manager.speak_text("Command executed but returned no response.")

        except Exception as e:
            self.logger.error(f"Error executing command: {e}")
            tts_manager.speak_text("Sorry, there was an error processing your command.")

    def _is_dynamic_command(self, interpretation: Dict[str, Any]) -> bool:
        """
        Check if a command produces dynamic results that shouldn't be cached
        """
        action = interpretation.get("action")
        target = interpretation.get("target", "").lower()

        # Commands that should not be cached due to dynamic nature
        dynamic_actions = ["get_time", "get_date", "list_directory", "read_file"]
        dynamic_targets = ["time", "date", "now", "current", "directory", "folder"]

        return action in dynamic_actions or any(dt in target for dt in dynamic_targets)

    def _generate_command_hash(self, interpretation: Dict[str, Any]) -> str:
        """
        Generate a hash for a command to use as a cache key
        """
        import hashlib
        # Include action and target in the hash
        hash_input = f"{interpretation.get('action', '')}_{interpretation.get('target', '')}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    async def interpret_command(self, command_text: str) -> Optional[Dict[str, Any]]:
        """
        Interpret the command text using local Ollama
        """
        try:
            # Prepare the prompt for Ollama
            prompt = f"""
            You are a command parser for a voice assistant called Echo. Parse the following command and return a JSON object with the action and parameters.

            Command: "{command_text}"

            Possible actions:
            - "open_app": Open an application
            - "read_file": Read a file
            - "create_file": Create a file
            - "list_directory": List directory contents
            - "search_file": Search for files
            - "speak_response": Just speak a response
            - "get_time": Get the current time
            - "get_date": Get the current date

            Respond ONLY with a JSON object in this format:
            {{
                "action": "action_type",
                "target": "target_of_action",
                "params": {{}}
            }}

            For example:
            - Command: "open vs code" -> {{"action": "open_app", "target": "code", "params": {{}}}}
            - Command: "read file notes.txt" -> {{"action": "read_file", "target": "notes.txt", "params": {{}}}}
            - Command: "what time is it" -> {{"action": "get_time", "target": "", "params": {{}}}}
            - Command: "list files in current directory" -> {{"action": "list_directory", "target": ".", "params": {{}}}}
            """

            # Call Ollama to interpret the command
            result = await self._call_ollama(prompt)

            if result:
                # Extract JSON from the response
                json_start = result.find('{')
                json_end = result.rfind('}') + 1

                if json_start != -1 and json_end != 0:
                    json_str = result[json_start:json_end]
                    interpretation = json.loads(json_str)

                    self.logger.info(f"Command interpreted as: {interpretation}")
                    return interpretation
                else:
                    self.logger.warning(f"No JSON found in Ollama response: {result}")
                    return None
            else:
                self.logger.warning("Ollama returned no response")
                return None

        except json.JSONDecodeError as e:
            self.logger.error(f"Error parsing Ollama response as JSON: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Error interpreting command: {e}")
            return None

    async def _call_ollama(self, prompt: str) -> Optional[str]:
        """
        Call the local Ollama service to process the prompt
        """
        try:
            # Check if Ollama is running
            if not await self._check_ollama_running():
                self.logger.error("Ollama is not running. Please start Ollama first.")
                return None

            # Prepare the Ollama command with streaming disabled for better performance
            cmd = [
                "curl", "-X", "POST", f"{self.config.ollama_host}/api/generate",
                "-H", "Content-Type: application/json",
                "-d", json.dumps({
                    "model": self.config.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Lower temperature for more consistent outputs
                        "num_predict": 200    # Limit response length
                    }
                })
            ]

            # Execute the command
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                self.logger.error(f"Ollama API call failed: {stderr.decode()}")
                return None

            # Parse the response
            response = json.loads(stdout.decode())
            return response.get("response", "")

        except Exception as e:
            self.logger.error(f"Error calling Ollama: {e}")
            return None

    async def _check_ollama_running(self) -> bool:
        """
        Check if Ollama service is running
        """
        try:
            cmd = ["curl", "-s", f"{self.config.ollama_host}/api/tags"]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()

            return process.returncode == 0
        except Exception:
            return False

    def _is_safe_command(self, interpretation: Dict[str, Any]) -> bool:
        """
        Check if a command is safe to execute
        """
        action = interpretation.get("action")
        target = interpretation.get("target", "")

        # Check if the action is allowed
        if not self.config.is_allowed_command(action):
            self.logger.warning(f"Action not allowed: {action}")
            return False

        # For file operations, check if the path is safe
        if action in ["read_file", "create_file", "list_directory"]:
            if not self.config.is_safe_path(target):
                self.logger.warning(f"Unsafe path: {target}")
                return False

        # For opening applications, check if it's in the allowed list
        if action == "open_app":
            app_name = target.lower()
            if app_name not in self.config.allowed_apps:
                self.logger.warning(f"App not in allowed list: {app_name}")
                return False

        return True

    async def _execute_parsed_command(self, interpretation: Dict[str, Any]) -> Optional[str]:
        """
        Execute a parsed command
        """
        action = interpretation.get("action")
        target = interpretation.get("target", "")
        params = interpretation.get("params", {})

        if action == "open_app":
            return await self._execute_open_app(target)
        elif action == "read_file":
            return await self._execute_read_file(target)
        elif action == "create_file":
            return await self._execute_create_file(target, params.get("content", ""))
        elif action == "list_directory":
            return await self._execute_list_directory(target)
        elif action == "speak_response":
            return await self._execute_speak_response(target)
        elif action == "get_time":
            return await self._execute_get_time()
        elif action == "get_date":
            return await self._execute_get_date()
        else:
            self.logger.warning(f"Unknown action: {action}")
            return "Unknown action requested."

    async def _execute_open_app(self, app_name: str) -> Optional[str]:
        """
        Execute command to open an application
        """
        try:
            # Map common names to actual executable names
            app_mapping = {
                "vs code": "code",
                "visual studio code": "code",
                "notepad++": "notepad++",
                "chrome": "chrome",
                "firefox": "firefox",
                "calculator": "calc",
                "explorer": "explorer"
            }

            actual_app = app_mapping.get(app_name.lower(), app_name)

            # Use subprocess to open the application
            if os.name == 'nt':  # Windows
                subprocess.Popen([actual_app])
            else:  # Unix/Linux/Mac
                subprocess.Popen([actual_app])

            return f"Opening {app_name}."
        except Exception as e:
            self.logger.error(f"Error opening app {app_name}: {e}")
            return f"Sorry, I couldn't open {app_name}."

    async def _execute_read_file(self, file_path: str) -> Optional[str]:
        """
        Execute command to read a file
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

                # Limit the content length to avoid overwhelming the TTS
                if len(content) > 1000:
                    content = content[:1000] + "... (content truncated)"

                return f"Content of {file_path}: {content}"
        except FileNotFoundError:
            return f"File not found: {file_path}"
        except Exception as e:
            self.logger.error(f"Error reading file {file_path}: {e}")
            return f"Error reading file: {str(e)}"

    async def _execute_create_file(self, file_path: str, content: str) -> Optional[str]:
        """
        Execute command to create a file
        """
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            return f"Created file: {file_path}"
        except Exception as e:
            self.logger.error(f"Error creating file {file_path}: {e}")
            return f"Error creating file: {str(e)}"

    async def _execute_list_directory(self, dir_path: str) -> Optional[str]:
        """
        Execute command to list directory contents
        """
        try:
            if not dir_path:
                dir_path = "."

            items = os.listdir(dir_path)
            if len(items) > 20:  # Limit the number of items to avoid overwhelming response
                items = items[:20]
                result = f"Contents of {dir_path}: {', '.join(items)}. (Showing first 20 items)"
            else:
                result = f"Contents of {dir_path}: {', '.join(items)}"

            return result
        except Exception as e:
            self.logger.error(f"Error listing directory {dir_path}: {e}")
            return f"Error listing directory: {str(e)}"

    async def _execute_speak_response(self, response_text: str) -> Optional[str]:
        """
        Execute command to speak a response
        """
        return response_text

    async def _execute_get_time(self) -> Optional[str]:
        """
        Execute command to get the current time
        """
        import datetime
        current_time = datetime.datetime.now().strftime("%I:%M %p")
        return f"The current time is {current_time}."

    async def _execute_get_date(self) -> Optional[str]:
        """
        Execute command to get the current date
        """
        import datetime
        current_date = datetime.datetime.now().strftime("%B %d, %Y")
        return f"Today's date is {current_date}."