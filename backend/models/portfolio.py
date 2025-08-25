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

class PortfolioItemCreate(BaseModel):
    """Schema for creating portfolio items"""
    title: str = Field(..., description="Portfolio item title")
    description: str = Field(..., description="Item description")
    competency_areas: List[str] = Field(default_factory=list, description="Related competency areas")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    visibility: str = Field(default="private", description="Visibility: private, managers, mentors, public")
    file_type: str = Field(default="portfolio", description="File type category")

class PortfolioItemUpdate(BaseModel):
    """Schema for updating portfolio items"""
    title: Optional[str] = None
    description: Optional[str] = None
    competency_areas: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    visibility: Optional[str] = None

class PortfolioItem(PortfolioItemCreate):
    """Complete portfolio item schema with database fields"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="Owner user ID")
    file_path: Optional[str] = Field(None, description="File storage path")
    original_filename: Optional[str] = Field(None, description="Original filename")
    secure_filename: Optional[str] = Field(None, description="Secure storage filename")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="File MIME type")
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="active", description="Status: active, archived, deleted")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PortfolioItemResponse(BaseModel):
    """Portfolio item response schema for API responses"""
    id: str
    title: str
    description: str
    competency_areas: List[str]
    tags: List[str]
    visibility: str
    file_type: str
    file_path: Optional[str]
    original_filename: Optional[str]
    secure_filename: Optional[str]
    file_size: Optional[int]
    file_size_formatted: Optional[str]  # Human readable file size
    mime_type: Optional[str]
    upload_date: datetime
    updated_at: datetime
    status: str

# File storage utilities
def format_file_size(size_bytes: int) -> str:
    """Format file size for human readability"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"