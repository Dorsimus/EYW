import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Sub-competency mapping from old names to correct names
SUB_COMPETENCY_MAPPING = {
    # Leadership Supervision
    'team_motivation': 'inspiring_team_motivation',
    'delegation': 'mastering_difficult_conversations',  # Based on competency structure
    'performance_management': 'mastering_difficult_conversations',
    'coaching_development': 'building_collaborative_culture',
    'team_building': 'building_collaborative_culture',
    'conflict_resolution': 'mastering_difficult_conversations',
    'difficult_conversations': 'mastering_difficult_conversations',
    'cross_dept_communication': 'developing_individual_team_members',
    'resident_resolution': 'developing_individual_team_members',
    'crisis_leadership': 'developing_individual_team_members',
    
    # Financial Management  
    'budget_creation': 'departmental_budget_management',
    'variance_analysis': 'departmental_budget_management',
    'cost_control': 'departmental_budget_management',
    'roi_decisions': 'operational_cost_control',
    'revenue_impact': 'operational_cost_control',
    'pl_understanding': 'property_pl_understanding',
    'kpi_tracking': 'financial_performance_analysis',
    'financial_forecasting': 'financial_performance_analysis',
    'capex_planning': 'departmental_budget_management',
    'vendor_cost_mgmt': 'operational_cost_control',
    
    # Operational Management
    'workflow_optimization': 'process_improvement_efficiency',
    'technology_utilization': 'process_improvement_efficiency',
    'quality_control': 'process_improvement_efficiency',
    'sop_management': 'process_improvement_efficiency', 
    'innovation': 'process_improvement_efficiency',
    'safety_management': 'compliance_risk_management',
    'policy_enforcement': 'compliance_risk_management',
    'legal_compliance': 'compliance_risk_management',
    'emergency_preparedness': 'compliance_risk_management',
    'documentation': 'documentation_communication',
    
    # Cross-functional and Strategic remain the same as they match
    'understanding_other_department': 'understanding_other_department',
    'unified_resident_experience': 'unified_resident_experience',
    'communication_across_departments': 'communication_across_departments',
    'stakeholder_relationship_building': 'stakeholder_relationship_building',
    'seeing_patterns_anticipating_trends': 'seeing_patterns_anticipating_trends',
    'innovation_continuous_improvement': 'innovation_continuous_improvement',
    'problem_solving_future_focus': 'problem_solving_future_focus',
    'planning_goal_achievement': 'planning_goal_achievement',
    
    # Client Confidence & Connection
    'understanding_client_impact': 'understanding_client_impact',
    'service_excellence_presence': 'service_excellence_presence',
    'client_communication_skills': 'client_communication_skills',
    'client_advocacy_value': 'client_advocacy_value'
}

async def migrate_sub_competency_references():
    """Migration script to fix sub-competency reference mismatches"""
    
    print("🚀 Starting Sub-Competency Reference Migration")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'test_database')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Get all tasks
        tasks_cursor = db.tasks.find({})
        tasks = await tasks_cursor.to_list(length=None)
        
        print(f"📊 Found {len(tasks)} tasks to process")
        
        # Track migration statistics
        migration_stats = {
            'total_tasks': len(tasks),
            'tasks_updated': 0,
            'tasks_skipped': 0,
            'mapping_applied': {},
            'unmapped_found': set()
        }
        
        for task in tasks:
            task_id = task.get('id')
            task_title = task.get('title', 'Untitled')
            competency_area = task.get('competency_area', '')
            current_sub_competency = task.get('sub_competency', '')
            
            # Check if this sub-competency needs mapping
            if current_sub_competency in SUB_COMPETENCY_MAPPING:
                new_sub_competency = SUB_COMPETENCY_MAPPING[current_sub_competency]
                
                # Update the task
                result = await db.tasks.update_one(
                    {'id': task_id},
                    {
                        '$set': {
                            'sub_competency': new_sub_competency,
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    migration_stats['tasks_updated'] += 1
                    mapping_key = f"{current_sub_competency} → {new_sub_competency}"
                    migration_stats['mapping_applied'][mapping_key] = migration_stats['mapping_applied'].get(mapping_key, 0) + 1
                    
                    print(f"✅ Updated '{task_title[:40]}...': {current_sub_competency} → {new_sub_competency}")
                else:
                    print(f"⚠️ Failed to update task: {task_title}")
            else:
                migration_stats['tasks_skipped'] += 1
                if current_sub_competency and current_sub_competency not in SUB_COMPETENCY_MAPPING.values():
                    migration_stats['unmapped_found'].add(current_sub_competency)
        
        # Print migration summary
        print(f"\n📈 Migration Summary:")
        print(f"   Total tasks processed: {migration_stats['total_tasks']}")
        print(f"   Tasks updated: {migration_stats['tasks_updated']}")
        print(f"   Tasks skipped: {migration_stats['tasks_skipped']}")
        
        print(f"\n🔄 Mappings Applied:")
        for mapping, count in migration_stats['mapping_applied'].items():
            print(f"   {mapping}: {count} tasks")
        
        if migration_stats['unmapped_found']:
            print(f"\n⚠️ Unmapped sub-competencies found:")
            for unmapped in sorted(migration_stats['unmapped_found']):
                print(f"   - {unmapped}")
        
        print(f"\n🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    finally:
        client.close()
    
    return True

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv('/app/backend/.env')
    
    # Run migration
    success = asyncio.run(migrate_sub_competency_references())
    
    if success:
        print("\n✅ Sub-competency reference migration completed successfully!")
        print("🔄 Next steps: Update competencyOptions array in App.js to match")
    else:
        print("\n❌ Migration failed. Please check the logs and try again.")
        sys.exit(1)