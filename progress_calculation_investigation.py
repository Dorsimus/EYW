#!/usr/bin/env python3
"""
TASK COMPLETION PROGRESS CALCULATION INVESTIGATION
=================================================

Based on initial investigation, task completion persistence is working, but there's a discrepancy:
- Task shows as completed: ✅
- Task completion found in database: ✅  
- User progress shows 0/10 completed: ❌ (This is the issue!)

This suggests the problem is in the progress calculation logic, not the completion persistence.
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

class ProgressCalculationInvestigator:
    def __init__(self):
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
        self.api_base = f"{self.base_url}/api"
        self.demo_user_id = "demo-user-123"
        
        self.demo_auth_headers = {
            'Authorization': 'Bearer demo-token',
            'Content-Type': 'application/json'
        }
        
        print(f"🔍 Investigating Progress Calculation Issue")
        print(f"📍 API Base: {self.api_base}")
        print(f"👤 Demo User ID: {self.demo_user_id}")

    async def investigate_progress_calculation_mismatch(self):
        """Investigate why progress shows 0/10 when tasks are completed"""
        print("\n" + "=" * 60)
        print("🔍 PROGRESS CALCULATION MISMATCH INVESTIGATION")
        print("=" * 60)
        
        async with aiohttp.ClientSession() as session:
            # Step 1: Get all tasks for inspiring_team_motivation
            print("\n1️⃣ Getting all tasks for inspiring_team_motivation...")
            async with session.get(
                f"{self.api_base}/tasks/leadership_supervision/inspiring_team_motivation"
            ) as response:
                if response.status == 200:
                    all_tasks = await response.json()
                    print(f"   📊 Found {len(all_tasks)} total tasks in inspiring_team_motivation")
                    
                    for i, task in enumerate(all_tasks, 1):
                        task_id = task.get('id', 'No ID')
                        title = task.get('title', 'No Title')
                        print(f"   {i:2d}. {title} (ID: {task_id})")
                else:
                    print(f"   ❌ Failed to get tasks: HTTP {response.status}")
                    return
            
            # Step 2: Get user's task completions
            print("\n2️⃣ Getting user's task completions...")
            async with session.get(
                f"{self.api_base}/users/{self.demo_user_id}/task-completions",
                headers=self.demo_auth_headers
            ) as response:
                if response.status == 200:
                    completions = await response.json()
                    print(f"   📊 Found {len(completions)} total completions for user")
                    
                    # Filter completions for inspiring_team_motivation tasks
                    task_ids = [task.get('id') for task in all_tasks]
                    relevant_completions = [c for c in completions if c.get('task_id') in task_ids]
                    
                    print(f"   📊 Found {len(relevant_completions)} completions for inspiring_team_motivation tasks")
                    
                    for completion in relevant_completions:
                        task_id = completion.get('task_id')
                        completed_at = completion.get('completed_at')
                        notes = completion.get('notes', 'No notes')[:50]
                        print(f"   ✅ Task {task_id} completed at {completed_at}")
                        print(f"      Notes: {notes}...")
                else:
                    print(f"   ❌ Failed to get completions: HTTP {response.status}")
                    return
            
            # Step 3: Get user's tasks with completion status
            print("\n3️⃣ Getting user's tasks with completion status...")
            async with session.get(
                f"{self.api_base}/users/{self.demo_user_id}/tasks/leadership_supervision/inspiring_team_motivation",
                headers=self.demo_auth_headers
            ) as response:
                if response.status == 200:
                    user_tasks = await response.json()
                    print(f"   📊 Retrieved {len(user_tasks)} user tasks")
                    
                    completed_count = 0
                    for task in user_tasks:
                        task_id = task.get('id') or str(task.get('_id', ''))
                        title = task.get('title', 'No Title')
                        is_completed = task.get('completed', False)
                        
                        if is_completed:
                            completed_count += 1
                            completion_data = task.get('completion_data', {})
                            completed_at = completion_data.get('completed_at', 'No timestamp')
                            print(f"   ✅ {title} - COMPLETED at {completed_at}")
                        else:
                            print(f"   ⭕ {title} - NOT COMPLETED")
                    
                    print(f"\n   📊 Summary: {completed_count}/{len(user_tasks)} tasks completed")
                else:
                    print(f"   ❌ Failed to get user tasks: HTTP {response.status}")
                    return
            
            # Step 4: Get user's competency progress
            print("\n4️⃣ Getting user's competency progress...")
            async with session.get(
                f"{self.api_base}/users/{self.demo_user_id}/competencies",
                headers=self.demo_auth_headers
            ) as response:
                if response.status == 200:
                    competencies = await response.json()
                    leadership_comp = competencies.get('leadership_supervision', {})
                    inspiring_motivation = leadership_comp.get('sub_competencies', {}).get('inspiring_team_motivation', {})
                    
                    if inspiring_motivation:
                        completed_tasks = inspiring_motivation.get('completed_tasks', 0)
                        total_tasks = inspiring_motivation.get('total_tasks', 0)
                        completion_percentage = inspiring_motivation.get('completion_percentage', 0)
                        last_updated = inspiring_motivation.get('last_updated', 'Never')
                        
                        print(f"   📊 Progress API shows: {completed_tasks}/{total_tasks} tasks completed ({completion_percentage}%)")
                        print(f"   🕒 Last updated: {last_updated}")
                        
                        # This is the discrepancy!
                        if completed_count > 0 and completed_tasks == 0:
                            print(f"\n   🚨 DISCREPANCY FOUND!")
                            print(f"   📊 User tasks API shows: {completed_count} completed tasks")
                            print(f"   📊 Progress API shows: {completed_tasks} completed tasks")
                            print(f"   💡 This explains why users see tasks as incomplete!")
                    else:
                        print(f"   ❌ inspiring_team_motivation not found in competencies")
                else:
                    print(f"   ❌ Failed to get competencies: HTTP {response.status}")
            
            # Step 5: Test progress recalculation
            print("\n5️⃣ Testing progress recalculation...")
            
            # Try to trigger progress update by completing a task (if not already completed)
            if len(all_tasks) > 0:
                test_task = all_tasks[0]
                test_task_id = test_task.get('id')
                
                completion_data = {
                    "notes": "Testing progress recalculation",
                    "evidence_description": "Investigating progress calculation issue"
                }
                
                async with session.post(
                    f"{self.api_base}/users/{self.demo_user_id}/tasks/{test_task_id}/complete",
                    headers=self.demo_auth_headers,
                    json=completion_data
                ) as response:
                    if response.status == 200:
                        print(f"   ✅ Task completion triggered successfully")
                    elif response.status == 400:
                        print(f"   ℹ️ Task already completed (expected)")
                    else:
                        print(f"   ❌ Task completion failed: HTTP {response.status}")
                
                # Check if progress updated
                await asyncio.sleep(2)  # Wait for progress calculation
                
                async with session.get(
                    f"{self.api_base}/users/{self.demo_user_id}/competencies",
                    headers=self.demo_auth_headers
                ) as response:
                    if response.status == 200:
                        updated_competencies = await response.json()
                        updated_leadership = updated_competencies.get('leadership_supervision', {})
                        updated_inspiring = updated_leadership.get('sub_competencies', {}).get('inspiring_team_motivation', {})
                        
                        if updated_inspiring:
                            new_completed = updated_inspiring.get('completed_tasks', 0)
                            new_total = updated_inspiring.get('total_tasks', 0)
                            new_percentage = updated_inspiring.get('completion_percentage', 0)
                            
                            print(f"   📊 Updated progress: {new_completed}/{new_total} tasks completed ({new_percentage}%)")
                            
                            if new_completed > 0:
                                print(f"   ✅ Progress calculation is working after manual trigger!")
                            else:
                                print(f"   ❌ Progress still shows 0 completed tasks - calculation issue confirmed!")

    async def investigate_task_id_matching_issue(self):
        """Investigate if there's a task ID matching issue between completions and tasks"""
        print("\n" + "=" * 60)
        print("🔍 TASK ID MATCHING INVESTIGATION")
        print("=" * 60)
        
        async with aiohttp.ClientSession() as session:
            # Get all tasks
            async with session.get(
                f"{self.api_base}/tasks/leadership_supervision/inspiring_team_motivation"
            ) as response:
                if response.status == 200:
                    all_tasks = await response.json()
                else:
                    print("Failed to get tasks")
                    return
            
            # Get all completions
            async with session.get(
                f"{self.api_base}/users/{self.demo_user_id}/task-completions",
                headers=self.demo_auth_headers
            ) as response:
                if response.status == 200:
                    completions = await response.json()
                else:
                    print("Failed to get completions")
                    return
            
            print(f"\n📊 Task ID Format Analysis:")
            print(f"   Tasks: {len(all_tasks)} total")
            print(f"   Completions: {len(completions)} total")
            
            # Analyze task ID formats
            task_ids = []
            for task in all_tasks:
                task_id = task.get('id')
                if task_id:
                    task_ids.append(task_id)
                    print(f"   Task ID: {task_id} (Type: {type(task_id)})")
            
            print(f"\n📊 Completion Task ID Analysis:")
            completion_task_ids = []
            for completion in completions:
                task_id = completion.get('task_id')
                if task_id:
                    completion_task_ids.append(task_id)
                    print(f"   Completion Task ID: {task_id} (Type: {type(task_id)})")
            
            # Check for matches
            matches = set(task_ids) & set(completion_task_ids)
            print(f"\n📊 ID Matching Analysis:")
            print(f"   Task IDs: {len(task_ids)}")
            print(f"   Completion Task IDs: {len(completion_task_ids)}")
            print(f"   Matches: {len(matches)}")
            
            if len(matches) == 0:
                print(f"   🚨 NO MATCHES FOUND! This could be the root cause!")
                print(f"   💡 Task IDs and completion task IDs don't match")
            else:
                print(f"   ✅ Found {len(matches)} matching IDs")
                for match in matches:
                    print(f"      Match: {match}")

    async def run_investigation(self):
        """Run the complete investigation"""
        print("=" * 80)
        print("🔍 TASK COMPLETION PROGRESS CALCULATION INVESTIGATION")
        print("=" * 80)
        print(f"📅 Investigation: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Target: {self.base_url}")
        
        await self.investigate_progress_calculation_mismatch()
        await self.investigate_task_id_matching_issue()
        
        print("\n" + "=" * 80)
        print("🎯 INVESTIGATION COMPLETE")
        print("=" * 80)

async def main():
    investigator = ProgressCalculationInvestigator()
    await investigator.run_investigation()

if __name__ == "__main__":
    asyncio.run(main())