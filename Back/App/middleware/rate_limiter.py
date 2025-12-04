"""
Rate Limiting Middleware
Protects API endpoints from abuse using in-memory storage
"""
from fastapi import Request, HTTPException, status
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
import asyncio

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        # Store request timestamps: {ip: [(timestamp, endpoint), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 300  # Cleanup every 5 minutes
        self._cleanup_task = None
    
    def start_cleanup(self):
        """Start the periodic cleanup task"""
        if self._cleanup_task is None:
            try:
                self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            except RuntimeError:
                # No event loop running yet, will start on first request
                pass
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host
    
    def _cleanup_old_requests(self, ip: str, window_seconds: int):
        """Remove requests older than the time window"""
        cutoff_time = datetime.now() - timedelta(seconds=window_seconds)
        self.requests[ip] = [
            (timestamp, endpoint) 
            for timestamp, endpoint in self.requests[ip] 
            if timestamp > cutoff_time
        ]
    
    async def _periodic_cleanup(self):
        """Periodically clean up old requests to prevent memory bloat"""
        while True:
            await asyncio.sleep(self.cleanup_interval)
            cutoff_time = datetime.now() - timedelta(seconds=3600)  # Keep last hour
            for ip in list(self.requests.keys()):
                self.requests[ip] = [
                    (timestamp, endpoint)
                    for timestamp, endpoint in self.requests[ip]
                    if timestamp > cutoff_time
                ]
                if not self.requests[ip]:
                    del self.requests[ip]
    
    def is_rate_limited(
        self,
        request: Request,
        max_requests: int = 60,
        window_seconds: int = 60
    ) -> Tuple[bool, int]:
        """
        Check if request should be rate limited
        Returns: (is_limited, remaining_requests)
        """
        ip = self._get_client_ip(request)
        endpoint = request.url.path
        
        # Clean up old requests
        self._cleanup_old_requests(ip, window_seconds)
        
        # Count recent requests for this endpoint
        recent_requests = [
            timestamp for timestamp, ep in self.requests[ip]
            if ep == endpoint
        ]
        
        if len(recent_requests) >= max_requests:
            return True, 0
        
        # Add current request
        self.requests[ip].append((datetime.now(), endpoint))
        
        return False, max_requests - len(recent_requests) - 1

# Global rate limiter instance
rate_limiter = RateLimiter()

# Rate limit configurations for different endpoints
RATE_LIMITS = {
    "/api/auth/login": (5, 60),  # 5 requests per minute
    "/api/auth/forgot-password": (3, 300),  # 3 requests per 5 minutes
    "/api/auth/reset-password": (3, 300),  # 3 requests per 5 minutes
    "/api/auth/change-password": (5, 300),  # 5 requests per 5 minutes
    "/api/student/evaluations": (30, 60),  # 30 requests per minute
    "/api/admin/export": (10, 60),  # 10 requests per minute
    "default": (100, 60),  # Default: 100 requests per minute
}

async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to requests
    """
    # Start cleanup task on first request
    rate_limiter.start_cleanup()
    
    # Skip rate limiting for health check and root endpoints
    if request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)
    
    # Get rate limit for this endpoint
    endpoint = request.url.path
    max_requests, window = RATE_LIMITS.get(endpoint, RATE_LIMITS["default"])
    
    # Check rate limit
    is_limited, remaining = rate_limiter.is_rate_limited(
        request, max_requests, window
    )
    
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Please try again in {window} seconds.",
                "retry_after": window
            }
        )
    
    # Add rate limit headers to response
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(max_requests)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Window"] = str(window)
    
    return response
