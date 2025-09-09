"""
Navigator Level Performance Middleware
Response compression, caching, and performance optimization middleware
"""

import time
import gzip
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import logging
import asyncio
from functools import wraps
import redis
import os

logger = logging.getLogger(__name__)

class ResponseCompressionMiddleware(BaseHTTPMiddleware):
    """Middleware for response compression to improve API performance"""
    
    def __init__(self, app, minimum_size: int = 1024):
        super().__init__(app)
        self.minimum_size = minimum_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Check if compression is supported and beneficial
        if (
            "gzip" in request.headers.get("accept-encoding", "") and
            hasattr(response, "body") and
            len(response.body) > self.minimum_size and
            response.headers.get("content-encoding") is None
        ):
            # Compress response body
            compressed_body = gzip.compress(response.body)
            
            # Only use compression if it actually reduces size
            if len(compressed_body) < len(response.body):
                response.body = compressed_body
                response.headers["content-encoding"] = "gzip"
                response.headers["content-length"] = str(len(compressed_body))
        
        return response

class PerformanceTimingMiddleware(BaseHTTPMiddleware):
    """Middleware to track API response times and performance metrics"""
    
    def __init__(self, app):
        super().__init__(app)
        self.performance_metrics = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        process_time = time.time() - start_time
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))  # milliseconds
        response.headers["X-Timestamp"] = datetime.utcnow().isoformat()
        
        # Log slow requests
        if process_time > 1.0:  # Log requests taking more than 1 second
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
        
        # Store metrics for monitoring
        endpoint = f"{request.method} {request.url.path}"
        if endpoint not in self.performance_metrics:
            self.performance_metrics[endpoint] = []
        
        self.performance_metrics[endpoint].append({
            'response_time': process_time,
            'timestamp': datetime.utcnow(),
            'status_code': response.status_code
        })
        
        # Keep only last 100 measurements per endpoint
        if len(self.performance_metrics[endpoint]) > 100:
            self.performance_metrics[endpoint] = self.performance_metrics[endpoint][-100:]
        
        return response
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics for all endpoints"""
        stats = {}
        
        for endpoint, measurements in self.performance_metrics.items():
            if measurements:
                response_times = [m['response_time'] for m in measurements]
                stats[endpoint] = {
                    'avg_response_time': sum(response_times) / len(response_times),
                    'min_response_time': min(response_times),
                    'max_response_time': max(response_times),
                    'total_requests': len(measurements),
                    'recent_requests': len([m for m in measurements if m['timestamp'] > datetime.utcnow() - timedelta(minutes=5)])
                }
        
        return stats

class ResponseCacheMiddleware(BaseHTTPMiddleware):
    """Middleware for caching API responses to improve performance"""
    
    def __init__(self, app, cache_ttl: int = 300):  # 5 minutes default TTL
        super().__init__(app)
        self.cache_ttl = cache_ttl
        self.cache = {}  # In-memory cache for simplicity
        self.cache_stats = {'hits': 0, 'misses': 0}
        
        # Cacheable endpoints (GET requests only)
        self.cacheable_endpoints = {
            '/api/competencies',
            '/api/tasks',
            '/api/health'
        }
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key for request"""
        # Include method, path, and query parameters
        key_data = f"{request.method}:{request.url.path}:{request.url.query}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _is_cacheable(self, request: Request, response: Response) -> bool:
        """Check if request/response is cacheable"""
        return (
            request.method == "GET" and
            request.url.path in self.cacheable_endpoints and
            response.status_code == 200 and
            "no-cache" not in request.headers.get("cache-control", "")
        )
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        cache_key = self._generate_cache_key(request)
        
        # Check cache for GET requests to cacheable endpoints
        if request.method == "GET" and request.url.path in self.cacheable_endpoints:
            cached_response = self.cache.get(cache_key)
            
            if cached_response and cached_response['expires'] > datetime.utcnow():
                # Cache hit
                self.cache_stats['hits'] += 1
                response = JSONResponse(
                    content=cached_response['content'],
                    status_code=cached_response['status_code'],
                    headers=cached_response['headers']
                )
                response.headers["X-Cache"] = "HIT"
                return response
        
        # Cache miss - process request
        self.cache_stats['misses'] += 1
        response = await call_next(request)
        
        # Cache successful responses
        if self._is_cacheable(request, response) and hasattr(response, 'body'):
            try:
                content = json.loads(response.body.decode())
                self.cache[cache_key] = {
                    'content': content,
                    'status_code': response.status_code,
                    'headers': dict(response.headers),
                    'expires': datetime.utcnow() + timedelta(seconds=self.cache_ttl)
                }
            except (json.JSONDecodeError, UnicodeDecodeError):
                # Skip caching if response is not JSON
                pass
        
        response.headers["X-Cache"] = "MISS"
        return response
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = (self.cache_stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'cache_hits': self.cache_stats['hits'],
            'cache_misses': self.cache_stats['misses'],
            'hit_rate_percent': round(hit_rate, 1),
            'cached_items': len(self.cache),
            'cache_size_mb': sum(len(str(item).encode()) for item in self.cache.values()) / 1024 / 1024
        }
    
    def clear_cache(self):
        """Clear all cached responses"""
        self.cache.clear()
        logger.info("Response cache cleared")

# Decorator for caching expensive function calls
def cache_result(ttl_seconds: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        cache = {}
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Check cache
            if cache_key in cache:
                cached_data, expires = cache[cache_key]
                if datetime.utcnow() < expires:
                    return cached_data
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache[cache_key] = (result, datetime.utcnow() + timedelta(seconds=ttl_seconds))
            
            # Cleanup old cache entries
            current_time = datetime.utcnow()
            expired_keys = [k for k, (_, exp) in cache.items() if current_time >= exp]
            for key in expired_keys:
                del cache[key]
            
            return result
        
        return wrapper
    return decorator

class DatabaseQueryOptimizer:
    """Database query optimization utilities"""
    
    @staticmethod
    def optimize_aggregation_pipeline(pipeline: list) -> list:
        """Optimize MongoDB aggregation pipeline for better performance"""
        optimized_pipeline = []
        
        # Add $match stages early to reduce document processing
        match_stages = [stage for stage in pipeline if '$match' in stage]
        other_stages = [stage for stage in pipeline if '$match' not in stage]
        
        # Put match stages first
        optimized_pipeline.extend(match_stages)
        optimized_pipeline.extend(other_stages)
        
        # Add indexes hint if beneficial
        if match_stages:
            # This would be implemented based on specific query patterns
            pass
        
        return optimized_pipeline
    
    @staticmethod
    def create_efficient_query(collection_name: str, filters: dict, sort: dict = None, limit: int = None) -> dict:
        """Create optimized query structure"""
        query = {
            'collection': collection_name,
            'filter': filters,
            'options': {}
        }
        
        if sort:
            query['options']['sort'] = sort
        
        if limit:
            query['options']['limit'] = limit
        
        # Add performance hints
        query['options']['hint'] = DatabaseQueryOptimizer._suggest_index(filters, sort)
        
        return query
    
    @staticmethod
    def _suggest_index(filters: dict, sort: dict = None) -> dict:
        """Suggest optimal index for query"""
        # Simple index suggestion based on filters and sort
        index_fields = []
        
        # Add filter fields to index
        for field in filters.keys():
            if field not in ['$and', '$or', '$nor']:
                index_fields.append((field, 1))
        
        # Add sort fields to index
        if sort:
            for field, direction in sort.items():
                if (field, direction) not in index_fields:
                    index_fields.append((field, direction))
        
        return dict(index_fields) if index_fields else {}

# Performance monitoring utilities
class PerformanceMonitor:
    """Performance monitoring and alerting"""
    
    def __init__(self):
        self.alerts = []
        self.thresholds = {
            'response_time_ms': 1000,  # 1 second
            'memory_usage_mb': 512,    # 512 MB
            'error_rate_percent': 5    # 5%
        }
    
    def check_performance_thresholds(self, metrics: Dict[str, Any]):
        """Check if performance metrics exceed thresholds"""
        alerts = []
        
        # Check response time
        if metrics.get('avg_response_time_ms', 0) > self.thresholds['response_time_ms']:
            alerts.append({
                'type': 'SLOW_RESPONSE',
                'message': f"Average response time {metrics['avg_response_time_ms']}ms exceeds threshold {self.thresholds['response_time_ms']}ms",
                'severity': 'WARNING',
                'timestamp': datetime.utcnow()
            })
        
        # Check memory usage
        if metrics.get('memory_usage_mb', 0) > self.thresholds['memory_usage_mb']:
            alerts.append({
                'type': 'HIGH_MEMORY',
                'message': f"Memory usage {metrics['memory_usage_mb']}MB exceeds threshold {self.thresholds['memory_usage_mb']}MB",
                'severity': 'WARNING',
                'timestamp': datetime.utcnow()
            })
        
        # Check error rate
        if metrics.get('error_rate_percent', 0) > self.thresholds['error_rate_percent']:
            alerts.append({
                'type': 'HIGH_ERROR_RATE',
                'message': f"Error rate {metrics['error_rate_percent']}% exceeds threshold {self.thresholds['error_rate_percent']}%",
                'severity': 'CRITICAL',
                'timestamp': datetime.utcnow()
            })
        
        self.alerts.extend(alerts)
        return alerts
    
    def get_recent_alerts(self, hours: int = 24) -> list:
        """Get alerts from the last N hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        return [alert for alert in self.alerts if alert['timestamp'] > cutoff_time]

# Global performance monitor instance
performance_monitor = PerformanceMonitor()