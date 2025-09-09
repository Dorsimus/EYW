"""
Enhanced FastAPI Server with Performance Optimizations
Production-ready server configuration with performance middleware
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

# Import performance middleware
from performance_middleware import (
    ResponseCompressionMiddleware,
    PerformanceTimingMiddleware,
    ResponseCacheMiddleware,
    performance_monitor
)

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/backend/performance.log')
    ]
)
logger = logging.getLogger(__name__)

# Global middleware instances for monitoring
timing_middleware = None
cache_middleware = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Navigator Level API starting with performance optimizations...")
    
    # Initialize performance monitoring
    logger.info("📊 Performance monitoring initialized")
    
    yield
    
    # Shutdown
    logger.info("🛑 Navigator Level API shutting down...")

def create_optimized_app() -> FastAPI:
    """Create FastAPI app with performance optimizations"""
    
    # Create app with optimized settings
    app = FastAPI(
        title="Navigator Level API - Performance Optimized",
        description="High-performance API for Navigator Level professional development",
        version="2.0.0",
        lifespan=lifespan,
        # Performance optimizations
        docs_url="/api/docs" if os.getenv("ENVIRONMENT") != "production" else None,
        redoc_url="/api/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
    )
    
    # Global middleware instances
    global timing_middleware, cache_middleware
    
    # Add performance middleware (order matters!)
    
    # 1. Response compression (should be last in chain)
    app.add_middleware(ResponseCompressionMiddleware, minimum_size=1024)
    
    # 2. Performance timing
    timing_middleware = PerformanceTimingMiddleware(app)
    app.add_middleware(PerformanceTimingMiddleware)
    
    # 3. Response caching
    cache_middleware = ResponseCacheMiddleware(app, cache_ttl=300)  # 5 minutes
    app.add_middleware(ResponseCacheMiddleware, cache_ttl=300)
    
    # 4. CORS (should be early in chain)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "https://localhost:3000",
            "https://prelaunch-check.preview.emergentagent.com"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    
    return app

# Create the optimized app
app = create_optimized_app()

# Performance monitoring endpoints
@app.get("/api/performance/stats")
async def get_performance_stats():
    """Get current performance statistics"""
    stats = {}
    
    if timing_middleware:
        stats['timing'] = timing_middleware.get_performance_stats()
    
    if cache_middleware:
        stats['cache'] = cache_middleware.get_cache_stats()
    
    stats['alerts'] = performance_monitor.get_recent_alerts(hours=1)
    
    return JSONResponse(content=stats)

@app.post("/api/performance/clear-cache")
async def clear_performance_cache():
    """Clear performance cache"""
    if cache_middleware:
        cache_middleware.clear_cache()
    
    return {"message": "Performance cache cleared successfully"}

@app.get("/api/performance/health")
async def performance_health_check():
    """Enhanced health check with performance metrics"""
    
    # Collect current performance metrics
    import psutil
    process = psutil.Process()
    
    memory_info = process.memory_info()
    cpu_percent = process.cpu_percent()
    
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "performance": {
            "memory_usage_mb": round(memory_info.rss / 1024 / 1024, 1),
            "memory_percent": round(process.memory_percent(), 1),
            "cpu_percent": round(cpu_percent, 1),
            "thread_count": process.num_threads(),
        },
        "cache_stats": cache_middleware.get_cache_stats() if cache_middleware else {},
        "recent_alerts": len(performance_monitor.get_recent_alerts(hours=1))
    }
    
    # Check performance thresholds
    alerts = performance_monitor.check_performance_thresholds({
        'avg_response_time_ms': 0,  # Would be calculated from recent requests
        'memory_usage_mb': health_data['performance']['memory_usage_mb'],
        'error_rate_percent': 0  # Would be calculated from recent requests
    })
    
    if alerts:
        health_data['status'] = 'degraded'
        health_data['alerts'] = alerts
    
    return JSONResponse(content=health_data)

# Import and include the main API routes
try:
    from server import api_router
    app.include_router(api_router)
    logger.info("✅ Main API routes included successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import main API routes: {e}")

# Custom exception handler for performance monitoring
@app.exception_handler(Exception)
async def performance_exception_handler(request: Request, exc: Exception):
    """Handle exceptions with performance monitoring"""
    
    # Log the exception
    logger.error(f"Exception in {request.method} {request.url.path}: {str(exc)}")
    
    # Add to performance monitoring
    performance_monitor.alerts.append({
        'type': 'EXCEPTION',
        'message': f"Exception in {request.method} {request.url.path}: {str(exc)}",
        'severity': 'ERROR',
        'timestamp': datetime.utcnow()
    })
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url.path)
        }
    )

if __name__ == "__main__":
    # Production-optimized uvicorn configuration
    uvicorn.run(
        "enhanced_server_performance:app",
        host="0.0.0.0",
        port=8001,
        # Performance optimizations
        workers=1,  # Single worker for development, increase for production
        loop="uvloop",  # Use uvloop for better performance
        http="httptools",  # Use httptools for better HTTP parsing
        # Logging
        log_level="info",
        access_log=True,
        # Connection settings
        limit_concurrency=1000,
        limit_max_requests=10000,
        timeout_keep_alive=5,
        # SSL settings (if needed)
        # ssl_keyfile="path/to/keyfile",
        # ssl_certfile="path/to/certfile",
    )