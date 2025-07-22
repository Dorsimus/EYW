import requests
import sys
import json
import time
from datetime import datetime

class TaskCompetencyAPITester:
    def __init__(self, base_url="https://5147f857-4f97-4c89-8f4d-299bdabf21cc.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.admin_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False, timeout=30):
        """Run a single API test with timeout and detailed response analysis"""
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
        
        start_time = time.time()
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    if 'Content-Type' in headers:
                        del headers['Content-Type']
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=timeout)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            response_time = time.time() - start_time
            print(f"   Response Time: {response_time:.2f}s")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            print(f"   CORS Headers: {cors_headers}")

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

        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            print(f"❌ Failed - TIMEOUT after {response_time:.2f}s (limit: {timeout}s)")
            print(f"   This could explain frontend hanging issues!")
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Failed - Error after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_create_user_frontend_format(self):
        """Test user creation with EXACT frontend format - HIGH PRIORITY"""
        # This is the exact payload format that frontend sends
        user_data = {
            "email": "demo@earnwings.com",
            "name": "Demo Navigator", 
            "role": "participant",
            "level": "navigator"
        }
        print(f"   Testing with EXACT frontend payload: {json.dumps(user_data)}")
        success, response = self.run_test("Create User (Frontend Format)", "POST", "users", 200, data=user_data, timeout=10)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created user with ID: {self.user_id}")
        return success, response

    def test_create_user_variations(self):
        """Test user creation with different payload variations - HIGH PRIORITY"""
        test_cases = [
            {
                "name": "Minimal Required Fields",
                "data": {
                    "email": f"minimal_{datetime.now().strftime('%H%M%S')}@earnwings.com",
                    "name": "Minimal User"
                }
            },
            {
                "name": "All Fields Specified",
                "data": {
                    "email": f"full_{datetime.now().strftime('%H%M%S')}@earnwings.com",
                    "name": "Full User",
                    "role": "participant",
                    "level": "navigator",
                    "is_admin": False
                }
            },
            {
                "name": "Different Role",
                "data": {
                    "email": f"mentor_{datetime.now().strftime('%H%M%S')}@earnwings.com",
                    "name": "Mentor User",
                    "role": "mentor",
                    "level": "navigator"
                }
            }
        ]
        
        results = []
        for test_case in test_cases:
            print(f"\n   Testing: {test_case['name']}")
            success, response = self.run_test(
                f"Create User - {test_case['name']}", 
                "POST", 
                "users", 
                200, 
                data=test_case['data'],
                timeout=10
            )
            results.append((test_case['name'], success, response))
            
        return results

    def test_create_user(self):
        """Test user creation - LEGACY TEST"""
        user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Test Navigator",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create User (Legacy)", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            if not self.user_id:  # Only set if not already set by frontend format test
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

        # Complete the task using form data (as expected by the API)
        task_data = {
            'task_id': incomplete_task['id'],
            'evidence_description': 'Test completion evidence',
            'notes': 'Automated test completion'
        }

        # Use form data instead of JSON for this endpoint
        url = f"{self.api_url}/users/{self.user_id}/task-completions"
        headers = {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing Complete Task...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=task_data, headers=headers)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                except:
                    response_data = response.text
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                response_data = {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            success = False
            response_data = {}
        
        if success:
            print(f"   Completed task: {incomplete_task.get('title', 'Unknown')}")
        
        return success, response_data

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

    def test_portfolio_operations(self):
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
    print("🚀 Starting COMPREHENSIVE Backend API Tests - FOCUS: User Creation Hanging Issue")
    print("=" * 80)
    
    tester = TaskCompetencyAPITester()
    
    # Test sequence following the priority order from review request
    print("\n📋 BASIC SETUP TESTS:")
    
    # 1. Basic setup tests
    tester.test_root_endpoint()
    
    # 2. HIGH PRIORITY - User Creation API Testing (Main Issue)
    print("\n🔥 HIGH PRIORITY - User Creation API Tests (Frontend Hanging Issue):")
    tester.test_create_user_frontend_format()  # Exact frontend format
    tester.test_create_user_variations()       # Different payload variations
    tester.test_create_user()                  # Legacy test
    tester.test_get_user()
    
    # 3. HIGH PRIORITY - User Data Loading Endpoints
    print("\n📊 HIGH PRIORITY - User Data Loading Tests:")
    tester.test_get_user_competencies()        # GET /api/users/{id}/competencies
    tester.test_portfolio_operations()         # GET /api/users/{id}/portfolio
    
    # 4. MEDIUM PRIORITY - Admin Seed Tasks
    print("\n🌱 MEDIUM PRIORITY - Admin Seed Tasks:")
    tester.test_create_admin_user()  # Create admin if doesn't exist
    tester.test_admin_login()        # POST /api/admin/login
    tester.test_seed_sample_tasks()  # POST /api/admin/seed-tasks
    
    # 5. LOW PRIORITY - Admin API Verification
    print("\n🔐 LOW PRIORITY - Admin API Verification:")
    tester.test_admin_stats()        # GET /api/admin/stats
    tester.test_admin_get_all_tasks()  # GET /api/admin/tasks
    tester.test_admin_get_all_users()  # GET /api/admin/users
    tester.test_admin_create_task()    # POST /api/admin/tasks
    tester.test_admin_update_task()    # PUT /api/admin/tasks/{id}
    tester.test_admin_delete_task()    # DELETE /api/admin/tasks/{id}
    
    # 6. Additional Task Management Tests
    print("\n📚 Additional Task Management Tests:")
    tester.test_get_all_tasks()      # GET /api/tasks
    tester.test_get_user_tasks_for_competency()  # GET /api/users/{id}/tasks/{area}/{sub}
    tester.test_complete_task()      # POST /api/users/{id}/task-completions
    
    # 7. Additional API tests
    print("\n📊 Additional API Tests:")
    tester.test_get_competency_framework()
    tester.test_get_tasks_for_competency()
    tester.test_get_user_task_completions()
    
    # Print final results
    print("\n" + "=" * 80)
    print(f"📊 FINAL TEST RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Specific analysis for user creation hanging issue
    print(f"\n🔍 USER CREATION ANALYSIS:")
    if tester.user_id:
        print(f"✅ User creation working - User ID: {tester.user_id}")
        print(f"   Frontend hanging issue may be related to:")
        print(f"   - Network/proxy issues between frontend and backend")
        print(f"   - Frontend timeout settings")
        print(f"   - React.StrictMode double initialization")
        print(f"   - CORS preflight request handling")
    else:
        print(f"❌ User creation failed - This explains frontend hanging")
    
    # Detailed admin test results
    if tester.admin_token:
        print(f"🔐 Admin Authentication: ✅ SUCCESS")
        print(f"   Token obtained and admin APIs tested")
    else:
        print(f"🔐 Admin Authentication: ❌ FAILED")
        print(f"   Admin functionality could not be tested")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
        print("   If frontend still hangs, issue is likely in frontend/network layer.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} tests failed. Check the issues above.")
        
        # Provide specific feedback for admin system
        if not tester.admin_token:
            print("🚨 CRITICAL: Admin authentication failed - admin features unavailable")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())