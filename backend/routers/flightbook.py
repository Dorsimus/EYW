from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from typing import List, Optional, Dict, Any
from datetime import date, datetime

from core.auth import require_auth
from core.database import get_database
from models.flightbook import (
    FlightbookEntry, 
    FlightbookEntryCreate, 
    FlightbookEntryUpdate, 
    FlightbookEntryResponse,
    FlightbookStats,
    BulkFlightbookResponse
)
from services.flightbook_service import FlightbookService

router = APIRouter(prefix="/api/v1/flightbook", tags=["flightbook"])

@router.post("/", response_model=FlightbookEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_flightbook_entry(
    entry_data: FlightbookEntryCreate,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Create a new flightbook entry"""
    service = FlightbookService(db)
    
    try:
        entry = await service.create_entry(
            user_id=current_user['user_id'],
            entry_data=entry_data
        )
        return FlightbookEntryResponse(**entry)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create flightbook entry"
        )

@router.get("/", response_model=List[FlightbookEntryResponse])
async def get_flightbook_entries(
    competency_area: Optional[str] = Query(None, description="Filter by competency area"),
    sub_competency: Optional[str] = Query(None, description="Filter by sub-competency"),
    entry_type: Optional[str] = Query(None, description="Filter by entry type"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Results per page"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get flightbook entries with optional filtering"""
    service = FlightbookService(db)
    
    try:
        # Build filter criteria
        filters = {}
        if competency_area:
            filters['competency_area'] = competency_area.lower()
        if sub_competency:
            filters['sub_competency'] = sub_competency.lower()
        if entry_type:
            filters['entry_type'] = entry_type.lower()
        
        # Handle search and tags
        if search or tags:
            tag_list = [tag.strip().lower() for tag in tags.split(',')] if tags else None
            entries = await service.search_entries(
                user_id=current_user['user_id'],
                search_text=search,
                tags=tag_list
            )
            
            # Manual pagination for search results
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_entries = entries[start_idx:end_idx]
            
            return [FlightbookEntryResponse(**entry) for entry in paginated_entries]
        
        # Regular filtered query
        entries, total_count = await service.get_entries_paginated(
            user_id=current_user['user_id'],
            filters=filters,
            page=page,
            limit=limit
        )
        
        # Add pagination headers would go here in real implementation
        return [FlightbookEntryResponse(**entry) for entry in entries]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve flightbook entries"
        )

@router.get("/{entry_id}", response_model=FlightbookEntryResponse)
async def get_flightbook_entry(
    entry_id: str = Path(..., description="Flightbook entry ID"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get a specific flightbook entry by ID"""
    service = FlightbookService(db)
    
    try:
        entry = await service.get_entry_by_id(
            entry_id=entry_id,
            user_id=current_user['user_id']
        )
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flightbook entry not found"
            )
        
        return FlightbookEntryResponse(**entry)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve flightbook entry"
        )

@router.put("/{entry_id}", response_model=FlightbookEntryResponse)
async def update_flightbook_entry(
    entry_id: str,
    entry_data: FlightbookEntryUpdate,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Update an existing flightbook entry"""
    service = FlightbookService(db)
    
    try:
        entry = await service.update_entry(
            entry_id=entry_id,
            user_id=current_user['user_id'],
            update_data=entry_data
        )
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flightbook entry not found"
            )
        
        return FlightbookEntryResponse(**entry)
        
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
            detail="Failed to update flightbook entry"
        )

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flightbook_entry(
    entry_id: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Delete a flightbook entry"""
    service = FlightbookService(db)
    
    try:
        deleted = await service.delete_entry(
            entry_id=entry_id,
            user_id=current_user['user_id']
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flightbook entry not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete flightbook entry"
        )

@router.get("/competency/{competency_area}", response_model=List[FlightbookEntryResponse])
async def get_entries_by_competency(
    competency_area: str = Path(..., description="Competency area"),
    sub_competency: Optional[str] = Query(None, description="Sub-competency area"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get all flightbook entries for a specific competency"""
    service = FlightbookService(db)
    
    try:
        entries = await service.get_entries_by_competency(
            user_id=current_user['user_id'],
            competency_area=competency_area.lower(),
            sub_competency=sub_competency.lower() if sub_competency else None
        )
        
        return [FlightbookEntryResponse(**entry) for entry in entries]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve competency entries"
        )

@router.get("/statistics/overview", response_model=FlightbookStats)
async def get_flightbook_statistics(
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Get comprehensive flightbook statistics"""
    service = FlightbookService(db)
    
    try:
        stats = await service.get_statistics(
            user_id=current_user['user_id']
        )
        
        return FlightbookStats(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate statistics"
        )

# Special endpoint for journal context (create or update by key)
@router.post("/journal", response_model=FlightbookEntryResponse)
async def create_or_update_journal_entry(
    entry_data: FlightbookEntryCreate,
    entry_key: Optional[str] = Query(None, description="Unique key for journal context"),
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Create or update flightbook entry from journal reflection"""
    service = FlightbookService(db)
    
    try:
        if entry_key:
            entry = await service.create_or_update_by_key(
                user_id=current_user['user_id'],
                entry_key=entry_key,
                entry_data=entry_data
            )
        else:
            entry = await service.create_entry(
                user_id=current_user['user_id'],
                entry_data=entry_data
            )
        
        return FlightbookEntryResponse(**entry)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create/update journal entry"
        )

# Bulk operations for data migration
@router.post("/bulk", response_model=BulkFlightbookResponse)
async def bulk_create_flightbook_entries(
    entries_data: List[FlightbookEntryCreate],
    current_user: Dict[str, Any] = Depends(require_auth),
    db = Depends(get_database)
):
    """Bulk create flightbook entries for data migration"""
    service = FlightbookService(db)
    
    if len(entries_data) > 100:  # Limit bulk operations
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 100 entries per bulk operation"
        )
    
    try:
        results = await service.bulk_create_entries(
            user_id=current_user['user_id'],
            entries_data=entries_data
        )
        
        response_entries = [FlightbookEntryResponse(**entry) for entry in results['created_entries']]
        
        return BulkFlightbookResponse(
            success=results['success'],
            processed=results['processed'],
            errors=results['errors'],
            created_entries=response_entries
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create entries in bulk"
        )