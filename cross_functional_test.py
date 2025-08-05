import requests
import json
import sys

class CrossFunctionalCollaborationTester:
    def __init__(self, base_url="https://b30c84c9-22c7-4573-80d3-8236f39befba.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_test_user_and_admin(self):
        """Setup test user and admin for testing"""
        # Create test user
        user_data = {
            "email": "cross_functional_test@earnwings.com",
            "name": "Cross Functional Test User",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create Test User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created user with ID: {self.user_id}")

        # Admin login
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin login successful")

    def test_competency_framework_structure(self):
        """Test the competency framework structure to verify Cross-Functional Collaboration integration"""
        success, response = self.run_test("Get Competency Framework", "GET", "competencies", 200)
        
        if not success:
            return False
        
        print(f"\n📊 COMPETENCY FRAMEWORK ANALYSIS:")
        print(f"   Total competency areas: {len(response)}")
        
        # Check if cross_functional exists and analyze its structure
        if 'cross_functional' in response:
            cross_functional = response['cross_functional']
            print(f"\n🎯 CROSS-FUNCTIONAL COLLABORATION ANALYSIS:")
            print(f"   Name: {cross_functional.get('name', 'N/A')}")
            print(f"   Description: {cross_functional.get('description', 'N/A')}")
            
            sub_competencies = cross_functional.get('sub_competencies', {})
            print(f"   Sub-competencies count: {len(sub_competencies)}")
            
            print(f"\n   Sub-competencies list:")
            for key, name in sub_competencies.items():
                print(f"   - {key}: {name}")
            
            # Check if this matches the expected 5 focus areas from the review request
            expected_areas = [
                "Inter-Departmental Partnership",
                "Resident Experience Collaboration", 
                "Property-Wide Team Building",
                "External Stakeholder Management",
                "Conflict Resolution"
            ]
            
            print(f"\n🔍 EXPECTED VS ACTUAL STRUCTURE:")
            print(f"   Expected 5 focus areas from review request:")
            for area in expected_areas:
                print(f"   - {area}")
            
            print(f"\n   Current backend structure ({len(sub_competencies)} areas):")
            for key, name in sub_competencies.items():
                print(f"   - {name}")
            
            # Check if the structure matches expectations
            if len(sub_competencies) == 5:
                print(f"✅ Sub-competency count matches expected (5)")
            else:
                print(f"❌ Sub-competency count mismatch - Expected: 5, Found: {len(sub_competencies)}")
                print(f"   This suggests the Cross-Functional Collaboration framework integration may not be complete")
        else:
            print(f"❌ Cross-Functional Collaboration competency area not found!")
            return False
        
        return success

    def test_cross_functional_tasks(self):
        """Test tasks for Cross-Functional Collaboration competencies"""
        success, response = self.run_test("Get All Tasks", "GET", "tasks", 200)
        
        if not success:
            return False
        
        # Filter tasks for cross_functional competency area
        cross_functional_tasks = [task for task in response if task.get('competency_area') == 'cross_functional']
        
        print(f"\n📚 CROSS-FUNCTIONAL COLLABORATION TASKS ANALYSIS:")
        print(f"   Total tasks in system: {len(response)}")
        print(f"   Cross-functional tasks: {len(cross_functional_tasks)}")
        
        # Group by sub-competency
        tasks_by_sub = {}
        for task in cross_functional_tasks:
            sub_comp = task.get('sub_competency', 'unknown')
            if sub_comp not in tasks_by_sub:
                tasks_by_sub[sub_comp] = []
            tasks_by_sub[sub_comp].append(task)
        
        print(f"\n   Tasks by sub-competency:")
        total_cross_functional_tasks = 0
        for sub_comp, tasks in tasks_by_sub.items():
            print(f"   - {sub_comp}: {len(tasks)} tasks")
            total_cross_functional_tasks += len(tasks)
            for task in tasks[:2]:  # Show first 2 tasks as examples
                print(f"     • {task.get('title', 'No title')} ({task.get('task_type', 'No type')})")
        
        print(f"\n   Total cross-functional tasks: {total_cross_functional_tasks}")
        
        # Check if this matches the expected 68 total tasks mentioned in review request
        # Note: The 68 tasks mentioned might be across all competencies, not just cross-functional
        print(f"\n🔍 TASK COUNT ANALYSIS:")
        if total_cross_functional_tasks > 0:
            print(f"✅ Cross-functional tasks found: {total_cross_functional_tasks}")
        else:
            print(f"❌ No cross-functional tasks found - this indicates incomplete integration")
        
        return success

    def test_user_competency_progress_with_cross_functional(self):
        """Test user competency progress calculation with Cross-Functional Collaboration"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
        
        success, response = self.run_test("Get User Competencies", "GET", f"users/{self.user_id}/competencies", 200)
        
        if not success:
            return False
        
        print(f"\n👤 USER COMPETENCY PROGRESS ANALYSIS:")
        print(f"   User ID: {self.user_id}")
        print(f"   Competency areas loaded: {len(response)}")
        
        if 'cross_functional' in response:
            cross_functional = response['cross_functional']
            print(f"\n🎯 CROSS-FUNCTIONAL COLLABORATION PROGRESS:")
            print(f"   Name: {cross_functional.get('name', 'N/A')}")
            print(f"   Overall progress: {cross_functional.get('overall_progress', 0)}%")
            
            sub_competencies = cross_functional.get('sub_competencies', {})
            print(f"   Sub-competencies with progress data: {len(sub_competencies)}")
            
            total_tasks_across_subs = 0
            for sub_key, sub_data in sub_competencies.items():
                completed = sub_data.get('completed_tasks', 0)
                total = sub_data.get('total_tasks', 0)
                percentage = sub_data.get('completion_percentage', 0)
                total_tasks_across_subs += total
                print(f"   - {sub_data.get('name', sub_key)}: {completed}/{total} tasks ({percentage:.1f}%)")
            
            print(f"\n   Total tasks across all cross-functional sub-competencies: {total_tasks_across_subs}")
            
            # Test progress calculation
            if total_tasks_across_subs > 0:
                print(f"✅ Cross-functional competency has tasks and progress tracking")
            else:
                print(f"❌ Cross-functional competency has no tasks - progress calculation may be broken")
        else:
            print(f"❌ Cross-functional competency not found in user progress data")
            return False
        
        return success

    def test_admin_task_management_cross_functional(self):
        """Test admin task management for Cross-Functional Collaboration"""
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False
        
        # Test creating a task in cross-functional area
        task_data = {
            "title": "Test Cross-Functional Task",
            "description": "Test task for Cross-Functional Collaboration framework",
            "task_type": "project",
            "competency_area": "cross_functional",
            "sub_competency": "interdept_understanding",  # Using existing sub-competency
            "order": 99,
            "required": True,
            "estimated_hours": 2.0,
            "instructions": "Test task creation for cross-functional competency"
        }
        
        success, response = self.run_test("Admin Create Cross-Functional Task", "POST", "admin/tasks", 200, data=task_data, auth_required=True)
        
        if success and 'id' in response:
            created_task_id = response['id']
            print(f"   Created cross-functional task with ID: {created_task_id}")
            
            # Test updating the task
            update_data = {
                "title": "Updated Cross-Functional Test Task",
                "estimated_hours": 3.0
            }
            
            update_success, update_response = self.run_test(
                "Admin Update Cross-Functional Task", 
                "PUT", 
                f"admin/tasks/{created_task_id}", 
                200, 
                data=update_data, 
                auth_required=True
            )
            
            if update_success:
                print(f"✅ Cross-functional task management (create/update) working")
            else:
                print(f"❌ Cross-functional task update failed")
            
            return success and update_success
        else:
            print(f"❌ Failed to create cross-functional task")
            return False

def main():
    print("🚀 CROSS-FUNCTIONAL COLLABORATION FRAMEWORK INTEGRATION TEST")
    print("=" * 80)
    print("Focus: Testing the expanded Cross-Functional Collaboration structure")
    print("Expected: 5 focus areas with 68 total tasks (as mentioned in review request)")
    print("=" * 80)
    
    tester = CrossFunctionalCollaborationTester()
    
    # Setup
    print("\n🔧 SETUP:")
    tester.setup_test_user_and_admin()
    
    # Core tests
    print("\n📋 CORE CROSS-FUNCTIONAL COLLABORATION TESTS:")
    
    # 1. Test competency framework structure
    framework_success = tester.test_competency_framework_structure()
    
    # 2. Test cross-functional tasks
    tasks_success = tester.test_cross_functional_tasks()
    
    # 3. Test user competency progress calculation
    progress_success = tester.test_user_competency_progress_with_cross_functional()
    
    # 4. Test admin task management for cross-functional
    admin_success = tester.test_admin_task_management_cross_functional()
    
    # Results
    print("\n" + "=" * 80)
    print(f"📊 CROSS-FUNCTIONAL COLLABORATION TEST RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n🎯 SPECIFIC INTEGRATION ANALYSIS:")
    print(f"   Framework Structure: {'✅ PASS' if framework_success else '❌ FAIL'}")
    print(f"   Cross-Functional Tasks: {'✅ PASS' if tasks_success else '❌ FAIL'}")
    print(f"   Progress Calculation: {'✅ PASS' if progress_success else '❌ FAIL'}")
    print(f"   Admin Task Management: {'✅ PASS' if admin_success else '❌ FAIL'}")
    
    # Overall assessment
    all_critical_tests_passed = framework_success and tasks_success and progress_success and admin_success
    
    if all_critical_tests_passed:
        print(f"\n🎉 CROSS-FUNCTIONAL COLLABORATION INTEGRATION: ✅ SUCCESS")
        print(f"   The expanded Cross-Functional Collaboration framework is working correctly")
        print(f"   Backend can handle the new structure and competency progress calculation")
    else:
        print(f"\n⚠️ CROSS-FUNCTIONAL COLLABORATION INTEGRATION: ❌ ISSUES FOUND")
        print(f"   Some aspects of the integration may not be working as expected")
        print(f"   Review the detailed analysis above for specific issues")
    
    return 0 if all_critical_tests_passed else 1

if __name__ == "__main__":
    sys.exit(main())