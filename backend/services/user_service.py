from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.user import User, UserCreate, UserUpdate

class UserService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.users_collection = database.users
        
    async def ensure_indexes(self):
        """Ensure required indexes exist for users collection"""
        try:
            # Create unique index on clerk_user_id
            await self.users_collection.create_index(
                "clerk_user_id", 
                unique=True,
                name="unique_clerk_user_id"
            )
            
            # Create index for email queries
            await self.users_collection.create_index(
                "email",
                name="email_index"
            )
            
            print("✅ User indexes created successfully")
        except Exception as e:
            print(f"⚠️ User index creation warning (may already exist): {e}")

    async def create_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user or return existing user by Clerk ID"""
        # Ensure indexes are created
        await self.ensure_indexes()
        
        # Check if user already exists by Clerk ID
        existing_user = await self.users_collection.find_one({
            "clerk_user_id": user_data.clerk_user_id
        })
        
        if existing_user:
            existing_user['id'] = str(existing_user['_id'])
            return existing_user
        
        # Convert Pydantic model to dictionary
        user_dict = user_data.dict()
        user_dict['created_at'] = datetime.utcnow()
        user_dict['updated_at'] = datetime.utcnow()
        user_dict['metadata'] = {}
        
        try:
            # Insert into database
            result = await self.users_collection.insert_one(user_dict)
            user_dict['_id'] = result.inserted_id
            user_dict['id'] = str(user_dict['_id'])
            
            print(f"✅ Created new user: {user_dict.get('name', 'Unknown')} ({user_dict.get('email', 'No email')})")
            return user_dict
            
        except Exception as e:
            # Handle duplicate key error
            if "duplicate key error" in str(e).lower() or "E11000" in str(e):
                existing_user = await self.users_collection.find_one({
                    "clerk_user_id": user_data.clerk_user_id
                })
                if existing_user:
                    existing_user['id'] = str(existing_user['_id'])
                    return existing_user
            
            raise e

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by database ID"""
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            return None
        
        user = await self.users_collection.find_one({'_id': object_id})
        if user:
            user['id'] = str(user['_id'])
        
        return user

    async def get_user_by_clerk_id(self, clerk_user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Clerk user ID"""
        user = await self.users_collection.find_one({'clerk_user_id': clerk_user_id})
        if user:
            user['id'] = str(user['_id'])
        
        return user

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email address"""
        user = await self.users_collection.find_one({'email': email})
        if user:
            user['id'] = str(user['_id'])
        
        return user

    async def update_user(self, user_id: str, update_data: UserUpdate) -> Optional[Dict[str, Any]]:
        """Update user information"""
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            return None
        
        # Only update fields that were provided
        update_dict = update_data.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.utcnow()
        
        result = await self.users_collection.find_one_and_update(
            {'_id': object_id},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result

    async def update_last_login(self, clerk_user_id: str) -> Optional[Dict[str, Any]]:
        """Update user's last login timestamp"""
        result = await self.users_collection.find_one_and_update(
            {'clerk_user_id': clerk_user_id},
            {'$set': {'last_login': datetime.utcnow(), 'updated_at': datetime.utcnow()}},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result

    async def get_all_users(self, include_admins: bool = False) -> List[Dict[str, Any]]:
        """Get all users with optional admin filtering"""
        query = {}
        if not include_admins:
            query['is_admin'] = False
        
        cursor = self.users_collection.find(query).sort([('created_at', -1)])
        
        users = []
        async for user in cursor:
            user['id'] = str(user['_id'])
            users.append(user)
        
        return users

    async def delete_user(self, user_id: str) -> bool:
        """Delete a user (soft delete by updating status)"""
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            return False
        
        result = await self.users_collection.update_one(
            {'_id': object_id},
            {'$set': {'status': 'deleted', 'updated_at': datetime.utcnow()}}
        )
        
        return result.modified_count > 0

    async def get_user_statistics(self) -> Dict[str, Any]:
        """Get user statistics"""
        # Total users
        total_users = await self.users_collection.count_documents({})
        admin_users = await self.users_collection.count_documents({'is_admin': True})
        
        # Users by role
        role_pipeline = [
            {'$group': {'_id': '$role', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        role_results = await self.users_collection.aggregate(role_pipeline).to_list(None)
        users_by_role = {result['_id']: result['count'] for result in role_results}
        
        # Users by level
        level_pipeline = [
            {'$group': {'_id': '$level', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        level_results = await self.users_collection.aggregate(level_pipeline).to_list(None)
        users_by_level = {result['_id']: result['count'] for result in level_results}
        
        # Recent registrations (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = await self.users_collection.count_documents({
            'created_at': {'$gte': thirty_days_ago}
        })
        
        return {
            'total_users': total_users,
            'admin_users': admin_users,
            'regular_users': total_users - admin_users,
            'users_by_role': users_by_role,
            'users_by_level': users_by_level,
            'recent_registrations': recent_registrations
        }