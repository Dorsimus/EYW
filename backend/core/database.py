"""
Core database module for flightbook API
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
database = client[os.environ['DB_NAME']]

async def get_database():
    """Dependency to get database instance"""
    return database

async def close_database():
    """Close database connection"""
    if client:
        client.close()