#!/usr/bin/env python3
"""
Simplified FastAPI server for database connectivity testing
Bypasses AI service dependencies temporarily
"""

from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

if not mongo_url or not db_name:
    raise ValueError("MONGO_URL and DB_NAME environment variables are required")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app
app = FastAPI(title="Navigator API - Database Test Version")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, be more specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    database: Dict[str, Any]

class DatabaseStats(BaseModel):
    connected: bool
    database_name: str
    collections_count: int
    server_version: str

@api_router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "API is running"
    }

@api_router.get("/health/database")
async def database_health():
    """Database-specific health check"""
    try:
        # Test basic connectivity
        server_info = await client.server_info()
        
        # Get database stats
        collections = await db.list_collection_names()
        
        # Test a simple operation
        test_collection = db.health_check
        await test_collection.replace_one(
            {"_id": "health_check"}, 
            {"timestamp": datetime.utcnow(), "status": "healthy"},
            upsert=True
        )
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "connected": True,
                "database_name": db_name,
                "server_version": server_info.get("version", "unknown"),
                "collections_count": len(collections),
                "collections": collections
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "database": {
                    "connected": False,
                    "database_name": db_name
                }
            }
        )

@api_router.get("/collections")
async def get_collections():
    """List all collections in the database"""
    try:
        collections = await db.list_collection_names()
        collection_stats = {}
        
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            collection_stats[collection_name] = {
                "document_count": count,
                "estimated_size": await collection.estimated_document_count()
            }
        
        return {
            "database_name": db_name,
            "collections": collection_stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collections/{collection_name}/sample")
async def get_collection_sample(collection_name: str, limit: int = 5):
    """Get a sample of documents from a collection"""
    try:
        collection = db[collection_name]
        documents = []
        
        async for doc in collection.find().limit(limit):
            # Convert ObjectId to string for JSON serialization
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            documents.append(doc)
        
        return {
            "collection": collection_name,
            "sample_size": len(documents),
            "documents": documents
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/test-connection")
async def test_database_connection():
    """Comprehensive database connection test"""
    try:
        # Test 1: Server info
        server_info = await client.server_info()
        
        # Test 2: Database operations
        test_collection = db.connection_test
        test_doc = {
            "_id": "connection_test",
            "timestamp": datetime.utcnow(),
            "test_type": "api_connection_test"
        }
        
        # Insert/update
        await test_collection.replace_one(
            {"_id": "connection_test"}, 
            test_doc,
            upsert=True
        )
        
        # Read back
        retrieved = await test_collection.find_one({"_id": "connection_test"})
        
        # Clean up
        await test_collection.delete_one({"_id": "connection_test"})
        
        return {
            "status": "success",
            "tests": {
                "server_connection": True,
                "database_write": True,
                "database_read": retrieved is not None,
                "database_delete": True
            },
            "server_info": {
                "version": server_info.get("version"),
                "max_bson_object_size": server_info.get("maxBsonObjectSize"),
                "max_message_size_bytes": server_info.get("maxMessageSizeBytes")
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "tests": {
                "server_connection": False,
                "database_write": False,
                "database_read": False,
                "database_delete": False
            }
        }

# Add the API router to the app
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Navigator API - Database Test Version",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "database_health": "/api/health/database",
            "collections": "/api/collections",
            "test_connection": "/api/test-connection"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)