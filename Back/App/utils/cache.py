"""
Simple in-memory caching utilities
Provides LRU cache decorators for frequently accessed data
"""
from functools import lru_cache, wraps
from datetime import datetime, timedelta
from typing import Any, Callable
import hashlib
import json

# Simple time-based cache
_time_cache = {}
_cache_timestamps = {}

def timed_cache(seconds: int = 300):
    """
    Cache decorator with time-based expiration
    Args:
        seconds: Cache duration in seconds (default 5 minutes)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{hash_args(args, kwargs)}"
            current_time = datetime.now()
            
            # Check if cached value exists and is not expired
            if cache_key in _time_cache:
                cached_time = _cache_timestamps.get(cache_key)
                if cached_time and (current_time - cached_time).total_seconds() < seconds:
                    return _time_cache[cache_key]
            
            # Call function and cache result
            result = func(*args, **kwargs)
            _time_cache[cache_key] = result
            _cache_timestamps[cache_key] = current_time
            
            return result
        
        # Add cache clearing method
        wrapper.clear_cache = lambda: _time_cache.clear()
        return wrapper
    
    return decorator

def hash_args(args, kwargs) -> str:
    """Create a hash from function arguments"""
    try:
        # Convert args and kwargs to JSON string for hashing
        args_str = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
        return hashlib.md5(args_str.encode()).hexdigest()
    except:
        # Fallback to simple string representation
        return str(hash((args, tuple(sorted(kwargs.items())))))

# Pre-configured cache decorators for common use cases
dashboard_cache = timed_cache(seconds=300)  # 5 minutes for dashboards
stats_cache = timed_cache(seconds=600)      # 10 minutes for statistics
sentiment_cache = timed_cache(seconds=900)  # 15 minutes for sentiment analysis

# LRU cache for frequently accessed data
@lru_cache(maxsize=100)
def cached_course_lookup(course_id: int):
    """Cached course lookup - clear when courses are modified"""
    from database.connection import get_db
    from sqlalchemy import text
    
    db = next(get_db())
    result = db.execute(
        text("SELECT * FROM courses WHERE id = :id"),
        {"id": course_id}
    )
    course = result.fetchone()
    db.close()
    return dict(course._mapping) if course else None

@lru_cache(maxsize=200)
def cached_user_lookup(user_id: int):
    """Cached user lookup - clear when users are modified"""
    from database.connection import get_db
    from sqlalchemy import text
    
    db = next(get_db())
    result = db.execute(
        text("SELECT id, email, first_name, last_name, role FROM users WHERE id = :id"),
        {"id": user_id}
    )
    user = result.fetchone()
    db.close()
    return dict(user._mapping) if user else None

def clear_all_caches():
    """Clear all caches - call when data is modified"""
    _time_cache.clear()
    _cache_timestamps.clear()
    cached_course_lookup.cache_clear()
    cached_user_lookup.cache_clear()
    print("[CACHE] All caches cleared")

def get_cache_stats():
    """Get statistics about cache usage"""
    return {
        "time_cache_size": len(_time_cache),
        "course_cache_info": cached_course_lookup.cache_info()._asdict(),
        "user_cache_info": cached_user_lookup.cache_info()._asdict(),
    }
