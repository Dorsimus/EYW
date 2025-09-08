#!/usr/bin/env python3
"""
Production Readiness Verification Script
Final verification that EarnWings Navigator Level Leadership & Development system is production-ready
"""

import asyncio
import os
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('backend/.env')

async def verify_production_readiness():
    """Comprehensive verification of production readiness"""
    
    print("🔍 PRODUCTION READINESS VERIFICATION")
    print("=" * 50)
    print(f"Verification started: {datetime.utcnow().isoformat()}")
    print()
    
    # Connect to database
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    verification_results = {
        "database_content": False,
        "api_functionality": False,
        "data_integrity": False,
        "configuration": False,
        "cleanup_status": False
    }
    
    try:
        # Test database connection
        await db.command('ping')
        print("✅ Database connection verified")
        
        # 1. Verify Leadership & Supervision content quality
        print("\n1. CONTENT QUALITY VERIFICATION")
        print("-" * 35)
        
        leadership_tasks = await db.tasks.find({
            "competency_area": "leadership_supervision",
            "active": True
        }).to_list(1000)
        
        print(f"✅ Found {len(leadership_tasks)} Leadership & Supervision tasks")
        
        # Check for professional content
        professional_content = True
        real_links = 0
        
        for task in leadership_tasks:
            title = task.get('title', '')
            description = task.get('description', '')
            external_link = task.get('external_link', '')
            
            # Verify no placeholder content
            if any(word in title.lower() for word in ['test', 'demo', 'placeholder', 'sample']):
                print(f"❌ Placeholder title found: {title}")
                professional_content = False
            
            if any(word in description.lower() for word in ['dummy', 'example', 'placeholder', 'lorem']):
                print(f"❌ Placeholder description found: {task.get('id', 'unknown')}")
                professional_content = False
            
            # Count real external links
            if external_link and not any(word in external_link for word in ['example.com', 'your-lms.com', 'test.com']):
                real_links += 1
        
        if professional_content:
            print("✅ All task content is professional quality")
            verification_results["database_content"] = True
        
        print(f"✅ {real_links} tasks have real external LMS links")
        
        # 2. Verify API functionality
        print("\n2. API FUNCTIONALITY VERIFICATION")
        print("-" * 35)
        
        try:
            # Test health endpoint
            health_response = requests.get("http://localhost:8001/api/health", timeout=5)
            if health_response.status_code == 200:
                print("✅ Health endpoint responding")
                
                # Test leadership tasks endpoint
                tasks_response = requests.get("http://localhost:8001/api/tasks/leadership_supervision/inspiring_team_motivation", timeout=5)
                if tasks_response.status_code == 200:
                    tasks_data = tasks_response.json()
                    print(f"✅ Leadership tasks endpoint returning {len(tasks_data)} tasks")
                    verification_results["api_functionality"] = True
                else:
                    print(f"❌ Tasks endpoint error: {tasks_response.status_code}")
            else:
                print(f"❌ Health endpoint error: {health_response.status_code}")
                
        except requests.RequestException as e:
            print(f"❌ API request failed: {str(e)}")
        
        # 3. Verify data integrity
        print("\n3. DATA INTEGRITY VERIFICATION")
        print("-" * 32)
        
        # Check for test/demo content
        test_flightbook = await db.demo_flightbook_entries.find({
            "$or": [
                {"content": {"$regex": "test", "$options": "i"}},
                {"content": {"$regex": "testing", "$options": "i"}},
                {"title": {"$regex": "test", "$options": "i"}}
            ]
        }).to_list(10)
        
        test_users = await db.users.find({
            "$or": [
                {"email": {"$regex": "test@", "$options": "i"}},
                {"email": {"$regex": "demo@", "$options": "i"}},
                {"id": {"$regex": "demo-", "$options": "i"}}
            ]
        }).to_list(10)
        
        test_completions = await db.task_completions.find({
            "$or": [
                {"user_id": {"$regex": "demo-user", "$options": "i"}},
                {"user_id": {"$regex": "test-user", "$options": "i"}},
                {"user_id": "invalid-user-id"}
            ]
        }).to_list(10)
        
        if len(test_flightbook) == 0 and len(test_users) == 0 and len(test_completions) == 0:
            print("✅ No test/demo data found")
            verification_results["data_integrity"] = True
            verification_results["cleanup_status"] = True
        else:
            print(f"❌ Found {len(test_flightbook)} test flightbook entries")
            print(f"❌ Found {len(test_users)} test users")
            print(f"❌ Found {len(test_completions)} test completions")
        
        # 4. Verify configuration
        print("\n4. CONFIGURATION VERIFICATION")
        print("-" * 30)
        
        config_valid = True
        
        # Check environment variables
        required_vars = ['MONGO_URL', 'DB_NAME', 'CLERK_JWKS_URL', 'CLERK_ISSUER']
        for var in required_vars:
            if os.environ.get(var):
                print(f"✅ {var} configured")
            else:
                print(f"❌ {var} missing")
                config_valid = False
        
        # Verify production database name
        if os.environ.get('DB_NAME') == 'earn_your_wings':
            print("✅ Production database name verified")
        else:
            print(f"❌ Unexpected database name: {os.environ.get('DB_NAME')}")
            config_valid = False
        
        verification_results["configuration"] = config_valid
        
        # 5. Final verification summary
        print("\n5. FINAL VERIFICATION SUMMARY")
        print("-" * 32)
        
        total_checks = len(verification_results)
        passed_checks = sum(verification_results.values())
        
        print(f"Passed: {passed_checks}/{total_checks} checks")
        print()
        
        for check, status in verification_results.items():
            status_icon = "✅" if status else "❌"
            print(f"{status_icon} {check.replace('_', ' ').title()}: {'PASS' if status else 'FAIL'}")
        
        # Overall status
        if passed_checks == total_checks:
            print("\n🎉 PRODUCTION READY!")
            print("✅ System is ready for production deployment")
            return True
        else:
            print(f"\n⚠️  PRODUCTION READINESS: {(passed_checks/total_checks)*100:.1f}%")
            print("❌ Additional work required before production deployment")
            return False
        
    except Exception as e:
        print(f"❌ Verification error: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    result = asyncio.run(verify_production_readiness())
    exit(0 if result else 1)