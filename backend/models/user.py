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

class UserCreate(BaseModel):
    """Schema for creating new users"""
    clerk_user_id: str = Field(..., description="Clerk authentication user ID")
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: str = Field(default="participant", description="User role: participant, mentor, manager, admin")
    level: str = Field(default="navigator", description="Current program level")
    is_admin: bool = Field(default=False, description="Admin privileges flag")
    
class UserUpdate(BaseModel):
    """Schema for updating user information"""
    name: Optional[str] = Field(None, description="Updated user name")
    role: Optional[str] = Field(None, description="Updated role")
    level: Optional[str] = Field(None, description="Updated level")
    is_admin: Optional[bool] = Field(None, description="Updated admin status")

class User(UserCreate):
    """Complete user schema with database fields"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional user metadata")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    """User response schema for API responses"""
    id: str
    clerk_user_id: str
    email: str
    name: str
    role: str
    level: str
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    metadata: Dict[str, Any]