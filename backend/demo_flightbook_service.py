"""
Demo Mode Flightbook Service
Handles flightbook operations for demo users without requiring Clerk authentication
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import json
from pathlib import Path

class DemoFlightbookService:
    """Service to handle flightbook operations for demo users"""
    
    def __init__(self, db):
        self.db = db
        self.demo_collection = db.demo_flightbook_entries
    
    async def create_demo_flightbook_entry(self, user_id: str, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a flightbook entry for demo users"""
        
        # Create entry with demo-specific structure
        entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": entry_data.get("title", "Task Completion Reflection"),
            "content": entry_data.get("content", ""),
            "competency_area": entry_data.get("competency_area", ""),
            "sub_competency": entry_data.get("sub_competency", ""),
            "entry_type": entry_data.get("entry_type", "task_completion"),
            "task_id": entry_data.get("task_id"),
            "task_title": entry_data.get("task_title", ""),
            "tags": entry_data.get("tags", []),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_demo": True,
            "version": 1
        }
        
        # Save to demo collection
        await self.demo_collection.insert_one(entry)
        
        return entry
    
    async def get_demo_flightbook_entries(self, user_id: str, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Get flightbook entries for demo user"""
        
        query = {"user_id": user_id, "is_demo": True}
        
        if filters:
            if filters.get("competency_area"):
                query["competency_area"] = filters["competency_area"]
            if filters.get("sub_competency"):
                query["sub_competency"] = filters["sub_competency"]
            if filters.get("entry_type"):
                query["entry_type"] = filters["entry_type"]
        
        entries = await self.demo_collection.find(query).sort("created_at", -1).to_list(100)
        
        return [self._serialize_entry(entry) for entry in entries]
    
    async def update_demo_flightbook_entry(self, entry_id: str, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a demo flightbook entry"""
        
        update_fields = {
            "updated_at": datetime.utcnow()
        }
        
        # Add allowed update fields
        allowed_fields = ["title", "content", "tags", "competency_area", "sub_competency"]
        for field in allowed_fields:
            if field in update_data:
                update_fields[field] = update_data[field]
        
        result = await self.demo_collection.update_one(
            {"id": entry_id, "user_id": user_id, "is_demo": True},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0:
            entry = await self.demo_collection.find_one({"id": entry_id, "user_id": user_id})
            return self._serialize_entry(entry)
        
        return None
    
    async def delete_demo_flightbook_entry(self, entry_id: str, user_id: str) -> bool:
        """Delete a demo flightbook entry"""
        
        result = await self.demo_collection.delete_one({
            "id": entry_id, 
            "user_id": user_id, 
            "is_demo": True
        })
        
        return result.deleted_count > 0
    
    def _serialize_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """Serialize MongoDB entry to JSON format"""
        if not entry:
            return None
            
        # Remove MongoDB _id and ensure consistent format
        serialized = {k: v for k, v in entry.items() if k != '_id'}
        
        # Ensure datetime objects are serialized
        for field in ['created_at', 'updated_at']:
            if field in serialized and isinstance(serialized[field], datetime):
                serialized[field] = serialized[field].isoformat()
        
        return serialized
    
    async def get_demo_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get statistics for demo user flightbook entries"""
        
        total_entries = await self.demo_collection.count_documents({
            "user_id": user_id, 
            "is_demo": True
        })
        
        # Get entries by competency area
        pipeline = [
            {"$match": {"user_id": user_id, "is_demo": True}},
            {"$group": {
                "_id": "$competency_area",
                "count": {"$sum": 1}
            }}
        ]
        
        competency_stats = {}
        async for result in self.demo_collection.aggregate(pipeline):
            competency_stats[result["_id"]] = result["count"]
        
        return {
            "total_entries": total_entries,
            "entries_by_competency": competency_stats,
            "last_updated": datetime.utcnow().isoformat()
        }