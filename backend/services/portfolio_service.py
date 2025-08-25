from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pathlib import Path
import shutil

from models.portfolio import PortfolioItem, PortfolioItemCreate, PortfolioItemUpdate, format_file_size

class PortfolioService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.portfolio_collection = database.portfolio_items
        
    async def ensure_indexes(self):
        """Ensure required indexes exist for portfolio collection"""
        try:
            # Create index on user_id for efficient user queries
            await self.portfolio_collection.create_index(
                "user_id",
                name="user_portfolio_index"
            )
            
            # Create index on competency areas for filtering
            await self.portfolio_collection.create_index(
                "competency_areas",
                name="competency_areas_index"
            )
            
            # Create index on status for active item queries
            await self.portfolio_collection.create_index(
                "status",
                name="status_index"
            )
            
            # Create compound index for user + status queries
            await self.portfolio_collection.create_index(
                [("user_id", 1), ("status", 1)],
                name="user_status_index"
            )
            
            print("✅ Portfolio indexes created successfully")
        except Exception as e:
            print(f"⚠️ Portfolio index creation warning (may already exist): {e}")

    async def create_portfolio_item(self, user_id: str, item_data: PortfolioItemCreate, file_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new portfolio item"""
        await self.ensure_indexes()
        
        # Convert Pydantic model to dictionary
        item_dict = item_data.dict()
        item_dict['user_id'] = user_id
        item_dict['upload_date'] = datetime.utcnow()
        item_dict['updated_at'] = datetime.utcnow()
        item_dict['status'] = 'active'
        
        # Add file information if provided
        if file_info:
            item_dict.update(file_info)
        
        # Insert into database
        result = await self.portfolio_collection.insert_one(item_dict)
        item_dict['_id'] = result.inserted_id
        item_dict['id'] = str(item_dict['_id'])
        
        print(f"✅ Created portfolio item: {item_dict.get('title', 'Unknown')}")
        return item_dict

    async def get_portfolio_item_by_id(self, item_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get portfolio item by ID with optional user restriction"""
        try:
            object_id = ObjectId(item_id)
        except InvalidId:
            return None
        
        query = {'_id': object_id, 'status': {'$ne': 'deleted'}}
        if user_id:
            query['user_id'] = user_id
        
        item = await self.portfolio_collection.find_one(query)
        if item:
            item['id'] = str(item['_id'])
            # Add formatted file size if file_size exists
            if item.get('file_size'):
                item['file_size_formatted'] = format_file_size(item['file_size'])
        
        return item

    async def get_user_portfolio(self, user_id: str, visibility: Optional[str] = None, status: str = 'active') -> List[Dict[str, Any]]:
        """Get all portfolio items for a user with optional filtering"""
        query = {'user_id': user_id, 'status': status}
        
        if visibility:
            query['visibility'] = visibility
        
        cursor = self.portfolio_collection.find(query).sort([('upload_date', -1)])
        
        items = []
        async for item in cursor:
            item['id'] = str(item['_id'])
            # Add formatted file size if file_size exists
            if item.get('file_size'):
                item['file_size_formatted'] = format_file_size(item['file_size'])
            items.append(item)
        
        return items

    async def get_portfolio_by_competency(self, user_id: str, competency_area: str, status: str = 'active') -> List[Dict[str, Any]]:
        """Get portfolio items for a specific competency area"""
        query = {
            'user_id': user_id,
            'status': status,
            'competency_areas': competency_area
        }
        
        cursor = self.portfolio_collection.find(query).sort([('upload_date', -1)])
        
        items = []
        async for item in cursor:
            item['id'] = str(item['_id'])
            if item.get('file_size'):
                item['file_size_formatted'] = format_file_size(item['file_size'])
            items.append(item)
        
        return items

    async def update_portfolio_item(self, item_id: str, user_id: str, update_data: PortfolioItemUpdate) -> Optional[Dict[str, Any]]:
        """Update a portfolio item"""
        try:
            object_id = ObjectId(item_id)
        except InvalidId:
            return None
        
        # Only update fields that were provided
        update_dict = update_data.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.utcnow()
        
        result = await self.portfolio_collection.find_one_and_update(
            {'_id': object_id, 'user_id': user_id, 'status': {'$ne': 'deleted'}},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
            if result.get('file_size'):
                result['file_size_formatted'] = format_file_size(result['file_size'])
        
        return result

    async def delete_portfolio_item(self, item_id: str, user_id: str, hard_delete: bool = False) -> bool:
        """Delete a portfolio item (soft delete by default)"""
        try:
            object_id = ObjectId(item_id)
        except InvalidId:
            return False
        
        # Get the item to access file path for cleanup
        item = await self.portfolio_collection.find_one({
            '_id': object_id,
            'user_id': user_id
        })
        
        if not item:
            return False
        
        if hard_delete:
            # Hard delete - remove from database
            result = await self.portfolio_collection.delete_one({
                '_id': object_id,
                'user_id': user_id
            })
            success = result.deleted_count > 0
        else:
            # Soft delete - mark as deleted
            result = await self.portfolio_collection.update_one(
                {'_id': object_id, 'user_id': user_id},
                {'$set': {'status': 'deleted', 'updated_at': datetime.utcnow()}}
            )
            success = result.modified_count > 0
        
        # Clean up file if deletion was successful and file exists
        if success and item.get('file_path'):
            try:
                file_path = Path(item['file_path'])
                if file_path.exists():
                    file_path.unlink()
                    print(f"✅ Deleted file: {item['file_path']}")
            except Exception as e:
                print(f"⚠️ Failed to delete file {item['file_path']}: {e}")
        
        return success

    async def search_portfolio(self, user_id: str, search_text: str, competency_areas: Optional[List[str]] = None, tags: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Search portfolio items by text, competency areas, and tags"""
        query = {'user_id': user_id, 'status': 'active'}
        
        # Text search
        if search_text:
            query['$or'] = [
                {'title': {'$regex': search_text, '$options': 'i'}},
                {'description': {'$regex': search_text, '$options': 'i'}},
                {'tags': {'$regex': search_text, '$options': 'i'}}
            ]
        
        # Competency area filtering
        if competency_areas:
            query['competency_areas'] = {'$in': competency_areas}
        
        # Tag filtering
        if tags:
            query['tags'] = {'$in': tags}
        
        cursor = self.portfolio_collection.find(query).sort([('upload_date', -1)])
        
        items = []
        async for item in cursor:
            item['id'] = str(item['_id'])
            if item.get('file_size'):
                item['file_size_formatted'] = format_file_size(item['file_size'])
            items.append(item)
        
        return items

    async def get_portfolio_statistics(self, user_id: str = None) -> Dict[str, Any]:
        """Get portfolio statistics for a user or system-wide"""
        match_query = {'status': 'active'}
        if user_id:
            match_query['user_id'] = user_id
        
        # Total items
        total_items = await self.portfolio_collection.count_documents(match_query)
        
        # Items by competency area
        competency_pipeline = [
            {'$match': match_query},
            {'$unwind': '$competency_areas'},
            {'$group': {'_id': '$competency_areas', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        competency_results = await self.portfolio_collection.aggregate(competency_pipeline).to_list(None)
        items_by_competency = {result['_id']: result['count'] for result in competency_results}
        
        # Items by file type
        type_pipeline = [
            {'$match': match_query},
            {'$group': {'_id': '$file_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        type_results = await self.portfolio_collection.aggregate(type_pipeline).to_list(None)
        items_by_type = {result['_id']: result['count'] for result in type_results}
        
        # Total file size
        size_pipeline = [
            {'$match': {**match_query, 'file_size': {'$exists': True, '$ne': None}}},
            {'$group': {'_id': None, 'total_size': {'$sum': '$file_size'}}}
        ]
        size_results = await self.portfolio_collection.aggregate(size_pipeline).to_list(1)
        total_size = size_results[0]['total_size'] if size_results else 0
        
        # Most used tags
        tags_pipeline = [
            {'$match': match_query},
            {'$unwind': '$tags'},
            {'$group': {'_id': '$tags', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        tags_results = await self.portfolio_collection.aggregate(tags_pipeline).to_list(None)
        most_used_tags = [{'tag': result['_id'], 'count': result['count']} for result in tags_results]
        
        # Recent uploads (last 10)
        recent_cursor = self.portfolio_collection.find(match_query).sort([
            ('upload_date', -1)
        ]).limit(10)
        
        recent_uploads = []
        async for item in recent_cursor:
            recent_uploads.append({
                'id': str(item['_id']),
                'title': item['title'][:50] + '...' if len(item['title']) > 50 else item['title'],
                'competency_areas': item['competency_areas'],
                'upload_date': item['upload_date']
            })
        
        return {
            'total_items': total_items,
            'items_by_competency': items_by_competency,
            'items_by_type': items_by_type,
            'total_size_bytes': total_size,
            'total_size_formatted': format_file_size(total_size),
            'most_used_tags': most_used_tags,
            'recent_uploads': recent_uploads
        }

    async def update_file_info(self, item_id: str, user_id: str, file_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update file information for a portfolio item"""
        try:
            object_id = ObjectId(item_id)
        except InvalidId:
            return None
        
        file_info['updated_at'] = datetime.utcnow()
        
        result = await self.portfolio_collection.find_one_and_update(
            {'_id': object_id, 'user_id': user_id},
            {'$set': file_info},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
            if result.get('file_size'):
                result['file_size_formatted'] = format_file_size(result['file_size'])
        
        return result

    async def get_items_by_visibility(self, visibility: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Get portfolio items by visibility level"""
        query = {'visibility': visibility, 'status': 'active'}
        if user_id:
            query['user_id'] = user_id
        
        cursor = self.portfolio_collection.find(query).sort([('upload_date', -1)])
        
        items = []
        async for item in cursor:
            item['id'] = str(item['_id'])
            if item.get('file_size'):
                item['file_size_formatted'] = format_file_size(item['file_size'])
            items.append(item)
        
        return items

    async def bulk_update_competency_mapping(self, user_id: str, competency_mapping: Dict[str, List[str]]) -> Dict[str, Any]:
        """Bulk update competency area mappings for portfolio items"""
        results = {
            'success': True,
            'updated_items': 0,
            'errors': []
        }
        
        for portfolio_item_id, competency_areas in competency_mapping.items():
            try:
                await self.update_portfolio_item(
                    portfolio_item_id, 
                    user_id, 
                    PortfolioItemUpdate(competency_areas=competency_areas)
                )
                results['updated_items'] += 1
            except Exception as e:
                results['success'] = False
                results['errors'].append(f"Failed to update item {portfolio_item_id}: {str(e)}")
        
        return results