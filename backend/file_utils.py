"""
File handling utilities extracted from server.py to avoid circular imports
"""

from fastapi import HTTPException, UploadFile
from pathlib import Path
import uuid
from datetime import datetime
from typing import Dict, Any
import logging

# Enhanced File Storage Configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create organized directory structure for portfolio files
PORTFOLIO_DIR = UPLOAD_DIR / "portfolio"
EVIDENCE_DIR = UPLOAD_DIR / "evidence" 
TEMP_DIR = UPLOAD_DIR / "temp"

# Create subdirectories
for directory in [PORTFOLIO_DIR, EVIDENCE_DIR, TEMP_DIR]:
    directory.mkdir(exist_ok=True)

# File upload constraints
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    '.mp4', '.mov', '.avi', '.wmv',
    '.txt', '.rtf'
}

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'image/jpeg',
    'image/jpg',  # Some systems use this
    'image/png',
    'image/gif',
    'image/bmp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'text/plain',
    'text/rtf'
}

# File Management Utilities
def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file for security and size constraints"""
    if not file.filename:
        return False, "Filename is required"
    
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        return False, f"File type {file_extension} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check MIME type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        return False, f"MIME type {file.content_type} not allowed"
    
    return True, "Valid file"

def generate_secure_filename(original_filename: str, file_id: str) -> str:
    """Generate secure filename with UUID prefix and sanitized original name"""
    # Sanitize original filename (keep extension)
    file_extension = Path(original_filename).suffix.lower()
    safe_name = "".join(c for c in Path(original_filename).stem if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_name = safe_name[:50]  # Limit length
    
    # Create secure filename: UUID_sanitized_name.ext
    return f"{file_id}_{safe_name}{file_extension}" if safe_name else f"{file_id}{file_extension}"

def get_file_storage_path(file_type: str, user_id: str, file_id: str) -> Path:
    """Generate organized storage path based on file type and user"""
    current_date = datetime.utcnow()
    year_month = current_date.strftime("%Y-%m")
    
    if file_type == "portfolio":
        base_dir = PORTFOLIO_DIR
    elif file_type == "evidence":
        base_dir = EVIDENCE_DIR
    else:
        base_dir = TEMP_DIR
    
    # Create path: uploads/portfolio/2024-01/user_id/
    user_dir = base_dir / year_month / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    
    return user_dir

async def save_uploaded_file(file: UploadFile, file_type: str, user_id: str, file_id: str) -> Dict[str, Any]:
    """Save uploaded file with proper organization and security"""
    # Validate file
    is_valid, message = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Check file size (read file to check size)
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate secure filename and path
    secure_filename = generate_secure_filename(file.filename, file_id)
    storage_path = get_file_storage_path(file_type, user_id, file_id)
    file_path = storage_path / secure_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    return {
        "file_path": str(file_path),
        "original_filename": file.filename,
        "secure_filename": secure_filename,
        "file_size": file_size,
        "mime_type": file.content_type,
        "file_type": file_type
    }

def delete_file(file_path: str) -> bool:
    """Safely delete a file"""
    try:
        if file_path and Path(file_path).exists():
            Path(file_path).unlink()
            return True
    except Exception as e:
        logging.error(f"Failed to delete file {file_path}: {str(e)}")
    return False

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