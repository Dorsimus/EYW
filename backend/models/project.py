from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class ProjectFileCreate(BaseModel):
    """Schema for creating project files"""
    title: str = Field(..., min_length=1, max_length=200, description="File title")
    description: Optional[str] = Field(None, max_length=1000, description="File description")
    project_phase: str = Field(..., description="Project phase: planning, execution, completion")
    deliverable_type: str = Field(..., description="Type of deliverable")
    portfolio_tag: str = Field(..., description="Portfolio organization tag")
    competency_areas: List[str] = Field(default_factory=list, description="Related competency areas")
    file_path: Optional[str] = Field(None, description="File storage path")
    original_filename: Optional[str] = Field(None, description="Original uploaded filename")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="File MIME type")
    is_template_based: bool = Field(default=False, description="Whether file uses provided template")
    
    @validator('project_phase')
    def validate_phase(cls, v):
        allowed_phases = ['planning', 'execution', 'completion']
        if v not in allowed_phases:
            raise ValueError(f"project_phase must be one of: {allowed_phases}")
        return v

class ProjectFileUpdate(BaseModel):
    """Schema for updating project files"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    portfolio_tag: Optional[str] = Field(None)
    competency_areas: Optional[List[str]] = Field(None)

class ProjectFile(ProjectFileCreate):
    """Complete project file schema with database fields"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="User ID who owns this file")
    project_id: str = Field(..., description="Project ID this file belongs to")
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="active", description="File status: active, archived, deleted")
    version: int = Field(default=1, description="File version number")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProjectCreate(BaseModel):
    """Schema for creating new projects"""
    title: str = Field(..., min_length=1, max_length=500, description="Project title")
    description: str = Field(..., min_length=1, max_length=2000, description="Project description")
    project_type: str = Field(..., description="Project type/option selected")
    competency_areas: List[str] = Field(..., description="All competency areas this project addresses")
    current_phase: str = Field(default="planning", description="Current project phase")
    timeline_start: Optional[datetime] = Field(None, description="Project start date")
    timeline_end: Optional[datetime] = Field(None, description="Expected completion date")
    
    @validator('current_phase')
    def validate_current_phase(cls, v):
        allowed_phases = ['planning', 'execution', 'completion', 'presented', 'archived']
        if v not in allowed_phases:
            raise ValueError(f"current_phase must be one of: {allowed_phases}")
        return v

class ProjectUpdate(BaseModel):
    """Schema for updating projects"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    current_phase: Optional[str] = Field(None)
    timeline_start: Optional[datetime] = Field(None)
    timeline_end: Optional[datetime] = Field(None)
    
    @validator('current_phase')
    def validate_current_phase(cls, v):
        if v is not None:
            allowed_phases = ['planning', 'execution', 'completion', 'presented', 'archived']
            if v not in allowed_phases:
                raise ValueError(f"current_phase must be one of: {allowed_phases}")
        return v

class ProjectNote(BaseModel):
    """Schema for project notes and reflections"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="User ID")
    project_id: str = Field(..., description="Project ID")
    title: str = Field(..., min_length=1, max_length=200, description="Note title")
    content: str = Field(..., min_length=1, description="Note content")
    note_type: str = Field(default="reflection", description="Type: reflection, milestone, challenge, lesson")
    project_phase: str = Field(..., description="Associated project phase")
    tags: List[str] = Field(default_factory=list, description="Note tags")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Project(ProjectCreate):
    """Complete project schema with database fields"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="User ID who owns this project")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="active", description="Project status: active, completed, archived")
    
    # Phase tracking
    phase_history: List[Dict[str, Any]] = Field(default_factory=list, description="Phase transition history")
    
    # Deliverable tracking
    required_deliverables: List[Dict[str, Any]] = Field(default_factory=list, description="Required deliverables list")
    completed_deliverables: List[str] = Field(default_factory=list, description="List of completed deliverable IDs")
    
    # Integration with existing systems
    flightbook_entries: List[str] = Field(default_factory=list, description="Associated flightbook entry IDs")
    portfolio_items: List[str] = Field(default_factory=list, description="Associated portfolio item IDs")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProjectResponse(BaseModel):
    """Project response schema for API responses"""
    id: str
    title: str
    description: str
    project_type: str
    competency_areas: List[str]
    current_phase: str
    timeline_start: Optional[datetime]
    timeline_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    status: str
    phase_history: List[Dict[str, Any]]
    required_deliverables: List[Dict[str, Any]]
    completed_deliverables: List[str]
    flightbook_entries: List[str]
    portfolio_items: List[str]

class ProjectFileResponse(BaseModel):
    """Project file response schema for API responses"""
    id: str
    title: str
    description: Optional[str]
    project_phase: str
    deliverable_type: str
    portfolio_tag: str
    competency_areas: List[str]
    file_path: Optional[str]
    original_filename: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    is_template_based: bool
    upload_date: datetime
    updated_at: datetime
    status: str
    version: int

class ProjectNoteResponse(BaseModel):
    """Project note response schema for API responses"""
    id: str
    title: str
    content: str
    note_type: str
    project_phase: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime

class ProjectStatsResponse(BaseModel):
    """Project statistics response schema"""
    total_projects: int
    projects_by_phase: Dict[str, int]
    projects_by_type: Dict[str, int]
    total_files: int
    total_notes: int
    completion_rate: float
    average_project_duration: Optional[float]