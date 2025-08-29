#!/usr/bin/env python3
"""
Detailed Task Analysis - Investigate sub-competency mapping issues
"""

import requests
import json
from collections import defaultdict

def analyze_task_distribution():
    """Analyze how tasks are distributed across competencies and sub-competencies"""
    
    base_url = "https://prelaunch-check.preview.emergentagent.com/api"
    
    print("🔍 DETAILED TASK DISTRIBUTION ANALYSIS")
    print("=" * 60)
    
    # Get all tasks
    try:
        response = requests.get(f"{base_url}/tasks", timeout=15)
        if response.status_code != 200:
            print(f"❌ Failed to get tasks: {response.status_code}")
            return
        
        all_tasks = response.json()
        print(f"📊 Total tasks in database: {len(all_tasks)}")
        
        # Analyze distribution by competency area and sub-competency
        area_distribution = defaultdict(lambda: defaultdict(list))
        
        for task in all_tasks:
            area = task.get('competency_area', 'unknown')
            sub_comp = task.get('sub_competency', 'unknown')
            area_distribution[area][sub_comp].append(task)
        
        print("\n📋 TASK DISTRIBUTION BY AREA AND SUB-COMPETENCY:")
        print("-" * 60)
        
        total_mapped = 0
        for area, sub_comps in area_distribution.items():
            area_total = sum(len(tasks) for tasks in sub_comps.values())
            total_mapped += area_total
            print(f"\n🎯 {area.upper()}: {area_total} tasks")
            
            for sub_comp, tasks in sub_comps.items():
                print(f"  └─ {sub_comp}: {len(tasks)} tasks")
                if len(tasks) > 0:
                    # Show sample task titles
                    sample_titles = [task.get('title', 'No title')[:40] for task in tasks[:2]]
                    print(f"     Samples: {sample_titles}")
        
        print(f"\n📊 Total mapped tasks: {total_mapped}")
        
        # Get competency framework to compare
        print("\n🔍 CHECKING COMPETENCY FRAMEWORK STRUCTURE:")
        print("-" * 60)
        
        response = requests.get(f"{base_url}/competencies", timeout=10)
        if response.status_code == 200:
            competencies = response.json()
            
            for area_key, area_data in competencies.items():
                if isinstance(area_data, dict) and 'sub_competencies' in area_data:
                    sub_comps = area_data['sub_competencies']
                    print(f"\n🎯 {area_key.upper()}: {len(sub_comps)} sub-competencies defined")
                    
                    for sub_key, sub_name in sub_comps.items():
                        task_count = len(area_distribution[area_key][sub_key])
                        status = "✅" if task_count > 0 else "❌"
                        print(f"  {status} {sub_key}: {task_count} tasks")
                        
                        # Check for mismatched sub-competency names
                        if task_count == 0:
                            # Look for similar names in the task data
                            similar_subs = [s for s in area_distribution[area_key].keys() 
                                          if s != sub_key and any(word in s for word in sub_key.split('_'))]
                            if similar_subs:
                                print(f"     ⚠️ Similar sub-competencies found in tasks: {similar_subs}")
        
        # Test specific problematic endpoints
        print("\n🔍 TESTING SPECIFIC PROBLEMATIC ENDPOINTS:")
        print("-" * 60)
        
        problematic_cases = [
            ('leadership_supervision', 'inspiring_team_motivation'),
            ('leadership_supervision', 'team_motivation'),  # Alternative name
            ('financial_management', 'property_pl_understanding'),
            ('operational_management', 'process_improvement_efficiency')
        ]
        
        for area, sub_comp in problematic_cases:
            url = f"{base_url}/tasks/{area}/{sub_comp}"
            try:
                response = requests.get(url, timeout=10)
                task_count = len(response.json()) if response.status_code == 200 else 0
                status = "✅" if task_count > 0 else "❌"
                print(f"{status} {area}/{sub_comp}: {task_count} tasks (HTTP {response.status_code})")
            except Exception as e:
                print(f"❌ {area}/{sub_comp}: Error - {str(e)}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")

if __name__ == "__main__":
    analyze_task_distribution()