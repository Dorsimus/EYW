import requests
import json

def analyze_backend_structure():
    """Analyze the backend structure in detail"""
    base_url = "https://earn-wings-migrate.preview.emergentagent.com/api"
    
    print("🔍 DETAILED BACKEND STRUCTURE ANALYSIS")
    print("=" * 60)
    
    # Get competency framework
    try:
        response = requests.get(f"{base_url}/competencies")
        framework = response.json()
        
        print("\n📋 COMPETENCY FRAMEWORK STRUCTURE:")
        total_expected_tasks = 0
        
        for area_key, area_data in framework.items():
            name = area_data.get('name', 'Unknown')
            description = area_data.get('description', 'No description')
            sub_competencies = area_data.get('sub_competencies', {})
            
            print(f"\n🎯 {area_key}:")
            print(f"   Name: {name}")
            print(f"   Description: {description}")
            print(f"   Sub-competencies ({len(sub_competencies)}):")
            
            for sub_key, sub_name in sub_competencies.items():
                print(f"     - {sub_key}: {sub_name}")
            
            # Each area should have 16 tasks (4 sub-competencies × 4 tasks each)
            expected_tasks_for_area = len(sub_competencies) * 4
            total_expected_tasks += expected_tasks_for_area
            print(f"   Expected tasks: {expected_tasks_for_area}")
        
        print(f"\n📊 TOTAL EXPECTED TASKS: {total_expected_tasks}")
        
    except Exception as e:
        print(f"❌ Error getting framework: {e}")
        return
    
    # Get actual tasks
    try:
        response = requests.get(f"{base_url}/tasks")
        tasks = response.json()
        
        print(f"\n📋 ACTUAL TASKS IN DATABASE: {len(tasks)}")
        
        # Group tasks by competency area
        task_distribution = {}
        for task in tasks:
            area = task.get('competency_area', 'unknown')
            if area not in task_distribution:
                task_distribution[area] = {}
            
            sub_comp = task.get('sub_competency', 'unknown')
            if sub_comp not in task_distribution[area]:
                task_distribution[area][sub_comp] = 0
            task_distribution[area][sub_comp] += 1
        
        print("\n📊 TASK DISTRIBUTION BY AREA:")
        total_actual_tasks = 0
        for area, sub_areas in task_distribution.items():
            area_total = sum(sub_areas.values())
            total_actual_tasks += area_total
            print(f"\n🎯 {area} ({area_total} tasks):")
            for sub_comp, count in sub_areas.items():
                print(f"     - {sub_comp}: {count} tasks")
        
        print(f"\n📊 TOTAL ACTUAL TASKS: {total_actual_tasks}")
        
        # Check for mismatches
        print(f"\n🔍 ANALYSIS:")
        if total_actual_tasks == total_expected_tasks:
            print(f"✅ Task count matches expectation: {total_actual_tasks}")
        else:
            print(f"⚠️  Task count mismatch: Expected {total_expected_tasks}, Found {total_actual_tasks}")
        
        # Check for old competency keys
        old_keys = ['cross_functional']  # Old key that should be updated
        for area in task_distribution.keys():
            if area in old_keys:
                print(f"⚠️  Found tasks using old competency key: {area}")
        
        # Check for new competency keys
        new_keys = ['cross_functional_collaboration']
        for key in new_keys:
            if key in task_distribution:
                print(f"✅ Found tasks using new competency key: {key}")
            else:
                print(f"❌ No tasks found for new competency key: {key}")
        
    except Exception as e:
        print(f"❌ Error getting tasks: {e}")

if __name__ == "__main__":
    analyze_backend_structure()