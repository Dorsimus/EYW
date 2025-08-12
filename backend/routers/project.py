from fastapi import APIRouter, Depends, HTTPException, Query, Path, File, UploadFile, Form, status
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from core.auth import require_auth
from core.database import get_database
from models.project import (
    Project, ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectFile, ProjectFileCreate, ProjectFileUpdate, ProjectFileResponse,
    ProjectNote, ProjectNoteResponse, ProjectStatsResponse
)
from services.project_service import ProjectService

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Create a new culminating project"""
    service = ProjectService(db)
    
    try:
        project = await service.create_project(
            user_id=current_user['user_id'],
            project_data=project_data
        )
        return ProjectResponse(**project)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )

@router.get("/", response_model=List[ProjectResponse])
async def get_user_projects(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    current_phase: Optional[str] = Query(None, description="Filter by current phase"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get all projects for the current user"""
    service = ProjectService(db)
    
    try:
        projects = await service.get_user_projects(
            user_id=current_user['user_id'],
            status=status_filter,
            current_phase=current_phase
        )
        
        return [ProjectResponse(**project) for project in projects]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve projects"
        )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str = Path(..., description="Project ID"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get a specific project by ID"""
    service = ProjectService(db)
    
    try:
        project = await service.get_project_by_id(
            project_id=project_id,
            user_id=current_user['user_id']
        )
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return ProjectResponse(**project)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project"
        )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Update an existing project"""
    service = ProjectService(db)
    
    try:
        project = await service.update_project(
            project_id=project_id,
            user_id=current_user['user_id'],
            update_data=project_data
        )
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return ProjectResponse(**project)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )

# Project Files Endpoints
@router.post("/{project_id}/files", response_model=ProjectFileResponse, status_code=status.HTTP_201_CREATED)
async def upload_project_file(
    project_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    project_phase: str = Form(...),
    deliverable_type: str = Form(...),
    portfolio_tag: str = Form(...),
    competency_areas: str = Form("[]"),
    is_template_based: bool = Form(False),
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Upload a new project file"""
    service = ProjectService(db)
    
    try:
        # Parse competency areas
        competency_areas_list = json.loads(competency_areas) if competency_areas else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in competency_areas"
        )
    
    try:
        # Create file data object
        file_data = ProjectFileCreate(
            title=title,
            description=description,
            project_phase=project_phase,
            deliverable_type=deliverable_type,
            portfolio_tag=portfolio_tag,
            competency_areas=competency_areas_list,
            original_filename=file.filename,
            file_size=file.size if hasattr(file, 'size') else None,
            mime_type=file.content_type,
            is_template_based=is_template_based
        )
        
        # TODO: Implement file storage (integrate with existing file upload system)
        # For now, we'll create the record without actual file storage
        
        project_file = await service.create_project_file(
            user_id=current_user['user_id'],
            project_id=project_id,
            file_data=file_data
        )
        
        return ProjectFileResponse(**project_file)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload project file"
        )

@router.get("/{project_id}/files", response_model=List[ProjectFileResponse])
async def get_project_files(
    project_id: str,
    project_phase: Optional[str] = Query(None, description="Filter by project phase"),
    deliverable_type: Optional[str] = Query(None, description="Filter by deliverable type"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get all files for a project"""
    service = ProjectService(db)
    
    try:
        files = await service.get_project_files(
            user_id=current_user['user_id'],
            project_id=project_id,
            project_phase=project_phase,
            deliverable_type=deliverable_type
        )
        
        return [ProjectFileResponse(**file_doc) for file_doc in files]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project files"
        )

@router.put("/files/{file_id}", response_model=ProjectFileResponse)
async def update_project_file(
    file_id: str,
    file_data: ProjectFileUpdate,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Update project file metadata"""
    service = ProjectService(db)
    
    try:
        file_doc = await service.update_project_file(
            file_id=file_id,
            user_id=current_user['user_id'],
            update_data=file_data
        )
        
        if not file_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project file not found"
            )
        
        return ProjectFileResponse(**file_doc)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project file"
        )

# Project Notes Endpoints
@router.post("/{project_id}/notes", response_model=ProjectNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_project_note(
    project_id: str,
    title: str = Form(...),
    content: str = Form(...),
    note_type: str = Form("reflection"),
    project_phase: str = Form(...),
    tags: str = Form("[]"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Create a new project note"""
    service = ProjectService(db)
    
    try:
        # Parse tags
        tags_list = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in tags"
        )
    
    try:
        note_data = {
            'title': title,
            'content': content,
            'note_type': note_type,
            'project_phase': project_phase,
            'tags': tags_list
        }
        
        note = await service.create_project_note(
            user_id=current_user['user_id'],
            project_id=project_id,
            note_data=note_data
        )
        
        return ProjectNoteResponse(**note)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project note"
        )

@router.get("/{project_id}/notes", response_model=List[ProjectNoteResponse])
async def get_project_notes(
    project_id: str,
    note_type: Optional[str] = Query(None, description="Filter by note type"),
    project_phase: Optional[str] = Query(None, description="Filter by project phase"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get all notes for a project"""
    service = ProjectService(db)
    
    try:
        notes = await service.get_project_notes(
            user_id=current_user['user_id'],
            project_id=project_id,
            note_type=note_type,
            project_phase=project_phase
        )
        
        return [ProjectNoteResponse(**note) for note in notes]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project notes"
        )

# Integration Endpoints
@router.post("/{project_id}/link-flightbook/{entry_id}")
async def link_flightbook_entry(
    project_id: str,
    entry_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Link a flightbook entry to a project"""
    service = ProjectService(db)
    
    try:
        success = await service.link_flightbook_entry(
            project_id=project_id,
            user_id=current_user['user_id'],
            entry_id=entry_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return {"message": "Flightbook entry linked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to link flightbook entry"
        )

@router.post("/{project_id}/deliverables/{deliverable_id}/complete")
async def mark_deliverable_complete(
    project_id: str,
    deliverable_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Mark a deliverable as completed"""
    service = ProjectService(db)
    
    try:
        success = await service.mark_deliverable_complete(
            project_id=project_id,
            user_id=current_user['user_id'],
            deliverable_id=deliverable_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return {"message": "Deliverable marked as complete"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark deliverable complete"
        )

# Statistics Endpoint
@router.get("/statistics/overview", response_model=ProjectStatsResponse)
async def get_project_statistics(
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get comprehensive project statistics"""
    service = ProjectService(db)
    
    try:
        stats = await service.get_project_statistics(
            user_id=current_user['user_id']
        )
        
        return ProjectStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate project statistics"
        )