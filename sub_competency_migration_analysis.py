#!/usr/bin/env python3
"""
DETAILED SUB-COMPETENCY MIGRATION ANALYSIS
==========================================

This script provides detailed analysis of the 2 tasks with invalid sub-competency references
and creates a migration plan to fix them.
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

class SubCompetencyMigrationAnalyzer:
    def __init__(self):
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
        self.api_base = f"{self.base_url}/api"
        
        # Correct competency framework mapping
        self.correct_mappings = {
            # Financial Management sub-competencies
            'operational_cost_control': 'cost_conscious_decision_making',  # Maps to existing sub-competency
            
            # Operational Management sub-competencies  
            'compliance_risk_management': 'safety_leadership_risk_awareness'  # Maps to existing sub-competency
        }

    async def analyze_invalid_tasks(self):
        """Get detailed information about the invalid tasks"""
        print("🔍 ANALYZING INVALID SUB-COMPETENCY REFERENCES")
        print("=" * 60)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.api_base}/tasks") as response:
                    if response.status == 200:
                        tasks = await response.json()
                        
                        # Find the specific invalid tasks
                        invalid_tasks = []
                        for task in tasks:
                            sub_comp = task.get('sub_competency', '')
                            if sub_comp in self.correct_mappings:
                                invalid_tasks.append(task)
                        
                        print(f"Found {len(invalid_tasks)} tasks with invalid sub-competency references:\n")
                        
                        for i, task in enumerate(invalid_tasks, 1):
                            print(f"Task {i}:")
                            print(f"  ID: {task.get('id')}")
                            print(f"  Title: {task.get('title')}")
                            print(f"  Description: {task.get('description', '')[:100]}...")
                            print(f"  Competency Area: {task.get('competency_area')}")
                            print(f"  Current Sub-Competency: {task.get('sub_competency')} ❌")
                            print(f"  Correct Sub-Competency: {self.correct_mappings[task.get('sub_competency')]} ✅")
                            print(f"  Task Type: {task.get('task_type')}")
                            print(f"  Required: {task.get('required')}")
                            print(f"  Estimated Hours: {task.get('estimated_hours')}")
                            print(f"  Created By: {task.get('created_by')}")
                            print(f"  Created At: {task.get('created_at')}")
                            print()
                        
                        return invalid_tasks
                    else:
                        print(f"❌ Failed to get tasks: HTTP {response.status}")
                        return []
        except Exception as e:
            print(f"❌ Error analyzing tasks: {str(e)}")
            return []

    async def generate_migration_script(self, invalid_tasks):
        """Generate the migration commands needed to fix the tasks"""
        print("🛠️  MIGRATION SCRIPT GENERATION")
        print("=" * 60)
        
        if not invalid_tasks:
            print("No invalid tasks to migrate.")
            return
        
        print("The following tasks need sub-competency reference updates:\n")
        
        migration_commands = []
        
        for task in invalid_tasks:
            task_id = task.get('id')
            current_sub_comp = task.get('sub_competency')
            correct_sub_comp = self.correct_mappings.get(current_sub_comp)
            
            if correct_sub_comp:
                migration_command = {
                    'method': 'PUT',
                    'endpoint': f'/api/admin/tasks/{task_id}',
                    'payload': {
                        'sub_competency': correct_sub_comp
                    },
                    'description': f"Update '{task.get('title')}' sub-competency from '{current_sub_comp}' to '{correct_sub_comp}'"
                }
                migration_commands.append(migration_command)
                
                print(f"Migration Command:")
                print(f"  PUT {migration_command['endpoint']}")
                print(f"  Payload: {json.dumps(migration_command['payload'], indent=2)}")
                print(f"  Description: {migration_command['description']}")
                print()
        
        print(f"📋 SUMMARY:")
        print(f"  Total tasks to migrate: {len(migration_commands)}")
        print(f"  Migration method: Admin API PUT requests")
        print(f"  Authentication required: Yes (Clerk JWT)")
        print()
        
        return migration_commands

    async def verify_post_migration_state(self):
        """Verify what the state would be after migration"""
        print("✅ POST-MIGRATION VERIFICATION SIMULATION")
        print("=" * 60)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.api_base}/tasks") as response:
                    if response.status == 200:
                        tasks = await response.json()
                        
                        # Simulate the migration
                        simulated_tasks = []
                        for task in tasks:
                            simulated_task = task.copy()
                            current_sub_comp = task.get('sub_competency', '')
                            if current_sub_comp in self.correct_mappings:
                                simulated_task['sub_competency'] = self.correct_mappings[current_sub_comp]
                            simulated_tasks.append(simulated_task)
                        
                        # Verify all sub-competencies would be valid
                        valid_sub_competencies = {
                            'property_pl_understanding', 'departmental_budget_management', 
                            'cost_conscious_decision_making', 'financial_communication_business_understanding',
                            'process_improvement_efficiency', 'quality_control_standards',
                            'safety_leadership_risk_awareness', 'technology_system_optimization',
                            'inspiring_team_motivation', 'mastering_difficult_conversations',
                            'building_collaborative_culture', 'developing_others_success',
                            'understanding_other_department', 'unified_resident_experience',
                            'communication_across_departments', 'stakeholder_relationship_building',
                            'seeing_patterns_anticipating_trends', 'innovation_continuous_improvement',
                            'problem_solving_future_focus', 'planning_goal_achievement',
                            'understanding_client_impact', 'service_excellence_presence',
                            'client_communication_skills', 'client_advocacy_value'
                        }
                        
                        invalid_count = 0
                        for task in simulated_tasks:
                            if task.get('sub_competency') not in valid_sub_competencies:
                                invalid_count += 1
                        
                        print(f"Post-migration simulation results:")
                        print(f"  Total tasks: {len(simulated_tasks)}")
                        print(f"  Tasks with valid sub-competencies: {len(simulated_tasks) - invalid_count}")
                        print(f"  Tasks with invalid sub-competencies: {invalid_count}")
                        
                        if invalid_count == 0:
                            print(f"  ✅ All tasks would have valid sub-competency references after migration!")
                        else:
                            print(f"  ❌ {invalid_count} tasks would still have invalid references")
                        
                        print()
                        return invalid_count == 0
                    else:
                        print(f"❌ Failed to get tasks for simulation: HTTP {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Error in post-migration simulation: {str(e)}")
            return False

async def main():
    """Main analysis function"""
    analyzer = SubCompetencyMigrationAnalyzer()
    
    print("🚀 SUB-COMPETENCY MIGRATION ANALYSIS")
    print("=" * 80)
    print()
    
    # Step 1: Analyze invalid tasks
    invalid_tasks = await analyzer.analyze_invalid_tasks()
    
    # Step 2: Generate migration script
    migration_commands = await analyzer.generate_migration_script(invalid_tasks)
    
    # Step 3: Verify post-migration state
    migration_success = await analyzer.verify_post_migration_state()
    
    print("🎯 FINAL RECOMMENDATIONS:")
    print("=" * 60)
    print("1. Use the migration commands above to update the 2 invalid tasks")
    print("2. Execute via admin panel or direct API calls with proper authentication")
    print("3. Verify changes persist in both admin and user views")
    print("4. Re-run deployment verification tests to confirm 100% success")
    print()
    
    if migration_success:
        print("✅ Migration plan validated - will resolve all sub-competency issues")
    else:
        print("❌ Migration plan needs refinement - additional issues detected")

if __name__ == "__main__":
    asyncio.run(main())