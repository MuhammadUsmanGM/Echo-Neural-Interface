"""
Cache module for Echo
Provides caching functionality for commands and responses
"""
import time
import hashlib
from typing import Any, Optional, Dict
from threading import Lock


class LRUCache:
    """
    Simple LRU Cache implementation for Echo
    """
    def __init__(self, capacity: int = 100, ttl: int = 300):  # 5 minutes default TTL
        self.capacity = capacity
        self.ttl = ttl
        self.cache = {}
        self.access_times = {}
        self.lock = Lock()

    def _is_expired(self, timestamp: float) -> bool:
        """Check if a cached item has expired"""
        return time.time() - timestamp > self.ttl

    def _make_key(self, *args, **kwargs) -> str:
        """Create a hash key from arguments"""
        key_str = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache"""
        with self.lock:
            if key in self.cache:
                if self._is_expired(self.access_times[key]):
                    del self.cache[key]
                    del self.access_times[key]
                    return None

                # Update access time
                self.access_times[key] = time.time()
                return self.cache[key]

            return None

    def put(self, key: str, value: Any):
        """Put a value in the cache"""
        with self.lock:
            # Remove expired entries
            current_time = time.time()
            expired_keys = [k for k, t in self.access_times.items() if self._is_expired(t)]
            for k in expired_keys:
                if k in self.cache:
                    del self.cache[k]
                    del self.access_times[k]

            # If cache is full, remove oldest entry
            if len(self.cache) >= self.capacity and key not in self.cache:
                oldest_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
                del self.cache[oldest_key]
                del self.access_times[oldest_key]

            # Add new entry
            self.cache[key] = value
            self.access_times[key] = current_time

    def clear(self):
        """Clear the entire cache"""
        with self.lock:
            self.cache.clear()
            self.access_times.clear()


class CommandCache:
    """
    Specialized cache for command interpretations and results
    """
    def __init__(self, capacity: int = 50, ttl: int = 600):  # 10 minutes TTL for commands
        self.interpretation_cache = LRUCache(capacity, ttl)
        self.result_cache = LRUCache(capacity, ttl)

    def get_cached_interpretation(self, command_text: str) -> Optional[Dict[str, Any]]:
        """Get cached command interpretation"""
        key = self._hash_command(command_text)
        return self.interpretation_cache.get(key)

    def cache_interpretation(self, command_text: str, interpretation: Dict[str, Any]):
        """Cache command interpretation"""
        key = self._hash_command(command_text)
        self.interpretation_cache.put(key, interpretation)

    def get_cached_result(self, command_hash: str) -> Optional[str]:
        """Get cached command result"""
        return self.result_cache.get(command_hash)

    def cache_result(self, command_hash: str, result: str):
        """Cache command result"""
        self.result_cache.put(command_hash, result)

    def _hash_command(self, command_text: str) -> str:
        """Hash a command for caching"""
        return hashlib.sha256(command_text.encode()).hexdigest()

    def clear(self):
        """Clear all caches"""
        self.interpretation_cache.clear()
        self.result_cache.clear()