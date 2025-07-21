import requests
import sys
import json
from datetime import datetime

class TaskCompetencyAPITester:
    def __init__(self, base_url="https://b1a7c88e-b2b4-42eb-afc5-3fd571246cd2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.admin_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        # Add authorization header if admin token is available and auth is required
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if auth_required:
            print(f"   Auth: {'✅ Token provided' if self.admin_token else '❌ No token'}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    if 'Content-Type' in headers:
                        del headers['Content-Type']
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_create_user(self):
        """Test user creation"""
        user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Test Navigator",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created user with ID: {self.user_id}")
        return success, response

    def test_get_user(self):
        """Test getting user by ID"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        return self.run_test("Get User", "GET", f"users/{self.user_id}", 200)

    def test_get_all_users(self):
        """Test getting all users"""
        return self.run_test("Get All Users", "GET", "users", 200)

    def test_get_competency_framework(self):
        """Test getting competency framework"""
        return self.run_test("Get Competency Framework", "GET", "competencies", 200)

    def test_seed_sample_tasks(self):
        """Test seeding sample tasks - PRIORITY TEST"""
        success, response = self.run_test("Seed Sample Tasks", "POST", "admin/seed-tasks", 200)
        if success:
            print(f"   Seeded tasks: {response.get('message', 'Unknown')}")
        return success, response

    def test_get_all_tasks(self):
        """Test getting all tasks - PRIORITY TEST"""
        success, response = self.run_test("Get All Tasks", "GET", "tasks", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} tasks")
            # Print sample tasks for verification
            for i, task in enumerate(response[:3]):
                print(f"   Task {i+1}: {task.get('title', 'No title')} ({task.get('task_type', 'No type')})")
        return success, response

    def test_get_tasks_for_competency(self):
        """Test getting tasks for specific competency"""
        # Test with Leadership & Supervision -> Team Motivation
        return self.run_test(
            "Get Tasks for Competency", 
            "GET", 
            "tasks/leadership_supervision/team_motivation", 
            200
        )

    def test_get_user_tasks_for_competency(self):
        """Test getting user tasks for competency - PRIORITY TEST"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        success, response = self.run_test(
            "Get User Tasks for Competency", 
            "GET", 
            f"users/{self.user_id}/tasks/leadership_supervision/team_motivation", 
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} tasks for user")
            for task in response:
                completed_status = "✅ Completed" if task.get('completed') else "⏳ Pending"
                print(f"   - {task.get('title', 'No title')}: {completed_status}")
        return success, response

    def test_complete_task(self):
        """Test task completion - PRIORITY TEST"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        # First get tasks to find one to complete
        success, tasks = self.test_get_user_tasks_for_competency()
        if not success or not tasks:
            print("❌ No tasks available for completion testing")
            return False, {}

        # Find first incomplete task
        incomplete_task = None
        for task in tasks:
            if not task.get('completed'):
                incomplete_task = task
                break

        if not incomplete_task:
            print("✅ All tasks already completed - creating test scenario")
            return True, {"message": "No incomplete tasks to test"}

        # Complete the task
        task_data = {
            'task_id': incomplete_task['id'],
            'evidence_description': 'Test completion evidence',
            'notes': 'Automated test completion'
        }

        success, response = self.run_test(
            "Complete Task", 
            "POST", 
            f"users/{self.user_id}/task-completions", 
            200,
            data=task_data
        )
        
        if success:
            print(f"   Completed task: {incomplete_task.get('title', 'Unknown')}")
        
        return success, response

    def test_get_user_competencies(self):
        """Test getting user competencies with progress - PRIORITY TEST"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        success, response = self.run_test(
            "Get User Competencies", 
            "GET", 
            f"users/{self.user_id}/competencies", 
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   Found {len(response)} competency areas")
            for area_key, area_data in response.items():
                overall_progress = area_data.get('overall_progress', 0)
                sub_count = len(area_data.get('sub_competencies', {}))
                print(f"   - {area_data.get('name', area_key)}: {overall_progress}% ({sub_count} sub-competencies)")
                
                # Show task completion details for first few sub-competencies
                for sub_key, sub_data in list(area_data.get('sub_competencies', {}).items())[:2]:
                    completed = sub_data.get('completed_tasks', 0)
                    total = sub_data.get('total_tasks', 0)
                    percentage = sub_data.get('completion_percentage', 0)
                    print(f"     • {sub_data.get('name', sub_key)}: {completed}/{total} tasks ({percentage:.1f}%)")
        
        return success, response

    def test_get_user_task_completions(self):
        """Test getting user task completions"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        success, response = self.run_test(
            "Get User Task Completions", 
            "GET", 
            f"users/{self.user_id}/task-completions", 
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} completed tasks")
        
        return success, response

    def test_create_admin_user(self):
        """Test creating admin user"""
        admin_data = {
            "email": "admin@earnwings.com",
            "name": "Admin User",
            "role": "admin",
            "level": "navigator",
            "is_admin": True,
            "password": "admin123"
        }
        success, response = self.run_test("Create Admin User", "POST", "admin/create", 200, data=admin_data)
        if success:
            print(f"   Admin user created successfully")
        return success, response

    def test_admin_login(self):
        """Test admin login - PRIORITY TEST"""
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response.get('user')
            print(f"   Admin login successful, token obtained")
            print(f"   Admin user: {self.admin_user.get('name', 'Unknown') if self.admin_user else 'No user data'}")
        return success, response

    def test_admin_stats(self):
        """Test admin statistics endpoint - PRIORITY TEST"""
        success, response = self.run_test("Admin Stats", "GET", "admin/stats", 200, auth_required=True)
        if success and isinstance(response, dict):
            print(f"   Total Users: {response.get('total_users', 'N/A')}")
            print(f"   Total Tasks: {response.get('total_tasks', 'N/A')}")
            print(f"   Total Completions: {response.get('total_completions', 'N/A')}")
            print(f"   Completion Rate: {response.get('completion_rate', 'N/A')}%")
            print(f"   Active Competency Areas: {response.get('active_competency_areas', 'N/A')}")
        return success, response

    def test_admin_get_all_tasks(self):
        """Test admin get all tasks endpoint - PRIORITY TEST"""
        success, response = self.run_test("Admin Get All Tasks", "GET", "admin/tasks", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} tasks (including inactive)")
            # Show sample tasks
            for i, task in enumerate(response[:3]):
                active_status = "Active" if task.get('active', True) else "Inactive"
                print(f"   Task {i+1}: {task.get('title', 'No title')} ({active_status})")
        return success, response

    def test_admin_get_all_users(self):
        """Test admin get all users endpoint - PRIORITY TEST"""
        success, response = self.run_test("Admin Get All Users", "GET", "admin/users", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} users")
            # Show sample users with progress
            for i, user in enumerate(response[:3]):
                completed_tasks = user.get('completed_tasks', 0)
                overall_progress = user.get('overall_progress', 0)
                print(f"   User {i+1}: {user.get('name', 'No name')} - {completed_tasks} tasks, {overall_progress}% progress")
        return success, response

    def test_admin_create_task(self):
        """Test admin create task endpoint - PRIORITY TEST"""
        task_data = {
            "title": "Test Admin Created Task",
            "description": "This is a test task created by admin API",
            "task_type": "assessment",
            "competency_area": "leadership_supervision",
            "sub_competency": "team_motivation",
            "order": 99,
            "required": False,
            "estimated_hours": 1.0,
            "instructions": "Complete this test task for API validation"
        }
        success, response = self.run_test("Admin Create Task", "POST", "admin/tasks", 200, data=task_data, auth_required=True)
        if success and 'id' in response:
            self.created_task_id = response['id']
            print(f"   Created task with ID: {self.created_task_id}")
        return success, response

    def test_admin_update_task(self):
        """Test admin update task endpoint - PRIORITY TEST"""
        if not hasattr(self, 'created_task_id'):
            print("❌ No task ID available for update testing")
            return False, {}
        
        update_data = {
            "title": "Updated Test Task",
            "description": "This task has been updated via admin API",
            "estimated_hours": 2.0
        }
        success, response = self.run_test(
            "Admin Update Task", 
            "PUT", 
            f"admin/tasks/{self.created_task_id}", 
            200, 
            data=update_data, 
            auth_required=True
        )
        if success:
            print(f"   Task updated successfully")
            print(f"   New title: {response.get('title', 'N/A')}")
        return success, response

    def test_admin_delete_task(self):
        """Test admin delete task endpoint - PRIORITY TEST"""
        if not hasattr(self, 'created_task_id'):
            print("❌ No task ID available for delete testing")
            return False, {}
        
        success, response = self.run_test(
            "Admin Delete Task", 
            "DELETE", 
            f"admin/tasks/{self.created_task_id}", 
            200, 
            auth_required=True
        )
        if success:
            print(f"   Task deactivated successfully")
        return success, response
        """Test portfolio operations (existing functionality)"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        # Create portfolio item
        portfolio_data = {
            'title': 'Test Portfolio Item',
            'description': 'Test portfolio description',
            'competency_areas': '["leadership_supervision"]',
            'tags': '["test", "automation"]'
        }

        success, response = self.run_test(
            "Create Portfolio Item", 
            "POST", 
            f"users/{self.user_id}/portfolio", 
            200,
            data=portfolio_data
        )
        
        if success:
            # Get portfolio items
            self.run_test(
                "Get User Portfolio", 
                "GET", 
                f"users/{self.user_id}/portfolio", 
                200
            )
        
        return success, response

def main():
    print("🚀 Starting Task-Based Competency System API Tests")
    print("=" * 60)
    
    tester = TaskCompetencyAPITester()
    
    # Test sequence following the priority order from review request
    print("\n📋 PRIORITY BACKEND API TESTING SEQUENCE:")
    
    # 1. Basic setup tests
    tester.test_root_endpoint()
    tester.test_create_user()
    tester.test_get_user()
    
    # 2. PRIORITY TESTS - Task Management System
    print("\n🎯 PRIORITY TESTS - Task Management System:")
    tester.test_seed_sample_tasks()  # GET /api/admin/seed-tasks
    tester.test_get_all_tasks()      # GET /api/tasks
    tester.test_get_user_tasks_for_competency()  # GET /api/users/{id}/tasks/{area}/{sub}
    tester.test_complete_task()      # POST /api/users/{id}/task-completions
    tester.test_get_user_competencies()  # GET /api/users/{id}/competencies
    
    # 3. Additional API tests
    print("\n📊 Additional API Tests:")
    tester.test_get_competency_framework()
    tester.test_get_tasks_for_competency()
    tester.test_get_user_task_completions()
    tester.test_portfolio_operations()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL TEST RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED! Task-based competency system is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())