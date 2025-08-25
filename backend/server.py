"""
Updated FastAPI Server for Earn Your Wings Platform
Integrates the new MongoDB schema with existing authentication and file handling
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from pathlib import Path
from datetime import datetime

# Import the database integration and new API routes
from database_integration import DatabaseManager, initialize_database
from api_routes import api_router, set_database_manager

# Import existing routers
from routers.flightbook import router as flightbook_router
from routers.project import router as project_router

# Import authentication and file utilities
from auth_utils import get_current_user, require_admin
from file_utils import (
    save_uploaded_file, validate_file, generate_secure_filename,
    get_file_storage_path, delete_file, format_file_size,
    PORTFOLIO_DIR, EVIDENCE_DIR, TEMP_DIR, UPLOAD_DIR
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database manager instance
db_manager: DatabaseManager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global db_manager
    
    # Startup
    logger.info("🚀 Starting Earn Your Wings Platform...")
    
    try:
        # Initialize database
        db_manager = await initialize_database()
        
        # Set database manager for API routes
        set_database_manager(db_manager)
        
        logger.info("✅ Application startup completed successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Application startup failed: {e}")
        raise e
    
    # Shutdown
    logger.info("🔌 Shutting down application...")
    if db_manager:
        await db_manager.close()
    logger.info("✅ Application shutdown completed")

# Create FastAPI application with lifespan management
app = FastAPI(
    title="Earn Your Wings Platform API",
    description="Leadership Development Platform with Competency Tracking",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Configure appropriately for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Earn Your Wings Platform API",
        "version": "2.0.0",
        "status": "running"
    }

# Include API routes
app.include_router(api_router)

# Include existing specialized routers
app.include_router(flightbook_router)
app.include_router(project_router)

# File serving endpoint (maintain existing functionality)
@app.get("/api/files/{file_type}/{file_id}")
async def serve_file(
    file_type: str, 
    file_id: str, 
    user_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Serve uploaded files with access control"""
    if file_type not in ["portfolio", "evidence", "project"]:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get user info from database
    user = await db_manager.user_service.get_user_by_clerk_id(current_user.get("sub"))
    if not user:
        raise HTTPException(status_code=403, detail="User not found")
    
    file_path = None
    original_filename = "download"
    
    # Handle different file types
    if file_type == "portfolio":
        item = await db_manager.portfolio_service.get_portfolio_item_by_id(file_id, user['id'])
        if not item:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check access permissions
        if item['user_id'] != user['id'] and not user.get('is_admin', False):
            if item['visibility'] == 'private':
                raise HTTPException(status_code=403, detail="Access denied")
        
        file_path = item.get("file_path")
        original_filename = item.get("original_filename", "portfolio_item")
        
    elif file_type == "evidence":
        # Get from task completions
        completions = await db_manager.competency_service.get_user_task_completions(user['id'])
        completion = next((c for c in completions if c.get('id') == file_id), None)
        
        if not completion or not completion.get('evidence_file_path'):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check access (own files or admin)
        if completion['user_id'] != user['id'] and not user.get('is_admin', False):
            raise HTTPException(status_code=403, detail="Access denied")
        
        file_path = completion['evidence_file_path']
        original_filename = f"evidence_{file_id}"
        
    elif file_type == "project":
        # Handle project files (if needed)
        project_files = await db_manager.project_service.get_project_files(user['id'], file_id)
        if not project_files:
            raise HTTPException(status_code=404, detail="File not found")
        
        # For now, return the first file (this can be enhanced)
        project_file = project_files[0]
        file_path = project_file.get("file_path")
        original_filename = project_file.get("original_filename", "project_file")
    
    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=original_filename,
        media_type='application/octet-stream'
    )

# Storage statistics endpoint
@app.get("/api/admin/storage/stats")
async def get_storage_stats(admin_user = Depends(require_admin)):
    """Get storage usage statistics (admin only)"""
    
    def get_directory_size(directory: Path) -> tuple[int, int]:
        """Get total size and file count of directory"""
        total_size = 0
        file_count = 0
        
        if directory.exists():
            for file_path in directory.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
                    file_count += 1
        
        return total_size, file_count
    
    # Define storage directories
    from server import PORTFOLIO_DIR, EVIDENCE_DIR, TEMP_DIR
    
    # Get stats for each directory
    portfolio_size, portfolio_files = get_directory_size(PORTFOLIO_DIR)
    evidence_size, evidence_files = get_directory_size(EVIDENCE_DIR)
    temp_size, temp_files = get_directory_size(TEMP_DIR)
    
    total_size = portfolio_size + evidence_size + temp_size
    total_files = portfolio_files + evidence_files + temp_files
    
    # Get database stats
    portfolio_stats = await db_manager.portfolio_service.get_portfolio_statistics()
    
    return {
        "total_storage_bytes": total_size,
        "total_storage_formatted": format_file_size(total_size),
        "total_files": total_files,
        "breakdown": {
            "portfolio": {
                "size_bytes": portfolio_size,
                "size_formatted": format_file_size(portfolio_size),
                "file_count": portfolio_files,
                "db_records": portfolio_stats['total_items']
            },
            "evidence": {
                "size_bytes": evidence_size,
                "size_formatted": format_file_size(evidence_size),
                "file_count": evidence_files
            },
            "temp": {
                "size_bytes": temp_size,
                "size_formatted": format_file_size(temp_size),
                "file_count": temp_files
            }
        },
        "constraints": {
            "max_file_size": "50 MB",
            "allowed_extensions": ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.mp4', '.txt'],
            "storage_backend": "Local Filesystem"
        }
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return {"error": "Endpoint not found", "status_code": 404}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    logger.error(f"Internal server error: {exc}")
    return {"error": "Internal server error", "status_code": 500}

# Health check with database connectivity
@app.get("/health")
async def detailed_health_check():
    """Detailed health check including database connectivity"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "components": {}
    }
    
    # Check database connectivity
    try:
        if db_manager and db_manager.db:
            await db_manager.db.command('ping')
            health_status["components"]["database"] = {
                "status": "healthy",
                "type": "MongoDB"
            }
        else:
            health_status["components"]["database"] = {
                "status": "unhealthy",
                "error": "Database manager not initialized"
            }
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    # Check file storage
    try:
        from server import UPLOAD_DIR
        if UPLOAD_DIR.exists():
            health_status["components"]["file_storage"] = {
                "status": "healthy",
                "path": str(UPLOAD_DIR)
            }
        else:
            health_status["components"]["file_storage"] = {
                "status": "degraded",
                "error": "Upload directory not found"
            }
    except Exception as e:
        health_status["components"]["file_storage"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        if health_status["status"] == "healthy":
            health_status["status"] = "degraded"
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server_new:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )