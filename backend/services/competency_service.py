from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.competency import Task, TaskCreate, TaskUpdate, TaskCompletion, TaskCompletionCreate, CompetencyProgress

class CompetencyService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.tasks_collection = database.tasks
        self.task_completions_collection = database.task_completions
        self.competency_progress_collection = database.competency_progress
        
    async def ensure_indexes(self):
        """Ensure required indexes exist for competency collections"""
        try:
            # Task collection indexes
            await self.tasks_collection.create_index(
                [("competency_area", 1), ("sub_competency", 1), ("order", 1)],
                name="competency_order_index"
            )
            
            await self.tasks_collection.create_index(
                "active",
                name="active_tasks_index"
            )
            
            # Task completion indexes
            await self.task_completions_collection.create_index(
                [("user_id", 1), ("task_id", 1)],
                unique=True,
                name="unique_user_task_completion"
            )
            
            await self.task_completions_collection.create_index(
                "user_id",
                name="user_completions_index"
            )
            
            # Competency progress indexes
            await self.competency_progress_collection.create_index(
                [("user_id", 1), ("competency_area", 1), ("sub_competency", 1)],
                unique=True,
                name="unique_user_competency_progress"
            )
            
            print("✅ Competency indexes created successfully")
        except Exception as e:
            print(f"⚠️ Competency index creation warning (may already exist): {e}")

    # Task Management
    async def create_task(self, task_data: TaskCreate, created_by: str) -> Dict[str, Any]:
        """Create a new task"""
        await self.ensure_indexes()
        
        task_dict = task_data.dict()
        task_dict['created_by'] = created_by
        task_dict['created_at'] = datetime.utcnow()
        task_dict['updated_at'] = datetime.utcnow()
        
        result = await self.tasks_collection.insert_one(task_dict)
        task_dict['_id'] = result.inserted_id
        task_dict['id'] = str(task_dict['_id'])
        
        return task_dict

    async def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task by ID"""
        try:
            object_id = ObjectId(task_id)
        except InvalidId:
            return None
        
        task = await self.tasks_collection.find_one({'_id': object_id})
        if task:
            task['id'] = str(task['_id'])
        
        return task

    async def get_tasks_by_competency(self, competency_area: str, sub_competency: str = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get tasks for a specific competency area"""
        query = {'competency_area': competency_area}
        
        if sub_competency:
            query['sub_competency'] = sub_competency
        
        if active_only:
            query['active'] = True
        
        cursor = self.tasks_collection.find(query).sort([('order', 1), ('created_at', 1)])
        
        tasks = []
        async for task in cursor:
            task['id'] = str(task['_id'])
            tasks.append(task)
        
        return tasks

    async def get_all_tasks(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all tasks"""
        query = {}
        if active_only:
            query['active'] = True
        
        cursor = self.tasks_collection.find(query).sort([
            ('competency_area', 1),
            ('sub_competency', 1), 
            ('order', 1)
        ])
        
        tasks = []
        async for task in cursor:
            task['id'] = str(task['_id'])
            tasks.append(task)
        
        return tasks

    async def update_task(self, task_id: str, update_data: TaskUpdate) -> Optional[Dict[str, Any]]:
        """Update a task"""
        try:
            object_id = ObjectId(task_id)
        except InvalidId:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.utcnow()
        
        result = await self.tasks_collection.find_one_and_update(
            {'_id': object_id},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result

    async def delete_task(self, task_id: str) -> bool:
        """Soft delete a task (mark as inactive)"""
        try:
            object_id = ObjectId(task_id)
        except InvalidId:
            return False
        
        result = await self.tasks_collection.update_one(
            {'_id': object_id},
            {'$set': {'active': False, 'updated_at': datetime.utcnow()}}
        )
        
        return result.modified_count > 0

    # Task Completion Management
    async def complete_task(self, user_id: str, completion_data: TaskCompletionCreate) -> Dict[str, Any]:
        """Mark a task as completed by a user"""
        # Check if task exists
        task = await self.get_task_by_id(completion_data.task_id)
        if not task:
            raise ValueError("Task not found")
        
        # Check if already completed
        existing = await self.task_completions_collection.find_one({
            'user_id': user_id,
            'task_id': completion_data.task_id
        })
        
        if existing:
            existing['id'] = str(existing['_id'])
            return existing
        
        # Create completion record
        completion_dict = completion_data.dict()
        completion_dict['user_id'] = user_id
        completion_dict['completed_at'] = datetime.utcnow()
        
        result = await self.task_completions_collection.insert_one(completion_dict)
        completion_dict['_id'] = result.inserted_id
        completion_dict['id'] = str(completion_dict['_id'])
        
        # Update competency progress
        await self.update_competency_progress(user_id, task['competency_area'], task['sub_competency'])
        
        return completion_dict

    async def get_user_task_completions(self, user_id: str, competency_area: str = None, sub_competency: str = None) -> List[Dict[str, Any]]:
        """Get task completions for a user"""
        query = {'user_id': user_id}
        
        # If filtering by competency, we need to join with tasks
        if competency_area or sub_competency:
            task_query = {}
            if competency_area:
                task_query['competency_area'] = competency_area
            if sub_competency:
                task_query['sub_competency'] = sub_competency
            
            # Get task IDs that match the competency filter
            task_cursor = self.tasks_collection.find(task_query, {'_id': 1})
            task_ids = [str(task['_id']) async for task in task_cursor]
            
            query['task_id'] = {'$in': task_ids}
        
        cursor = self.task_completions_collection.find(query).sort([('completed_at', -1)])
        
        completions = []
        async for completion in cursor:
            completion['id'] = str(completion['_id'])
            completions.append(completion)
        
        return completions

    async def get_user_tasks_with_completion_status(self, user_id: str, competency_area: str, sub_competency: str) -> List[Dict[str, Any]]:
        """Get tasks with completion status for a user"""
        # Get all tasks for the competency
        tasks = await self.get_tasks_by_competency(competency_area, sub_competency)
        
        # Get user's completions for these tasks
        task_ids = [task['id'] for task in tasks]
        completions_cursor = self.task_completions_collection.find({
            'user_id': user_id,
            'task_id': {'$in': task_ids}
        })
        
        completion_map = {}
        async for completion in completions_cursor:
            completion['id'] = str(completion['_id'])
            completion_map[completion['task_id']] = completion
        
        # Add completion status to tasks
        for task in tasks:
            task['completed'] = task['id'] in completion_map
            if task['completed']:
                task['completion_data'] = completion_map[task['id']]
        
        return tasks

    # Competency Progress Management
    async def update_competency_progress(self, user_id: str, competency_area: str, sub_competency: str) -> Dict[str, Any]:
        """Calculate and update competency progress for a user"""
        # Get all tasks for this competency
        tasks = await self.get_tasks_by_competency(competency_area, sub_competency)
        total_tasks = len(tasks)
        
        if total_tasks == 0:
            return {}
        
        # Get completed tasks count
        task_ids = [task['id'] for task in tasks]
        completed_count = await self.task_completions_collection.count_documents({
            'user_id': user_id,
            'task_id': {'$in': task_ids}
        })
        
        # Calculate progress percentage
        completion_percentage = (completed_count / total_tasks) * 100 if total_tasks > 0 else 0.0
        
        # Update or create progress record
        progress_data = {
            'user_id': user_id,
            'competency_area': competency_area,
            'sub_competency': sub_competency,
            'completion_percentage': completion_percentage,
            'completed_tasks': completed_count,
            'total_tasks': total_tasks,
            'last_updated': datetime.utcnow()
        }
        
        result = await self.competency_progress_collection.find_one_and_update(
            {
                'user_id': user_id,
                'competency_area': competency_area,
                'sub_competency': sub_competency
            },
            {
                '$set': progress_data,
                '$setOnInsert': {'evidence_items': []}
            },
            upsert=True,
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result

    async def get_user_competency_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all competency progress for a user"""
        cursor = self.competency_progress_collection.find({'user_id': user_id}).sort([
            ('competency_area', 1),
            ('sub_competency', 1)
        ])
        
        progress_list = []
        async for progress in cursor:
            progress['id'] = str(progress['_id'])
            progress_list.append(progress)
        
        return progress_list

    async def add_evidence_to_competency(self, user_id: str, competency_area: str, portfolio_item_id: str):
        """Add portfolio evidence to competency progress"""
        await self.competency_progress_collection.update_many(
            {
                'user_id': user_id,
                'competency_area': competency_area
            },
            {
                '$addToSet': {'evidence_items': portfolio_item_id}
            }
        )

    async def remove_evidence_from_competency(self, user_id: str, competency_area: str, portfolio_item_id: str):
        """Remove portfolio evidence from competency progress"""
        await self.competency_progress_collection.update_many(
            {
                'user_id': user_id,
                'competency_area': competency_area
            },
            {
                '$pull': {'evidence_items': portfolio_item_id}
            }
        )

    # Bulk operations for seeding/migration
    async def seed_sample_tasks(self, sample_tasks: List[Dict[str, Any]], created_by: str = "system") -> Dict[str, Any]:
        """Bulk create sample tasks for seeding"""
        # Clear existing tasks
        await self.tasks_collection.delete_many({})
        
        results = {
            'success': True,
            'processed': 0,
            'errors': [],
            'created_tasks': []
        }
        
        for task_data in sample_tasks:
            try:
                task_dict = task_data.copy()
                task_dict['created_by'] = created_by
                task_dict['created_at'] = datetime.utcnow()
                task_dict['updated_at'] = datetime.utcnow()
                task_dict['active'] = True
                
                result = await self.tasks_collection.insert_one(task_dict)
                task_dict['_id'] = result.inserted_id
                task_dict['id'] = str(task_dict['_id'])
                
                results['created_tasks'].append(task_dict)
                results['processed'] += 1
                
            except Exception as e:
                results['success'] = False
                results['errors'].append(f"Failed to create task '{task_data.get('title', 'Unknown')}': {str(e)}")
        
        return results

    async def get_admin_statistics(self) -> Dict[str, Any]:
        """Get comprehensive statistics for admin dashboard"""
        # Total counts
        total_tasks = await self.tasks_collection.count_documents({'active': True})
        total_completions = await self.task_completions_collection.count_documents({})
        
        # Task statistics by competency
        competency_pipeline = [
            {'$match': {'active': True}},
            {'$group': {'_id': '$competency_area', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        competency_results = await self.tasks_collection.aggregate(competency_pipeline).to_list(None)
        tasks_by_competency = {result['_id']: result['count'] for result in competency_results}
        
        # Completion rate by competency
        completion_pipeline = [
            {
                '$lookup': {
                    'from': 'tasks',
                    'localField': 'task_id',
                    'foreignField': '_id',
                    'as': 'task'
                }
            },
            {'$unwind': '$task'},
            {'$group': {'_id': '$task.competency_area', 'completions': {'$sum': 1}}},
            {'$sort': {'completions': -1}}
        ]
        
        return {
            'total_tasks': total_tasks,
            'total_completions': total_completions,
            'tasks_by_competency': tasks_by_competency,
            'active_competency_areas': len(tasks_by_competency)
        }