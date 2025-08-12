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
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class FlightbookVersionHistory(BaseModel):
    """Version history for flightbook entry changes"""
    version: int = Field(..., ge=1, description="Version number")
    content: str = Field(..., description="Content at this version")
    updated_at: datetime = Field(..., description="When this version was created")
    change_summary: str = Field(..., description="Summary of changes made")

class FlightbookEntryCreate(BaseModel):
    """Schema for creating new flightbook entries"""
    title: str = Field(..., min_length=1, max_length=500, description="Entry title")
    content: str = Field(..., min_length=1, max_length=50000, description="Entry content/reflection")
    competency_area: str = Field(..., description="Competency area this entry relates to")
    sub_competency: Optional[str] = Field(None, description="Sub-competency area")
    task_id: Optional[str] = Field(None, description="Associated task ID")
    entry_type: str = Field(default="reflection", description="Type of entry: reflection, note, story, etc.")
    source: str = Field(default="manual", description="Source of entry: manual, auto-generated, etc.")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    original_prompt: Optional[str] = Field(None, description="Original prompt that generated this entry")
    
    @validator('tags')
    def validate_tags(cls, v):
        # Ensure tags are lowercase and contain only alphanumeric characters and hyphens
        return [tag.lower().replace('_', '-') for tag in v if tag and isinstance(tag, str)]
    
    @validator('competency_area', 'sub_competency', 'task_id')
    def validate_identifiers(cls, v):
        if v:
            return v.lower()
        return v

class FlightbookEntryUpdate(BaseModel):
    """Schema for updating existing flightbook entries"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1, max_length=50000)
    tags: Optional[List[str]] = Field(None)
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            return [tag.lower().replace('_', '-') for tag in v if tag and isinstance(tag, str)]
        return v

class FlightbookEntry(FlightbookEntryCreate):
    """Complete flightbook entry schema with database fields"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="Clerk user ID")
    entry_key: Optional[str] = Field(None, description="Unique key for identifying journal context")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1, ge=1)
    version_history: List[FlightbookVersionHistory] = Field(default_factory=list)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class FlightbookEntryResponse(BaseModel):
    """Flightbook entry response schema for API responses"""
    id: str
    title: str
    content: str
    competency_area: str
    sub_competency: Optional[str]
    task_id: Optional[str]
    entry_type: str
    source: str
    tags: List[str]
    original_prompt: Optional[str]
    entry_key: Optional[str]
    created_at: datetime
    updated_at: datetime
    version: int
    version_history: List[FlightbookVersionHistory]

class FlightbookStats(BaseModel):
    """Flightbook statistics response schema"""
    total_entries: int
    entries_by_competency: Dict[str, int]
    entries_by_type: Dict[str, int]
    entries_by_month: Dict[str, int]
    most_used_tags: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    version_history_count: int

class BulkFlightbookResponse(BaseModel):
    """Response schema for bulk operations"""
    success: bool
    processed: int
    errors: List[str]
    created_entries: List[FlightbookEntryResponse]