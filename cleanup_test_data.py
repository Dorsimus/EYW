#!/usr/bin/env python3
"""
Production Data Cleanup Script
Removes test/demo data from EarnWings Navigator Level Leadership & Development system
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('backend/.env')

async def cleanup_production_data():
    """Remove test/demo data from production database"""
    
    print("🧹 PRODUCTION DATA CLEANUP SCRIPT")
    print("=" * 50)
    print(f"Started at: {datetime.utcnow().isoformat()}")
    print()
    
    # Connect to database
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Test database connection
        await db.command('ping')
        print("✅ Database connection established")
        
        # 1. Remove test flightbook entries
        print("\n1. CLEANING FLIGHTBOOK ENTRIES")
        print("-" * 30)
        
        test_flightbook_ids = [
            "49084c77-466b-4ac9-847d-4b7adb1a4f98",
            "3fd346aa-c458-4fcc-821f-4fe897184b9c", 
            "11928fd5-b2d2-4a11-b6c7-f01cf6399f8d",
            "07c4e6c3-12a0-446e-8036-bdf6e200f670",
            "91c247fd-bad7-4f5c-916f-f9166c886a42",
            "a8af0c8c-1657-41a2-901a-71e847690aaf",
            "4fef85e0-e164-40fd-9db7-22a0d8300e67",
            "a46c094a-f945-4c7b-89f1-4045c60f06ca"
        ]
        
        # Remove test entries
        result = await db.demo_flightbook_entries.delete_many({
            "id": {"$in": test_flightbook_ids}
        })
        print(f"✅ Removed {result.deleted_count} test flightbook entries")
        
        # Also remove by content pattern (backup cleanup)
        result2 = await db.demo_flightbook_entries.delete_many({
            "$or": [
                {"content": {"$regex": "testing", "$options": "i"}},
                {"content": {"$regex": "enhanced flightbook integration", "$options": "i"}},
                {"content": {"$regex": "comprehensive testing", "$options": "i"}},
                {"content": {"$regex": "test completion", "$options": "i"}}
            ]
        })
        print(f"✅ Removed {result2.deleted_count} additional test entries by pattern")
        
        # 2. Review and handle demo users
        print("\n2. REVIEWING DEMO USERS")
        print("-" * 25)
        
        demo_users = await db.users.find({
            "$or": [
                {"email": {"$regex": "test@", "$options": "i"}},
                {"email": {"$regex": "demo@", "$options": "i"}},
                {"id": {"$regex": "demo-", "$options": "i"}},
                {"id": {"$regex": "test-", "$options": "i"}}
            ]
        }).to_list(1000)
        
        print(f"Found {len(demo_users)} demo/test users:")
        for user in demo_users:
            email = user.get('email', 'No email')
            user_id = user.get('id', 'No ID')
            print(f"  - {email} (ID: {user_id})")
        
        # Remove test@example.com user (clearly a test user)
        result = await db.users.delete_many({
            "email": "test@example.com"
        })
        print(f"✅ Removed {result.deleted_count} test@example.com users")
        
        # 3. Clean up test task completions
        print("\n3. CLEANING TASK COMPLETIONS")
        print("-" * 30)
        
        # Remove completions by demo/test users
        result = await db.task_completions.delete_many({
            "$or": [
                {"user_id": {"$regex": "demo-user", "$options": "i"}},
                {"user_id": {"$regex": "test-user", "$options": "i"}},
                {"user_id": "invalid-user-id"},
                {"notes": {"$regex": "test", "$options": "i"}},
                {"evidence_description": {"$regex": "test", "$options": "i"}}
            ]
        })
        print(f"✅ Removed {result.deleted_count} test task completions")
        
        # 4. Clean up competency progress for removed users
        print("\n4. CLEANING COMPETENCY PROGRESS")
        print("-" * 35)
        
        result = await db.competency_progress.delete_many({
            "$or": [
                {"user_id": {"$regex": "demo-user", "$options": "i"}},
                {"user_id": {"$regex": "test-user", "$options": "i"}},
                {"user_id": "invalid-user-id"}
            ]
        })
        print(f"✅ Removed {result.deleted_count} test competency progress records")
        
        # 5. Verify cleanup results
        print("\n5. VERIFICATION")
        print("-" * 15)
        
        # Count remaining entries
        remaining_flightbook = await db.demo_flightbook_entries.count_documents({})
        remaining_users = await db.users.count_documents({})
        remaining_completions = await db.task_completions.count_documents({})
        remaining_progress = await db.competency_progress.count_documents({})
        
        print(f"✅ Remaining flightbook entries: {remaining_flightbook}")
        print(f"✅ Remaining users: {remaining_users}")
        print(f"✅ Remaining task completions: {remaining_completions}")
        print(f"✅ Remaining competency progress: {remaining_progress}")
        
        # Check for any remaining test content
        test_content = await db.demo_flightbook_entries.find({
            "$or": [
                {"content": {"$regex": "test", "$options": "i"}},
                {"title": {"$regex": "test", "$options": "i"}}
            ]
        }).to_list(10)
        
        if test_content:
            print(f"⚠️  WARNING: {len(test_content)} entries still contain 'test' content")
            for entry in test_content:
                print(f"   - {entry.get('title', 'No title')[:50]}...")
        else:
            print("✅ No test content found in remaining flightbook entries")
        
        print("\n" + "=" * 50)
        print("🎉 CLEANUP COMPLETED SUCCESSFULLY")
        print(f"Finished at: {datetime.utcnow().isoformat()}")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_production_data())