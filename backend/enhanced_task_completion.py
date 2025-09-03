"""
Enhanced Task Completion Service
Integrates task completion with flightbook entry creation
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import uuid
from demo_flightbook_service import DemoFlightbookService

logger = logging.getLogger(__name__)

class EnhancedTaskCompletionService:
    """Service that handles task completion with integrated flightbook creation"""
    
    def __init__(self, db):
        self.db = db
        self.demo_flightbook_service = DemoFlightbookService(db)
    
    async def complete_task_with_flightbook_integration(
        self, 
        user_id: str, 
        task_id: str, 
        completion_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Complete a task and automatically create a flightbook entry if notes are provided
        """
        
        try:
            # Get task details
            task = await self.db.tasks.find_one({"id": task_id})
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            # Check if already completed
            existing = await self.db.task_completions.find_one({
                "user_id": user_id, 
                "task_id": task_id
            })
            if existing:
                raise ValueError("Task already completed")
            
            # Create task completion record
            completion = {
                "id": completion_data.get("id", str(uuid.uuid4())),
                "user_id": user_id,
                "task_id": task_id,
                "completed_at": completion_data.get("completed_at", datetime.utcnow()),
                "evidence_description": completion_data.get("evidence_description", ""),
                "notes": completion_data.get("notes", ""),
                "evidence_file_path": completion_data.get("evidence_file_path")
            }
            
            # Save task completion
            await self.db.task_completions.insert_one(completion)
            logger.info(f"Task {task_id} completed for user {user_id}")
            
            # Create flightbook entry if notes are provided and substantial
            notes = completion_data.get("notes", "").strip()
            evidence_description = completion_data.get("evidence_description", "").strip()
            
            # Combine notes and evidence description for flightbook content
            flightbook_content = []
            if evidence_description:
                flightbook_content.append(f"Evidence: {evidence_description}")
            if notes:
                flightbook_content.append(f"Reflection: {notes}")
            
            combined_content = "\n\n".join(flightbook_content)
            
            # Only create flightbook entry if there's substantial content (>10 characters)
            if combined_content and len(combined_content.strip()) > 10:
                try:
                    # Determine if this is a demo user
                    is_demo_user = user_id == "demo-user-123" or user_id.startswith("demo-")
                    
                    flightbook_entry_data = {
                        "title": f"Task Completion: {task.get('description', task.get('title', 'Unknown Task'))}",
                        "content": combined_content,
                        "competency_area": task.get("competency_area", ""),
                        "sub_competency": task.get("sub_competency", ""),
                        "entry_type": "task_completion",
                        "task_id": task_id,
                        "task_title": task.get("title", ""),
                        "tags": [
                            "task_completion",
                            task.get("competency_area", "").replace("_", " "),
                            task.get("task_type", "")
                        ]
                    }
                    
                    if is_demo_user:
                        # Use demo flightbook service
                        flightbook_entry = await self.demo_flightbook_service.create_demo_flightbook_entry(
                            user_id, flightbook_entry_data
                        )
                        logger.info(f"Created demo flightbook entry for task {task_id}")
                    else:
                        # For real users, we would integrate with the actual flightbook service
                        # This would require proper Clerk authentication
                        logger.info(f"Flightbook integration for authenticated users not yet implemented")
                        flightbook_entry = None
                    
                    # Add flightbook entry info to completion response
                    completion["flightbook_entry_created"] = flightbook_entry is not None
                    if flightbook_entry:
                        completion["flightbook_entry_id"] = flightbook_entry.get("id")
                        
                except Exception as e:
                    logger.error(f"Failed to create flightbook entry for task {task_id}: {str(e)}")
                    # Don't fail the task completion if flightbook creation fails
                    completion["flightbook_entry_created"] = False
                    completion["flightbook_error"] = str(e)
            
            # Update competency progress
            await self._update_competency_progress(user_id, task)
            
            return completion
            
        except Exception as e:
            logger.error(f"Task completion failed for task {task_id}, user {user_id}: {str(e)}")
            raise
    
    async def _update_competency_progress(self, user_id: str, task: Dict[str, Any]):
        """Update competency progress after task completion"""
        
        competency_area = task.get("competency_area")
        sub_competency = task.get("sub_competency")
        
        if not competency_area or not sub_competency:
            return
        
        # Get all tasks for this competency
        all_tasks = await self.db.tasks.find({
            "competency_area": competency_area,
            "sub_competency": sub_competency,
            "active": True
        }).to_list(1000)
        
        # Get completed tasks for this user and competency
        task_ids = [t.get("id", str(t["_id"])) for t in all_tasks]
        completed_tasks = await self.db.task_completions.find({
            "user_id": user_id,
            "task_id": {"$in": task_ids}
        }).to_list(1000)
        
        # Calculate progress
        total_tasks = len(all_tasks)
        completed_count = len(completed_tasks)
        completion_percentage = (completed_count / total_tasks * 100) if total_tasks > 0 else 0
        
        # Update or create competency progress record
        progress_data = {
            "user_id": user_id,
            "competency_area": competency_area,
            "sub_competency": sub_competency,
            "completion_percentage": round(completion_percentage, 1),
            "completed_tasks": completed_count,
            "total_tasks": total_tasks,
            "last_updated": datetime.utcnow()
        }
        
        await self.db.competency_progress.update_one(
            {
                "user_id": user_id,
                "competency_area": competency_area,
                "sub_competency": sub_competency
            },
            {"$set": progress_data},
            upsert=True
        )
        
        logger.info(f"Updated competency progress: {competency_area}/{sub_competency} - {completion_percentage}%")