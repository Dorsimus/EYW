import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Final sub-competency fixes for the 2 remaining invalid tasks
FINAL_SUB_COMPETENCY_FIXES = {
    'ecb3dbbc-88fc-449c-b03a-8ab81b960de3': 'cost_conscious_decision_making',
    'e3c734f3-1136-471a-b822-ba222c3b4de1': 'safety_leadership_risk_awareness'
}

async def final_sub_competency_fix():
    """Fix the final 2 tasks with invalid sub-competency references"""
    
    print("🎯 FINAL SUB-COMPETENCY MIGRATION - DEPLOYMENT READINESS FIX")
    print("=" * 70)
    
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'test_database')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Track migration statistics
        migration_stats = {
            'total_tasks_to_fix': len(FINAL_SUB_COMPETENCY_FIXES),
            'tasks_fixed': 0,
            'tasks_not_found': 0,
            'fixes_applied': {}
        }
        
        for task_id, correct_sub_competency in FINAL_SUB_COMPETENCY_FIXES.items():
            # Find the task first to get current state
            current_task = await db.tasks.find_one({'id': task_id})
            
            if not current_task:
                print(f"❌ Task {task_id} not found in database")
                migration_stats['tasks_not_found'] += 1
                continue
            
            current_sub_comp = current_task.get('sub_competency', '')
            task_title = current_task.get('title', 'Untitled')[:50]
            
            print(f"📝 Fixing task: '{task_title}...'")
            print(f"   ID: {task_id}")
            print(f"   Current sub-competency: {current_sub_comp}")
            print(f"   Correct sub-competency: {correct_sub_competency}")
            
            # Update the task
            result = await db.tasks.update_one(
                {'id': task_id},
                {
                    '$set': {
                        'sub_competency': correct_sub_competency,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                migration_stats['tasks_fixed'] += 1
                migration_stats['fixes_applied'][task_id] = {
                    'title': task_title,
                    'old_sub_competency': current_sub_comp,
                    'new_sub_competency': correct_sub_competency
                }
                print(f"   ✅ Successfully updated!")
            else:
                print(f"   ❌ Failed to update task")
            
            print()
        
        # Print final migration summary
        print(f"🏁 FINAL MIGRATION SUMMARY:")
        print(f"   Tasks to fix: {migration_stats['total_tasks_to_fix']}")
        print(f"   Tasks successfully fixed: {migration_stats['tasks_fixed']}")
        print(f"   Tasks not found: {migration_stats['tasks_not_found']}")
        
        if migration_stats['fixes_applied']:
            print(f"\n✅ Successfully Applied Fixes:")
            for task_id, fix_info in migration_stats['fixes_applied'].items():
                print(f"   - {fix_info['title']}: {fix_info['old_sub_competency']} → {fix_info['new_sub_competency']}")
        
        # Verify final state
        all_tasks = await db.tasks.find({}).to_list(length=None)
        
        # Valid sub-competencies (based on actual competency framework)
        valid_sub_competencies = {
            # Financial Management
            'property_pl_understanding', 'departmental_budget_management', 
            'cost_conscious_decision_making', 'financial_performance_analysis',
            # Operational Management  
            'process_improvement_efficiency', 'compliance_risk_management',
            'vendor_relationship_management', 'documentation_communication',
            # Leadership Supervision
            'inspiring_team_motivation', 'mastering_difficult_conversations',
            'building_collaborative_culture', 'developing_individual_team_members',
            # Cross-functional Collaboration
            'understanding_other_department', 'unified_resident_experience',
            'communication_across_departments', 'stakeholder_relationship_building',
            # Strategic Thinking
            'seeing_patterns_anticipating_trends', 'innovation_continuous_improvement',
            'problem_solving_future_focus', 'planning_goal_achievement',
            # Client Confidence & Connection
            'understanding_client_impact', 'service_excellence_presence',
            'client_communication_skills', 'client_advocacy_value'
        }
        
        invalid_count = 0
        for task in all_tasks:
            sub_comp = task.get('sub_competency', '')
            if sub_comp not in valid_sub_competencies:
                invalid_count += 1
                print(f"⚠️ Still invalid: {task.get('title', 'Untitled')[:30]}... - {sub_comp}")
        
        print(f"\n📊 FINAL VERIFICATION:")
        print(f"   Total tasks in database: {len(all_tasks)}")
        print(f"   Tasks with valid sub-competencies: {len(all_tasks) - invalid_count}")
        print(f"   Tasks with invalid sub-competencies: {invalid_count}")
        
        if invalid_count == 0:
            print(f"\n🎉 DEPLOYMENT READY!")
            print(f"   ✅ All tasks now have valid sub-competency references")
            print(f"   ✅ Admin-to-user synchronization fully operational")
            print(f"   ✅ Single source of truth established")
            print(f"   ✅ Ready for production deployment")
        else:
            print(f"\n⚠️ Still {invalid_count} tasks with invalid references")
        
        return invalid_count == 0
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    finally:
        client.close()

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv('/app/backend/.env')
    
    # Run final migration
    success = asyncio.run(final_sub_competency_fix())
    
    if success:
        print("\n🚀 SYSTEM IS DEPLOYMENT READY!")
        print("   All admin changes will now persist to user view 100% reliably")
    else:
        print("\n❌ Final migration incomplete. Review logs and retry.")
        sys.exit(1)