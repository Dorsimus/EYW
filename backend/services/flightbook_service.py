from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from models.flightbook import FlightbookEntry, FlightbookEntryCreate, FlightbookEntryUpdate, FlightbookVersionHistory

class FlightbookService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.flightbook_collection = database.flightbook_entries
        self.users_collection = database.users

    async def create_entry(self, user_id: str, entry_data: FlightbookEntryCreate) -> Dict[str, Any]:
        """Create a new flightbook entry"""
        # Convert Pydantic model to dictionary
        entry_dict = entry_data.dict()
        
        # Add metadata
        entry_dict['user_id'] = user_id
        entry_dict['created_at'] = datetime.utcnow()
        entry_dict['updated_at'] = datetime.utcnow()
        entry_dict['version'] = 1
        
        # Initialize version history
        entry_dict['version_history'] = [
            {
                'version': 1,
                'content': entry_data.content,
                'updated_at': entry_dict['created_at'],
                'change_summary': 'Initial version'
            }
        ]
        
        # Generate entry_key for journal context if not provided
        if not entry_dict.get('entry_key') and entry_dict.get('competency_area') and entry_dict.get('sub_competency') and entry_dict.get('task_id'):
            entry_dict['entry_key'] = f"{entry_dict['competency_area']}_{entry_dict['sub_competency']}_{entry_dict['task_id']}"
        
        # Insert into database
        result = await self.flightbook_collection.insert_one(entry_dict)
        entry_dict['_id'] = result.inserted_id
        
        # Convert ObjectId to string for response
        entry_dict['id'] = str(entry_dict['_id'])
        
        return entry_dict

    async def get_entries_paginated(
        self, 
        user_id: str,
        filters: Dict[str, Any] = None,
        page: int = 1, 
        limit: int = 50
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get paginated flightbook entries with filtering"""
        skip = (page - 1) * limit
        
        # Build filter criteria
        query_filters = {'user_id': user_id}
        if filters:
            query_filters.update(filters)
        
        # Get total count for pagination
        total_count = await self.flightbook_collection.count_documents(query_filters)
        
        # Get entries with pagination
        cursor = self.flightbook_collection.find(query_filters).sort([
            ('updated_at', DESCENDING),
            ('created_at', DESCENDING)
        ]).skip(skip).limit(limit)
        
        entries = []
        async for entry in cursor:
            entry['id'] = str(entry['_id'])
            entries.append(entry)
        
        return entries, total_count

    async def get_entry_by_id(self, entry_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific flightbook entry by ID"""
        try:
            object_id = ObjectId(entry_id)
        except InvalidId:
            return None
        
        entry = await self.flightbook_collection.find_one({
            '_id': object_id,
            'user_id': user_id
        })
        
        if entry:
            entry['id'] = str(entry['_id'])
        
        return entry

    async def get_entry_by_key(self, entry_key: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a flightbook entry by its entry_key (for journal context)"""
        entry = await self.flightbook_collection.find_one({
            'entry_key': entry_key,
            'user_id': user_id
        })
        
        if entry:
            entry['id'] = str(entry['_id'])
        
        return entry

    async def update_entry(
        self, 
        entry_id: str, 
        user_id: str, 
        update_data: FlightbookEntryUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update an existing flightbook entry with versioning"""
        try:
            object_id = ObjectId(entry_id)
        except InvalidId:
            return None
        
        # Get current entry for version history
        current_entry = await self.flightbook_collection.find_one({
            '_id': object_id,
            'user_id': user_id
        })
        
        if not current_entry:
            return None
        
        # Only update fields that were provided
        update_dict = update_data.dict(exclude_unset=True)
        
        # Check if content actually changed
        if 'content' in update_dict:
            if current_entry.get('content') == update_dict['content']:
                # No change in content, return current entry
                current_entry['id'] = str(current_entry['_id'])
                return current_entry
            
            # Content changed, add to version history
            new_version = len(current_entry.get('version_history', [])) + 1
            version_entry = {
                'version': new_version,
                'content': update_dict['content'],
                'updated_at': datetime.utcnow(),
                'change_summary': 'Updated via API'
            }
            
            # Add to version history
            update_dict['version'] = new_version
            update_dict['$push'] = {'version_history': version_entry}
        
        update_dict['updated_at'] = datetime.utcnow()
        
        result = await self.flightbook_collection.find_one_and_update(
            {'_id': object_id, 'user_id': user_id},
            {'$set': {k: v for k, v in update_dict.items() if k != '$push'}} | 
            ({'$push': update_dict['$push']} if '$push' in update_dict else {}),
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result

    async def create_or_update_by_key(
        self, 
        user_id: str, 
        entry_key: str, 
        entry_data: FlightbookEntryCreate
    ) -> Dict[str, Any]:
        """Create or update flightbook entry by entry_key (for journal reflections)"""
        # Check if entry with this key already exists
        existing_entry = await self.get_entry_by_key(entry_key, user_id)
        
        if existing_entry:
            # Update existing entry if content changed
            if existing_entry.get('content') != entry_data.content:
                update_data = FlightbookEntryUpdate(
                    title=entry_data.title,
                    content=entry_data.content,
                    tags=entry_data.tags
                )
                
                updated_entry = await self.update_entry(
                    existing_entry['id'],
                    user_id,
                    update_data
                )
                return updated_entry
            else:
                return existing_entry
        else:
            # Create new entry
            entry_dict = entry_data.dict()
            entry_dict['entry_key'] = entry_key
            
            create_data = FlightbookEntryCreate(**entry_dict)
            return await self.create_entry(user_id, create_data)

    async def delete_entry(self, entry_id: str, user_id: str) -> bool:
        """Delete a flightbook entry"""
        try:
            object_id = ObjectId(entry_id)
        except InvalidId:
            return False
        
        result = await self.flightbook_collection.delete_one({
            '_id': object_id,
            'user_id': user_id
        })
        
        return result.deleted_count > 0

    async def get_entries_by_competency(
        self, 
        user_id: str, 
        competency_area: str,
        sub_competency: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all entries for a specific competency area"""
        query_filters = {
            'user_id': user_id,
            'competency_area': competency_area
        }
        
        if sub_competency:
            query_filters['sub_competency'] = sub_competency
        
        cursor = self.flightbook_collection.find(query_filters).sort([
            ('updated_at', DESCENDING)
        ])
        
        entries = []
        async for entry in cursor:
            entry['id'] = str(entry['_id'])
            entries.append(entry)
        
        return entries

    async def search_entries(
        self, 
        user_id: str, 
        search_text: str,
        tags: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Search flightbook entries by text and tags"""
        query_filters = {'user_id': user_id}
        
        # Text search
        if search_text:
            query_filters['$or'] = [
                {'title': {'$regex': search_text, '$options': 'i'}},
                {'content': {'$regex': search_text, '$options': 'i'}},
                {'original_prompt': {'$regex': search_text, '$options': 'i'}}
            ]
        
        # Tag filtering
        if tags:
            query_filters['tags'] = {'$in': tags}
        
        cursor = self.flightbook_collection.find(query_filters).sort([
            ('updated_at', DESCENDING)
        ])
        
        entries = []
        async for entry in cursor:
            entry['id'] = str(entry['_id'])
            entries.append(entry)
        
        return entries

    async def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive flightbook statistics"""
        # Total entries
        total_entries = await self.flightbook_collection.count_documents({'user_id': user_id})
        
        # Entries by competency
        competency_pipeline = [
            {'$match': {'user_id': user_id}},
            {'$group': {'_id': '$competency_area', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        competency_results = await self.flightbook_collection.aggregate(competency_pipeline).to_list(None)
        entries_by_competency = {result['_id']: result['count'] for result in competency_results}
        
        # Entries by type
        type_pipeline = [
            {'$match': {'user_id': user_id}},
            {'$group': {'_id': '$entry_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        type_results = await self.flightbook_collection.aggregate(type_pipeline).to_list(None)
        entries_by_type = {result['_id']: result['count'] for result in type_results}
        
        # Entries by month (last 12 months)
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        monthly_pipeline = [
            {'$match': {'user_id': user_id, 'created_at': {'$gte': twelve_months_ago}}},
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$created_at'},
                        'month': {'$month': '$created_at'}
                    },
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id.year': 1, '_id.month': 1}}
        ]
        monthly_results = await self.flightbook_collection.aggregate(monthly_pipeline).to_list(None)
        entries_by_month = {
            f"{result['_id']['year']}-{result['_id']['month']:02d}": result['count'] 
            for result in monthly_results
        }
        
        # Most used tags
        tags_pipeline = [
            {'$match': {'user_id': user_id}},
            {'$unwind': '$tags'},
            {'$group': {'_id': '$tags', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        tags_results = await self.flightbook_collection.aggregate(tags_pipeline).to_list(None)
        most_used_tags = [{'tag': result['_id'], 'count': result['count']} for result in tags_results]
        
        # Recent activity (last 10 entries)
        recent_cursor = self.flightbook_collection.find({'user_id': user_id}).sort([
            ('updated_at', DESCENDING)
        ]).limit(10)
        
        recent_activity = []
        async for entry in recent_cursor:
            recent_activity.append({
                'id': str(entry['_id']),
                'title': entry['title'][:50] + '...' if len(entry['title']) > 50 else entry['title'],
                'competency_area': entry['competency_area'],
                'entry_type': entry['entry_type'],
                'updated_at': entry['updated_at']
            })
        
        # Version history count
        version_history_pipeline = [
            {'$match': {'user_id': user_id}},
            {'$project': {'version_history_count': {'$size': '$version_history'}}},
            {'$group': {'_id': None, 'total_versions': {'$sum': '$version_history_count'}}}
        ]
        version_results = await self.flightbook_collection.aggregate(version_history_pipeline).to_list(1)
        version_history_count = version_results[0]['total_versions'] if version_results else 0
        
        return {
            'total_entries': total_entries,
            'entries_by_competency': entries_by_competency,
            'entries_by_type': entries_by_type,
            'entries_by_month': entries_by_month,
            'most_used_tags': most_used_tags,
            'recent_activity': recent_activity,
            'version_history_count': version_history_count
        }

    async def bulk_create_entries(self, user_id: str, entries_data: List[FlightbookEntryCreate]) -> Dict[str, Any]:
        """Bulk create flightbook entries for migration"""
        results = {
            'success': True,
            'processed': 0,
            'errors': [],
            'created_entries': []
        }
        
        for entry_data in entries_data:
            try:
                created_entry = await self.create_entry(user_id, entry_data)
                results['created_entries'].append(created_entry)
                results['processed'] += 1
            except Exception as e:
                results['success'] = False
                results['errors'].append(f"Failed to create entry '{entry_data.title}': {str(e)}")
        
        return results