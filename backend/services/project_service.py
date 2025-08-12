from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from models.project import (
    Project, ProjectCreate, ProjectUpdate, ProjectNote, 
    ProjectFile, ProjectFileCreate, ProjectFileUpdate
)

class ProjectService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.projects_collection = database.culminating_projects
        self.files_collection = database.project_files
        self.notes_collection = database.project_notes
        
    # Project CRUD Operations
    async def create_project(self, user_id: str, project_data: ProjectCreate) -> Dict[str, Any]:
        """Create a new culminating project"""
        project_dict = project_data.dict()
        project_dict['user_id'] = user_id
        project_dict['created_at'] = datetime.utcnow()
        project_dict['updated_at'] = datetime.utcnow()
        project_dict['status'] = 'active'
        
        # Initialize phase history
        project_dict['phase_history'] = [
            {
                'phase': 'planning',
                'started_at': datetime.utcnow(),
                'status': 'active'
            }
        ]
        
        # Initialize required deliverables based on phase structure
        project_dict['required_deliverables'] = self._get_required_deliverables()
        
        # Insert project
        result = await self.projects_collection.insert_one(project_dict)
        project_dict['_id'] = result.inserted_id
        project_dict['id'] = str(project_dict['_id'])
        
        return project_dict
    
    def _get_required_deliverables(self) -> List[Dict[str, Any]]:
        """Get the standard required deliverables for culminating projects"""
        return [
            # Planning Phase
            {
                'id': 'project_charter',
                'title': 'Project Charter & Business Case',
                'phase': 'planning',
                'required': True,
                'template_provided': True,
                'competency_areas': ['strategic_thinking', 'financial_management'],
                'portfolio_tag': 'culminating-project-planning'
            },
            {
                'id': 'implementation_timeline',
                'title': 'Implementation Timeline & Resource Plan',
                'phase': 'planning',
                'required': True,
                'template_provided': True,
                'competency_areas': ['operational_management', 'strategic_thinking'],
                'portfolio_tag': 'culminating-project-planning'
            },
            {
                'id': 'stakeholder_communication',
                'title': 'Stakeholder Communication Plan',
                'phase': 'planning',
                'required': True,
                'template_provided': True,
                'competency_areas': ['cross_functional_collaboration', 'leadership_supervision'],
                'portfolio_tag': 'culminating-project-planning'
            },
            
            # Execution Phase
            {
                'id': 'weekly_progress',
                'title': 'Weekly Progress Reports',
                'phase': 'execution',
                'required': True,
                'template_provided': True,
                'frequency': 'weekly',
                'competency_areas': ['operational_management', 'strategic_thinking'],
                'portfolio_tag': 'culminating-project-execution'
            },
            {
                'id': 'milestone_documentation',
                'title': 'Milestone Documentation',
                'phase': 'execution',
                'required': True,
                'template_provided': False,
                'competency_areas': ['all'],
                'portfolio_tag': 'culminating-project-execution'
            },
            {
                'id': 'stakeholder_feedback',
                'title': 'Stakeholder Feedback Collection',
                'phase': 'execution',
                'required': True,
                'template_provided': True,
                'competency_areas': ['cross_functional_collaboration', 'leadership_supervision'],
                'portfolio_tag': 'culminating-project-execution'
            },
            {
                'id': 'financial_impact',
                'title': 'Financial Impact Analysis',
                'phase': 'execution',
                'required': True,
                'template_provided': True,
                'competency_areas': ['financial_management', 'operational_management'],
                'portfolio_tag': 'culminating-project-execution'
            },
            
            # Completion Phase
            {
                'id': 'comprehensive_portfolio',
                'title': 'Comprehensive Project Portfolio',
                'phase': 'completion',
                'required': True,
                'template_provided': True,
                'competency_areas': ['all'],
                'portfolio_tag': 'culminating-project-completion'
            },
            {
                'id': 'impact_measurement',
                'title': 'Impact Measurement Report',
                'phase': 'completion',
                'required': True,
                'template_provided': True,
                'competency_areas': ['strategic_thinking', 'financial_management'],
                'portfolio_tag': 'culminating-project-completion'
            },
            {
                'id': 'leadership_reflection',
                'title': 'Leadership Growth Reflection',
                'phase': 'completion',
                'required': True,
                'template_provided': True,
                'competency_areas': ['leadership_supervision'],
                'portfolio_tag': 'culminating-project-completion'
            },
            {
                'id': 'presentation_materials',
                'title': 'Final Presentation Materials',
                'phase': 'completion',
                'required': True,
                'template_provided': True,
                'competency_areas': ['all'],
                'portfolio_tag': 'culminating-project-completion'
            }
        ]
    
    async def get_user_projects(
        self, 
        user_id: str,
        status: Optional[str] = None,
        current_phase: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all projects for a user with optional filtering"""
        query_filters = {'user_id': user_id}
        
        if status:
            query_filters['status'] = status
        if current_phase:
            query_filters['current_phase'] = current_phase
        
        cursor = self.projects_collection.find(query_filters).sort([
            ('updated_at', DESCENDING)
        ])
        
        projects = []
        async for project in cursor:
            project['id'] = str(project['_id'])
            projects.append(project)
        
        return projects
    
    async def get_project_by_id(self, project_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific project by ID"""
        try:
            object_id = ObjectId(project_id)
        except InvalidId:
            return None
        
        project = await self.projects_collection.find_one({
            '_id': object_id,
            'user_id': user_id
        })
        
        if project:
            project['id'] = str(project['_id'])
        
        return project
    
    async def update_project(
        self, 
        project_id: str, 
        user_id: str, 
        update_data: ProjectUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update an existing project"""
        try:
            object_id = ObjectId(project_id)
        except InvalidId:
            return None
        
        # Get current project for phase transition handling
        current_project = await self.projects_collection.find_one({
            '_id': object_id,
            'user_id': user_id
        })
        
        if not current_project:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.utcnow()
        
        # Handle phase transitions
        if 'current_phase' in update_dict and update_dict['current_phase'] != current_project.get('current_phase'):
            # Add phase transition to history
            phase_history = current_project.get('phase_history', [])
            
            # Close previous phase
            if phase_history:
                phase_history[-1]['completed_at'] = datetime.utcnow()
                phase_history[-1]['status'] = 'completed'
            
            # Add new phase
            phase_history.append({
                'phase': update_dict['current_phase'],
                'started_at': datetime.utcnow(),
                'status': 'active'
            })
            
            update_dict['phase_history'] = phase_history
        
        result = await self.projects_collection.find_one_and_update(
            {'_id': object_id, 'user_id': user_id},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result
    
    # Project File Operations
    async def create_project_file(
        self, 
        user_id: str, 
        project_id: str, 
        file_data: ProjectFileCreate
    ) -> Dict[str, Any]:
        """Create a new project file"""
        file_dict = file_data.dict()
        file_dict['user_id'] = user_id
        file_dict['project_id'] = project_id
        file_dict['upload_date'] = datetime.utcnow()
        file_dict['updated_at'] = datetime.utcnow()
        file_dict['status'] = 'active'
        file_dict['version'] = 1
        
        # Insert file record
        result = await self.files_collection.insert_one(file_dict)
        file_dict['_id'] = result.inserted_id
        file_dict['id'] = str(file_dict['_id'])
        
        # Update project's portfolio items list if needed
        await self.projects_collection.update_one(
            {'_id': ObjectId(project_id), 'user_id': user_id},
            {'$addToSet': {'portfolio_items': file_dict['id']}}
        )
        
        return file_dict
    
    async def get_project_files(
        self, 
        user_id: str, 
        project_id: str,
        project_phase: Optional[str] = None,
        deliverable_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all files for a project with optional filtering"""
        query_filters = {
            'user_id': user_id,
            'project_id': project_id,
            'status': 'active'
        }
        
        if project_phase:
            query_filters['project_phase'] = project_phase
        if deliverable_type:
            query_filters['deliverable_type'] = deliverable_type
        
        cursor = self.files_collection.find(query_filters).sort([
            ('upload_date', DESCENDING)
        ])
        
        files = []
        async for file_doc in cursor:
            file_doc['id'] = str(file_doc['_id'])
            files.append(file_doc)
        
        return files
    
    async def update_project_file(
        self, 
        file_id: str, 
        user_id: str, 
        update_data: ProjectFileUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update project file metadata"""
        try:
            object_id = ObjectId(file_id)
        except InvalidId:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.utcnow()
        
        result = await self.files_collection.find_one_and_update(
            {'_id': object_id, 'user_id': user_id},
            {'$set': update_dict},
            return_document=True
        )
        
        if result:
            result['id'] = str(result['_id'])
        
        return result
    
    # Project Notes Operations
    async def create_project_note(
        self, 
        user_id: str, 
        project_id: str, 
        note_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new project note"""
        note_dict = note_data.copy()
        note_dict['user_id'] = user_id
        note_dict['project_id'] = project_id
        note_dict['created_at'] = datetime.utcnow()
        note_dict['updated_at'] = datetime.utcnow()
        
        # Insert note
        result = await self.notes_collection.insert_one(note_dict)
        note_dict['_id'] = result.inserted_id
        note_dict['id'] = str(note_dict['_id'])
        
        return note_dict
    
    async def get_project_notes(
        self, 
        user_id: str, 
        project_id: str,
        note_type: Optional[str] = None,
        project_phase: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all notes for a project with optional filtering"""
        query_filters = {
            'user_id': user_id,
            'project_id': project_id
        }
        
        if note_type:
            query_filters['note_type'] = note_type
        if project_phase:
            query_filters['project_phase'] = project_phase
        
        cursor = self.notes_collection.find(query_filters).sort([
            ('created_at', DESCENDING)
        ])
        
        notes = []
        async for note in cursor:
            note['id'] = str(note['_id'])
            notes.append(note)
        
        return notes
    
    # Statistics and Analytics
    async def get_project_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive project statistics for a user"""
        # Total projects
        total_projects = await self.projects_collection.count_documents({
            'user_id': user_id,
            'status': 'active'
        })
        
        # Projects by phase
        phase_pipeline = [
            {'$match': {'user_id': user_id, 'status': 'active'}},
            {'$group': {'_id': '$current_phase', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        phase_results = await self.projects_collection.aggregate(phase_pipeline).to_list(None)
        projects_by_phase = {result['_id']: result['count'] for result in phase_results}
        
        # Projects by type
        type_pipeline = [
            {'$match': {'user_id': user_id, 'status': 'active'}},
            {'$group': {'_id': '$project_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        type_results = await self.projects_collection.aggregate(type_pipeline).to_list(None)
        projects_by_type = {result['_id']: result['count'] for result in type_results}
        
        # Total files and notes
        total_files = await self.files_collection.count_documents({
            'user_id': user_id,
            'status': 'active'
        })
        
        total_notes = await self.notes_collection.count_documents({
            'user_id': user_id
        })
        
        # Completion rate calculation
        completed_projects = await self.projects_collection.count_documents({
            'user_id': user_id,
            'status': 'completed'
        })
        
        completion_rate = 0.0
        if total_projects > 0:
            completion_rate = (completed_projects / total_projects) * 100
        
        # Average project duration (for completed projects)
        duration_pipeline = [
            {
                '$match': {
                    'user_id': user_id, 
                    'status': 'completed',
                    'timeline_start': {'$ne': None},
                    'timeline_end': {'$ne': None}
                }
            },
            {
                '$project': {
                    'duration_days': {
                        '$divide': [
                            {'$subtract': ['$timeline_end', '$timeline_start']}, 
                            86400000  # Convert milliseconds to days
                        ]
                    }
                }
            },
            {
                '$group': {
                    '_id': None,
                    'avg_duration': {'$avg': '$duration_days'}
                }
            }
        ]
        
        duration_results = await self.projects_collection.aggregate(duration_pipeline).to_list(1)
        avg_duration = duration_results[0]['avg_duration'] if duration_results else None
        
        return {
            'total_projects': total_projects,
            'projects_by_phase': projects_by_phase,
            'projects_by_type': projects_by_type,
            'total_files': total_files,
            'total_notes': total_notes,
            'completion_rate': round(completion_rate, 2),
            'average_project_duration': round(avg_duration, 1) if avg_duration else None
        }
    
    # Integration with existing flightbook system
    async def link_flightbook_entry(self, project_id: str, user_id: str, entry_id: str) -> bool:
        """Link a flightbook entry to a project"""
        result = await self.projects_collection.update_one(
            {'_id': ObjectId(project_id), 'user_id': user_id},
            {'$addToSet': {'flightbook_entries': entry_id}}
        )
        return result.modified_count > 0
    
    async def mark_deliverable_complete(
        self, 
        project_id: str, 
        user_id: str, 
        deliverable_id: str
    ) -> bool:
        """Mark a deliverable as completed"""
        result = await self.projects_collection.update_one(
            {'_id': ObjectId(project_id), 'user_id': user_id},
            {
                '$addToSet': {'completed_deliverables': deliverable_id},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        return result.modified_count > 0