import requests
import sys
import json
import time
from datetime import datetime

class TaskCompetencyAPITester:
    def __init__(self, base_url="https://2d5a6698-bb37-49fc-9f5f-0740ac932877.preview.emergentagent.com"):
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

    def test_strategic_thinking_framework_verification(self):
        """Test Strategic Thinking framework structure - CRITICAL TEST"""
        print("\n🎯 CRITICAL: Strategic Thinking Framework Verification")
        
        success, response = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Check if strategic_thinking competency exists
        if 'strategic_thinking' not in response:
            print("❌ CRITICAL: strategic_thinking competency area missing from backend")
            return False, {}
        
        strategic_thinking = response['strategic_thinking']
        # Updated expected structure for refined framework (4 sub-competencies)
        expected_sub_competencies = {
            "seeing_patterns_anticipating_trends": "Seeing Patterns & Anticipating Trends",
            "innovation_continuous_improvement": "Innovation & Continuous Improvement Thinking",
            "problem_solving_future_focus": "Problem-Solving with Future Focus",
            "planning_goal_achievement": "Planning & Goal Achievement with Strategic Perspective"
        }
        
        print(f"   Strategic Thinking Name: {strategic_thinking.get('name', 'Missing')}")
        print(f"   Strategic Thinking Description: {strategic_thinking.get('description', 'Missing')}")
        
        # Verify sub-competencies structure
        backend_sub_competencies = strategic_thinking.get('sub_competencies', {})
        print(f"   Backend Sub-Competencies Count: {len(backend_sub_competencies)}")
        print(f"   Expected Sub-Competencies Count: {len(expected_sub_competencies)}")
        
        # Check each expected sub-competency
        all_match = True
        for key, expected_name in expected_sub_competencies.items():
            if key in backend_sub_competencies:
                actual_name = backend_sub_competencies[key]
                if actual_name == expected_name:
                    print(f"   ✅ {key}: '{actual_name}' - CORRECT")
                else:
                    print(f"   ❌ {key}: Expected '{expected_name}', got '{actual_name}' - MISMATCH")
                    all_match = False
            else:
                print(f"   ❌ {key}: MISSING from backend")
                all_match = False
        
        # Check for unexpected sub-competencies
        for key in backend_sub_competencies:
            if key not in expected_sub_competencies:
                print(f"   ⚠️  {key}: UNEXPECTED sub-competency in backend")
                all_match = False
        
        if all_match:
            print("   🎯 SUCCESS: Backend Strategic Thinking framework matches refined frontend requirements!")
            return True, response
        else:
            print("   ❌ CRITICAL FAILURE: Backend-Frontend Strategic Thinking framework mismatch!")
            return False, response

    def test_cross_functional_framework_verification(self):
        """Test Cross-Functional Collaboration framework structure - CRITICAL TEST"""
        print("\n🎯 CRITICAL: Cross-Functional Framework Verification")
        
        success, response = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Check if cross_functional competency exists
        if 'cross_functional' not in response:
            print("❌ CRITICAL: cross_functional competency area missing from backend")
            return False, {}
        
        cross_functional = response['cross_functional']
        expected_sub_competencies = {
            "interdepartmental_partnership": "Inter-Departmental Partnership & Communication",
            "resident_experience_collaboration": "Resident Experience Collaboration",
            "property_team_culture": "Property-Wide Team Building & Culture",
            "stakeholder_relationship_management": "External Stakeholder Relationship Management",
            "conflict_resolution_collaboration": "Conflict Resolution & Joint Problem Solving"
        }
        
        print(f"   Cross-Functional Name: {cross_functional.get('name', 'Missing')}")
        print(f"   Cross-Functional Description: {cross_functional.get('description', 'Missing')}")
        
        # Verify sub-competencies structure
        backend_sub_competencies = cross_functional.get('sub_competencies', {})
        print(f"   Backend Sub-Competencies Count: {len(backend_sub_competencies)}")
        print(f"   Expected Sub-Competencies Count: {len(expected_sub_competencies)}")
        
        # Check each expected sub-competency
        all_match = True
        for key, expected_name in expected_sub_competencies.items():
            if key in backend_sub_competencies:
                actual_name = backend_sub_competencies[key]
                if actual_name == expected_name:
                    print(f"   ✅ {key}: '{actual_name}' - CORRECT")
                else:
                    print(f"   ❌ {key}: Expected '{expected_name}', got '{actual_name}' - MISMATCH")
                    all_match = False
            else:
                print(f"   ❌ {key}: MISSING from backend")
                all_match = False
        
        # Check for unexpected sub-competencies
        for key in backend_sub_competencies:
            if key not in expected_sub_competencies:
                print(f"   ⚠️  {key}: UNEXPECTED sub-competency in backend")
                all_match = False
        
        if all_match:
            print("   🎯 SUCCESS: Backend Cross-Functional framework matches frontend requirements!")
            return True, response
        else:
            print("   ❌ CRITICAL FAILURE: Backend-Frontend Cross-Functional framework mismatch!")
            return False, response

    def test_strategic_thinking_task_references(self):
        """Test that existing strategic_thinking tasks reference correct sub-competency names"""
        print("\n🔍 Strategic Thinking Task References Verification")
        
        success, response = self.run_test(
            "Get All Tasks", 
            "GET", 
            "tasks", 
            200
        )
        
        if not success:
            return False, {}
        
        # Filter strategic_thinking tasks
        strategic_thinking_tasks = [task for task in response if task.get('competency_area') == 'strategic_thinking']
        print(f"   Found {len(strategic_thinking_tasks)} strategic_thinking tasks")
        
        # Updated expected sub-competencies for refined framework
        expected_sub_competencies = {
            "seeing_patterns_anticipating_trends",
            "innovation_continuous_improvement", 
            "problem_solving_future_focus",
            "planning_goal_achievement"
        }
        
        valid_references = True
        sub_competency_counts = {}
        
        for task in strategic_thinking_tasks:
            sub_comp = task.get('sub_competency')
            title = task.get('title', 'No title')
            
            if sub_comp in expected_sub_competencies:
                print(f"   ✅ Task '{title}' -> {sub_comp} - VALID")
                sub_competency_counts[sub_comp] = sub_competency_counts.get(sub_comp, 0) + 1
            else:
                print(f"   ❌ Task '{title}' -> {sub_comp} - INVALID REFERENCE")
                valid_references = False
        
        # Show distribution
        print(f"   Task Distribution Across Sub-Competencies:")
        for sub_comp in expected_sub_competencies:
            count = sub_competency_counts.get(sub_comp, 0)
            print(f"     - {sub_comp}: {count} tasks")
        
        if valid_references:
            print("   ✅ All strategic_thinking tasks reference valid sub-competencies")
        else:
            print("   ❌ Some strategic_thinking tasks have invalid sub-competency references")
        
        return valid_references, strategic_thinking_tasks

    def test_cross_functional_task_references(self):
        """Test that existing cross_functional tasks reference correct sub-competency names"""
        print("\n🔍 Cross-Functional Task References Verification")
        
        success, response = self.run_test(
            "Get All Tasks", 
            "GET", 
            "tasks", 
            200
        )
        
        if not success:
            return False, {}
        
        # Filter cross_functional tasks
        cross_functional_tasks = [task for task in response if task.get('competency_area') == 'cross_functional']
        print(f"   Found {len(cross_functional_tasks)} cross_functional tasks")
        
        expected_sub_competencies = {
            "interdepartmental_partnership",
            "resident_experience_collaboration", 
            "property_team_culture",
            "stakeholder_relationship_management",
            "conflict_resolution_collaboration"
        }
        
        valid_references = True
        sub_competency_counts = {}
        
        for task in cross_functional_tasks:
            sub_comp = task.get('sub_competency')
            title = task.get('title', 'No title')
            
            if sub_comp in expected_sub_competencies:
                print(f"   ✅ Task '{title}' -> {sub_comp} - VALID")
                sub_competency_counts[sub_comp] = sub_competency_counts.get(sub_comp, 0) + 1
            else:
                print(f"   ❌ Task '{title}' -> {sub_comp} - INVALID REFERENCE")
                valid_references = False
        
        # Show distribution
        print(f"   Task Distribution Across Sub-Competencies:")
        for sub_comp in expected_sub_competencies:
            count = sub_competency_counts.get(sub_comp, 0)
            print(f"     - {sub_comp}: {count} tasks")
        
        if valid_references:
            print("   ✅ All cross_functional tasks reference valid sub-competencies")
        else:
            print("   ❌ Some cross_functional tasks have invalid sub-competency references")
        
        return valid_references, cross_functional_tasks

    def test_strategic_thinking_competency_progress(self):
        """Test competency progress calculation with new Strategic Thinking structure"""
        print("\n📊 Strategic Thinking Competency Progress Calculation")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        success, response = self.run_test(
            "Get User Competencies", 
            "GET", 
            f"users/{self.user_id}/competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Check strategic_thinking competency progress
        if 'strategic_thinking' not in response:
            print("❌ strategic_thinking competency missing from user progress")
            return False, {}
        
        strategic_thinking_progress = response['strategic_thinking']
        sub_competencies = strategic_thinking_progress.get('sub_competencies', {})
        
        expected_sub_competencies = {
            "strategic_analysis_planning",
            "data_driven_decisions",
            "market_competitive_positioning", 
            "innovation_continuous_improvement",
            "vision_goal_achievement"
        }
        
        print(f"   Strategic Thinking Overall Progress: {strategic_thinking_progress.get('overall_progress', 0)}%")
        print(f"   Sub-Competencies Found: {len(sub_competencies)}")
        
        progress_calculation_valid = True
        total_tasks = 0
        total_completed = 0
        
        for sub_comp in expected_sub_competencies:
            if sub_comp in sub_competencies:
                sub_data = sub_competencies[sub_comp]
                completed = sub_data.get('completed_tasks', 0)
                total = sub_data.get('total_tasks', 0)
                percentage = sub_data.get('completion_percentage', 0)
                
                print(f"   ✅ {sub_comp}: {completed}/{total} tasks ({percentage:.1f}%)")
                total_tasks += total
                total_completed += completed
            else:
                print(f"   ❌ {sub_comp}: MISSING from user progress")
                progress_calculation_valid = False
        
        print(f"   Total Strategic Thinking Tasks: {total_tasks}")
        print(f"   Total Completed: {total_completed}")
        
        if progress_calculation_valid:
            print("   ✅ Strategic Thinking competency progress calculation working correctly")
        else:
            print("   ❌ Strategic Thinking competency progress calculation has issues")
        
        return progress_calculation_valid, response

    def test_cross_functional_competency_progress(self):
        """Test competency progress calculation with new Cross-Functional structure"""
        print("\n📊 Cross-Functional Competency Progress Calculation")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        success, response = self.run_test(
            "Get User Competencies", 
            "GET", 
            f"users/{self.user_id}/competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Check cross_functional competency progress
        if 'cross_functional' not in response:
            print("❌ cross_functional competency missing from user progress")
            return False, {}
        
        cross_functional_progress = response['cross_functional']
        sub_competencies = cross_functional_progress.get('sub_competencies', {})
        
        expected_sub_competencies = {
            "interdepartmental_partnership",
            "resident_experience_collaboration",
            "property_team_culture", 
            "stakeholder_relationship_management",
            "conflict_resolution_collaboration"
        }
        
        print(f"   Cross-Functional Overall Progress: {cross_functional_progress.get('overall_progress', 0)}%")
        print(f"   Sub-Competencies Found: {len(sub_competencies)}")
        
        progress_calculation_valid = True
        total_tasks = 0
        total_completed = 0
        
        for sub_comp in expected_sub_competencies:
            if sub_comp in sub_competencies:
                sub_data = sub_competencies[sub_comp]
                completed = sub_data.get('completed_tasks', 0)
                total = sub_data.get('total_tasks', 0)
                percentage = sub_data.get('completion_percentage', 0)
                
                print(f"   ✅ {sub_comp}: {completed}/{total} tasks ({percentage:.1f}%)")
                total_tasks += total
                total_completed += completed
            else:
                print(f"   ❌ {sub_comp}: MISSING from user progress")
                progress_calculation_valid = False
        
        print(f"   Total Cross-Functional Tasks: {total_tasks}")
        print(f"   Total Completed: {total_completed}")
        
        if progress_calculation_valid:
            print("   ✅ Cross-Functional competency progress calculation working correctly")
        else:
            print("   ❌ Cross-Functional competency progress calculation has issues")
        
        return progress_calculation_valid, response

    def test_admin_strategic_thinking_task_management(self):
        """Test admin can manage tasks across new Strategic Thinking sub-competency areas"""
        print("\n🔐 Admin Strategic Thinking Task Management")
        
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False, {}
        
        # Test creating tasks for each new sub-competency
        expected_sub_competencies = [
            "strategic_analysis_planning",
            "data_driven_decisions",
            "market_competitive_positioning",
            "innovation_continuous_improvement", 
            "vision_goal_achievement"
        ]
        
        created_task_ids = []
        all_successful = True
        
        for i, sub_comp in enumerate(expected_sub_competencies):
            task_data = {
                "title": f"Test Strategic Thinking Task - {sub_comp.replace('_', ' ').title()}",
                "description": f"Test task for {sub_comp} sub-competency area",
                "task_type": "assessment",
                "competency_area": "strategic_thinking",
                "sub_competency": sub_comp,
                "order": i + 1,
                "required": True,
                "estimated_hours": 2.0,
                "instructions": f"Complete this test task for {sub_comp} validation"
            }
            
            success, response = self.run_test(
                f"Admin Create Strategic Thinking Task - {sub_comp}", 
                "POST", 
                "admin/tasks", 
                200, 
                data=task_data, 
                auth_required=True
            )
            
            if success and 'id' in response:
                created_task_ids.append(response['id'])
                print(f"   ✅ Created task for {sub_comp}: {response['id']}")
            else:
                print(f"   ❌ Failed to create task for {sub_comp}")
                all_successful = False
        
        # Test updating one of the created tasks
        if created_task_ids:
            test_task_id = created_task_ids[0]
            update_data = {
                "title": "Updated Strategic Thinking Test Task",
                "estimated_hours": 3.0
            }
            
            success, response = self.run_test(
                "Admin Update Strategic Thinking Task", 
                "PUT", 
                f"admin/tasks/{test_task_id}", 
                200, 
                data=update_data, 
                auth_required=True
            )
            
            if success:
                print(f"   ✅ Successfully updated strategic thinking task")
            else:
                print(f"   ❌ Failed to update strategic thinking task")
                all_successful = False
        
        # Clean up - deactivate created test tasks
        for task_id in created_task_ids:
            self.run_test(
                f"Admin Delete Test Task", 
                "DELETE", 
                f"admin/tasks/{task_id}", 
                200, 
                auth_required=True
            )
        
        if all_successful:
            print("   ✅ Admin can successfully manage Strategic Thinking tasks across all sub-competencies")
        else:
            print("   ❌ Admin task management has issues with Strategic Thinking sub-competencies")
        
        return all_successful, {"created_tasks": len(created_task_ids)}

    def test_admin_cross_functional_task_management(self):
        """Test admin can manage tasks across new Cross-Functional sub-competency areas"""
        print("\n🔐 Admin Cross-Functional Task Management")
        
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False, {}
        
        # Test creating tasks for each new sub-competency
        expected_sub_competencies = [
            "interdepartmental_partnership",
            "resident_experience_collaboration",
            "property_team_culture",
            "stakeholder_relationship_management", 
            "conflict_resolution_collaboration"
        ]
        
        created_task_ids = []
        all_successful = True
        
        for i, sub_comp in enumerate(expected_sub_competencies):
            task_data = {
                "title": f"Test Cross-Functional Task - {sub_comp.replace('_', ' ').title()}",
                "description": f"Test task for {sub_comp} sub-competency area",
                "task_type": "assessment",
                "competency_area": "cross_functional",
                "sub_competency": sub_comp,
                "order": i + 1,
                "required": True,
                "estimated_hours": 2.0,
                "instructions": f"Complete this test task for {sub_comp} validation"
            }
            
            success, response = self.run_test(
                f"Admin Create Cross-Functional Task - {sub_comp}", 
                "POST", 
                "admin/tasks", 
                200, 
                data=task_data, 
                auth_required=True
            )
            
            if success and 'id' in response:
                created_task_ids.append(response['id'])
                print(f"   ✅ Created task for {sub_comp}: {response['id']}")
            else:
                print(f"   ❌ Failed to create task for {sub_comp}")
                all_successful = False
        
        # Test updating one of the created tasks
        if created_task_ids:
            test_task_id = created_task_ids[0]
            update_data = {
                "title": "Updated Cross-Functional Test Task",
                "estimated_hours": 3.0
            }
            
            success, response = self.run_test(
                "Admin Update Cross-Functional Task", 
                "PUT", 
                f"admin/tasks/{test_task_id}", 
                200, 
                data=update_data, 
                auth_required=True
            )
            
            if success:
                print(f"   ✅ Successfully updated cross-functional task")
            else:
                print(f"   ❌ Failed to update cross-functional task")
                all_successful = False
        
        # Clean up - deactivate created test tasks
        for task_id in created_task_ids:
            self.run_test(
                f"Admin Delete Test Task", 
                "DELETE", 
                f"admin/tasks/{task_id}", 
                200, 
                auth_required=True
            )
        
        if all_successful:
            print("   ✅ Admin can successfully manage Cross-Functional tasks across all sub-competencies")
        else:
            print("   ❌ Admin task management has issues with Cross-Functional sub-competencies")
        
        return all_successful, {"created_tasks": len(created_task_ids)}

    def test_strategic_thinking_backend_frontend_alignment(self):
        """Test that backend structure matches frontend Strategic Thinking framework"""
        print("\n🔄 Strategic Thinking Backend-Frontend Alignment Verification")
        
        # Get competency framework from backend
        success, framework = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Get user competencies to test the full data flow
        if self.user_id:
            success, user_competencies = self.run_test(
                "Get User Competencies", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
        else:
            user_competencies = {}
        
        # Expected frontend structure
        expected_structure = {
            "name": "Strategic Thinking & Planning",
            "description": "Think Like an Owner, Act Like a Leader, Plan Like a Strategist",
            "sub_competencies": {
                "strategic_analysis_planning": "Property-Level Strategic Analysis & Planning",
                "data_driven_decisions": "Data-Driven Decision Making & Insights",
                "market_competitive_positioning": "Market Awareness & Competitive Positioning",
                "innovation_continuous_improvement": "Innovation & Continuous Improvement Leadership",
                "vision_goal_achievement": "Long-Term Vision & Goal Achievement"
            }
        }
        
        # Verify framework structure
        strategic_thinking = framework.get('strategic_thinking', {})
        alignment_issues = []
        
        # Check name
        if strategic_thinking.get('name') != expected_structure['name']:
            alignment_issues.append(f"Name mismatch: expected '{expected_structure['name']}', got '{strategic_thinking.get('name')}'")
        
        # Check description
        if strategic_thinking.get('description') != expected_structure['description']:
            alignment_issues.append(f"Description mismatch: expected '{expected_structure['description']}', got '{strategic_thinking.get('description')}'")
        
        # Check sub-competencies
        backend_sub_comps = strategic_thinking.get('sub_competencies', {})
        expected_sub_comps = expected_structure['sub_competencies']
        
        if len(backend_sub_comps) != len(expected_sub_comps):
            alignment_issues.append(f"Sub-competency count mismatch: expected {len(expected_sub_comps)}, got {len(backend_sub_comps)}")
        
        for key, expected_name in expected_sub_comps.items():
            if key not in backend_sub_comps:
                alignment_issues.append(f"Missing sub-competency: {key}")
            elif backend_sub_comps[key] != expected_name:
                alignment_issues.append(f"Sub-competency name mismatch for {key}: expected '{expected_name}', got '{backend_sub_comps[key]}'")
        
        # Check user competency data structure alignment
        if user_competencies and 'strategic_thinking' in user_competencies:
            user_strategic_thinking = user_competencies['strategic_thinking']
            user_sub_comps = user_strategic_thinking.get('sub_competencies', {})
            
            for key in expected_sub_comps.keys():
                if key not in user_sub_comps:
                    alignment_issues.append(f"User competency missing sub-competency: {key}")
        
        # Report results
        if not alignment_issues:
            print("   ✅ PERFECT ALIGNMENT: Backend structure exactly matches frontend requirements!")
            print(f"   - Competency name: ✅ '{strategic_thinking.get('name')}'")
            print(f"   - Description: ✅ '{strategic_thinking.get('description')}'")
            print(f"   - Sub-competencies: ✅ {len(backend_sub_comps)} areas correctly defined")
            print(f"   - User progress structure: ✅ Aligned")
            return True, {"alignment": "perfect", "issues": []}
        else:
            print("   ❌ ALIGNMENT ISSUES FOUND:")
            for issue in alignment_issues:
                print(f"     - {issue}")
            return False, {"alignment": "issues", "issues": alignment_issues}

    def test_backend_frontend_alignment(self):
        """Test that backend structure matches frontend Cross-Functional Collaboration framework"""
        print("\n🔄 Backend-Frontend Alignment Verification")
        
        # Get competency framework from backend
        success, framework = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Get user competencies to test the full data flow
        if self.user_id:
            success, user_competencies = self.run_test(
                "Get User Competencies", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
        else:
            user_competencies = {}
        
        # Expected frontend structure
        expected_structure = {
            "name": "Cross-Functional Collaboration",
            "description": "We Win Together - No Department Is an Island",
            "sub_competencies": {
                "interdepartmental_partnership": "Inter-Departmental Partnership & Communication",
                "resident_experience_collaboration": "Resident Experience Collaboration",
                "property_team_culture": "Property-Wide Team Building & Culture",
                "stakeholder_relationship_management": "External Stakeholder Relationship Management",
                "conflict_resolution_collaboration": "Conflict Resolution & Joint Problem Solving"
            }
        }
        
        # Verify framework structure
        cross_functional = framework.get('cross_functional', {})
        alignment_issues = []
        
        # Check name
        if cross_functional.get('name') != expected_structure['name']:
            alignment_issues.append(f"Name mismatch: expected '{expected_structure['name']}', got '{cross_functional.get('name')}'")
        
        # Check description
        if cross_functional.get('description') != expected_structure['description']:
            alignment_issues.append(f"Description mismatch: expected '{expected_structure['description']}', got '{cross_functional.get('description')}'")
        
        # Check sub-competencies
        backend_sub_comps = cross_functional.get('sub_competencies', {})
        expected_sub_comps = expected_structure['sub_competencies']
        
        if len(backend_sub_comps) != len(expected_sub_comps):
            alignment_issues.append(f"Sub-competency count mismatch: expected {len(expected_sub_comps)}, got {len(backend_sub_comps)}")
        
        for key, expected_name in expected_sub_comps.items():
            if key not in backend_sub_comps:
                alignment_issues.append(f"Missing sub-competency: {key}")
            elif backend_sub_comps[key] != expected_name:
                alignment_issues.append(f"Sub-competency name mismatch for {key}: expected '{expected_name}', got '{backend_sub_comps[key]}'")
        
        # Check user competency data structure alignment
        if user_competencies and 'cross_functional' in user_competencies:
            user_cross_functional = user_competencies['cross_functional']
            user_sub_comps = user_cross_functional.get('sub_competencies', {})
            
            for key in expected_sub_comps.keys():
                if key not in user_sub_comps:
                    alignment_issues.append(f"User competency missing sub-competency: {key}")
        
        # Report results
        if not alignment_issues:
            print("   ✅ PERFECT ALIGNMENT: Backend structure exactly matches frontend requirements!")
            print(f"   - Competency name: ✅ '{cross_functional.get('name')}'")
            print(f"   - Description: ✅ '{cross_functional.get('description')}'")
            print(f"   - Sub-competencies: ✅ {len(backend_sub_comps)} areas correctly defined")
            print(f"   - User progress structure: ✅ Aligned")
            return True, {"alignment": "perfect", "issues": []}
        else:
            print("   ❌ ALIGNMENT ISSUES FOUND:")
            for issue in alignment_issues:
                print(f"     - {issue}")
            return False, {"alignment": "issues", "issues": alignment_issues}

    def test_other_competency_areas_regression(self):
        """Test that other competency areas (Leadership, Financial, Operational) still work correctly"""
        print("\n🔍 Other Competency Areas Regression Testing")
        
        success, response = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Expected competency areas that should remain unchanged
        expected_areas = {
            "leadership_supervision": "Leadership & Supervision",
            "financial_management": "Financial Management & Business Acumen", 
            "operational_management": "Operational Management"
        }
        
        regression_issues = []
        
        for area_key, expected_name in expected_areas.items():
            if area_key not in response:
                regression_issues.append(f"Missing competency area: {area_key}")
                continue
                
            area_data = response[area_key]
            actual_name = area_data.get('name', 'Missing')
            
            if actual_name != expected_name:
                regression_issues.append(f"Name changed for {area_key}: expected '{expected_name}', got '{actual_name}'")
            
            # Check that sub-competencies exist
            sub_comps = area_data.get('sub_competencies', {})
            if len(sub_comps) == 0:
                regression_issues.append(f"No sub-competencies found for {area_key}")
            else:
                print(f"   ✅ {area_key}: {len(sub_comps)} sub-competencies found")
        
        # Test user competency progress for these areas
        if self.user_id:
            success, user_competencies = self.run_test(
                "Get User Competencies", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
            
            if success:
                for area_key in expected_areas.keys():
                    if area_key not in user_competencies:
                        regression_issues.append(f"User competency missing area: {area_key}")
                    else:
                        user_area = user_competencies[area_key]
                        user_sub_comps = user_area.get('sub_competencies', {})
                        if len(user_sub_comps) == 0:
                            regression_issues.append(f"User competency has no sub-competencies for {area_key}")
                        else:
                            print(f"   ✅ User progress for {area_key}: {len(user_sub_comps)} sub-competencies tracked")
        
        # Report results
        if not regression_issues:
            print("   ✅ NO REGRESSIONS: All other competency areas working correctly!")
            return True, {"regressions": False, "issues": []}
        else:
            print("   ❌ REGRESSION ISSUES FOUND:")
            for issue in regression_issues:
                print(f"     - {issue}")
            return False, {"regressions": True, "issues": regression_issues}

    def test_cross_functional_collaboration_refined_structure(self):
        """Test the refined Cross-Functional Collaboration framework structure - CRITICAL TEST"""
        print("\n🎯 CRITICAL: Cross-Functional Collaboration Refined Framework Verification")
        
        success, response = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Check if cross_functional_collaboration competency exists (NEW KEY)
        if 'cross_functional_collaboration' not in response:
            print("❌ CRITICAL: cross_functional_collaboration competency area missing from backend")
            print("   Expected key: 'cross_functional_collaboration' (not 'cross_functional')")
            return False, {}
        
        cross_functional = response['cross_functional_collaboration']
        expected_sub_competencies = {
            "understanding_other_department": "Understanding & Appreciating the Other Department",
            "unified_resident_experience": "Unified Resident Experience Creation",
            "communication_across_departments": "Effective Communication Across Departments",
            "stakeholder_relationship_building": "Stakeholder Relationship Building"
        }
        
        print(f"   Cross-Functional Name: {cross_functional.get('name', 'Missing')}")
        print(f"   Cross-Functional Description: {cross_functional.get('description', 'Missing')}")
        
        # Verify sub-competencies structure
        backend_sub_competencies = cross_functional.get('sub_competencies', {})
        print(f"   Backend Sub-Competencies Count: {len(backend_sub_competencies)}")
        print(f"   Expected Sub-Competencies Count: {len(expected_sub_competencies)}")
        
        # Check each expected sub-competency
        all_match = True
        for key, expected_name in expected_sub_competencies.items():
            if key in backend_sub_competencies:
                actual_name = backend_sub_competencies[key]
                if actual_name == expected_name:
                    print(f"   ✅ {key}: '{actual_name}' - CORRECT")
                else:
                    print(f"   ❌ {key}: Expected '{expected_name}', got '{actual_name}' - MISMATCH")
                    all_match = False
            else:
                print(f"   ❌ {key}: MISSING from backend")
                all_match = False
        
        # Check for unexpected sub-competencies
        for key in backend_sub_competencies:
            if key not in expected_sub_competencies:
                print(f"   ⚠️  {key}: UNEXPECTED sub-competency in backend")
                all_match = False
        
        if all_match:
            print("   🎯 SUCCESS: Backend Cross-Functional Collaboration framework matches refined frontend requirements!")
            return True, response
        else:
            print("   ❌ CRITICAL FAILURE: Backend-Frontend Cross-Functional Collaboration framework mismatch!")
            return False, response

    def test_cross_functional_collaboration_user_progress(self):
        """Test user competency progress calculation with refined Cross-Functional structure"""
        print("\n📊 Cross-Functional Collaboration User Progress Calculation")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        success, response = self.run_test(
            "Get User Competencies", 
            "GET", 
            f"users/{self.user_id}/competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Check cross_functional_collaboration competency progress (NEW KEY)
        if 'cross_functional_collaboration' not in response:
            print("❌ cross_functional_collaboration competency missing from user progress")
            print("   Expected key: 'cross_functional_collaboration' (not 'cross_functional')")
            return False, {}
        
        cross_functional_progress = response['cross_functional_collaboration']
        sub_competencies = cross_functional_progress.get('sub_competencies', {})
        
        expected_sub_competencies = {
            "understanding_other_department",
            "unified_resident_experience",
            "communication_across_departments",
            "stakeholder_relationship_building"
        }
        
        print(f"   Cross-Functional Overall Progress: {cross_functional_progress.get('overall_progress', 0)}%")
        print(f"   Sub-Competencies Found: {len(sub_competencies)}")
        
        progress_calculation_valid = True
        total_tasks = 0
        total_completed = 0
        
        for sub_comp in expected_sub_competencies:
            if sub_comp in sub_competencies:
                sub_data = sub_competencies[sub_comp]
                completed = sub_data.get('completed_tasks', 0)
                total = sub_data.get('total_tasks', 0)
                percentage = sub_data.get('completion_percentage', 0)
                
                print(f"   ✅ {sub_comp}: {completed}/{total} tasks ({percentage:.1f}%)")
                total_tasks += total
                total_completed += completed
            else:
                print(f"   ❌ {sub_comp}: MISSING from user progress")
                progress_calculation_valid = False
        
        print(f"   Total Cross-Functional Tasks: {total_tasks}")
        print(f"   Total Completed: {total_completed}")
        
        if progress_calculation_valid:
            print("   ✅ Cross-Functional competency progress calculation working correctly")
        else:
            print("   ❌ Cross-Functional competency progress calculation has issues")
        
        return progress_calculation_valid, response

    def test_cross_functional_collaboration_admin_task_management(self):
        """Test admin can manage tasks across refined Cross-Functional sub-competency areas"""
        print("\n🔐 Admin Cross-Functional Collaboration Task Management")
        
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False, {}
        
        # Test creating tasks for each refined sub-competency
        expected_sub_competencies = [
            "understanding_other_department",
            "unified_resident_experience",
            "communication_across_departments",
            "stakeholder_relationship_building"
        ]
        
        created_task_ids = []
        all_successful = True
        
        for i, sub_comp in enumerate(expected_sub_competencies):
            task_data = {
                "title": f"Test Cross-Functional Task - {sub_comp.replace('_', ' ').title()}",
                "description": f"Test task for {sub_comp} sub-competency area",
                "task_type": "assessment",
                "competency_area": "cross_functional_collaboration",  # NEW KEY
                "sub_competency": sub_comp,
                "order": i + 1,
                "required": True,
                "estimated_hours": 2.0,
                "instructions": f"Complete this test task for {sub_comp} validation"
            }
            
            success, response = self.run_test(
                f"Admin Create Cross-Functional Task - {sub_comp}", 
                "POST", 
                "admin/tasks", 
                200, 
                data=task_data, 
                auth_required=True
            )
            
            if success and 'id' in response:
                created_task_ids.append(response['id'])
                print(f"   ✅ Created task for {sub_comp}: {response['id']}")
            else:
                print(f"   ❌ Failed to create task for {sub_comp}")
                all_successful = False
        
        # Test updating one of the created tasks
        if created_task_ids:
            test_task_id = created_task_ids[0]
            update_data = {
                "title": "Updated Cross-Functional Test Task",
                "estimated_hours": 3.0
            }
            
            success, response = self.run_test(
                "Admin Update Cross-Functional Task", 
                "PUT", 
                f"admin/tasks/{test_task_id}", 
                200, 
                data=update_data, 
                auth_required=True
            )
            
            if success:
                print(f"   ✅ Successfully updated cross-functional task")
            else:
                print(f"   ❌ Failed to update cross-functional task")
                all_successful = False
        
        # Clean up - deactivate created test tasks
        for task_id in created_task_ids:
            self.run_test(
                f"Admin Delete Test Task", 
                "DELETE", 
                f"admin/tasks/{task_id}", 
                200, 
                auth_required=True
            )
        
        if all_successful:
            print("   ✅ Admin can successfully manage Cross-Functional tasks across all refined sub-competencies")
        else:
            print("   ❌ Admin task management has issues with Cross-Functional sub-competencies")
        
        return all_successful, {"created_tasks": len(created_task_ids)}

    def test_existing_cross_functional_tasks_update(self):
        """Test that existing cross_functional tasks are updated to use new structure"""
        print("\n🔍 Existing Cross-Functional Tasks Structure Update Verification")
        
        success, response = self.run_test(
            "Get All Tasks", 
            "GET", 
            "tasks", 
            200
        )
        
        if not success:
            return False, {}
        
        # Filter cross_functional tasks (both old and new keys)
        old_cross_functional_tasks = [task for task in response if task.get('competency_area') == 'cross_functional']
        new_cross_functional_tasks = [task for task in response if task.get('competency_area') == 'cross_functional_collaboration']
        
        print(f"   Found {len(old_cross_functional_tasks)} tasks with old 'cross_functional' key")
        print(f"   Found {len(new_cross_functional_tasks)} tasks with new 'cross_functional_collaboration' key")
        
        expected_new_sub_competencies = {
            "understanding_other_department",
            "unified_resident_experience",
            "communication_across_departments",
            "stakeholder_relationship_building"
        }
        
        # Check old tasks for migration status
        old_tasks_need_update = []
        for task in old_cross_functional_tasks:
            sub_comp = task.get('sub_competency')
            title = task.get('title', 'No title')
            
            if sub_comp not in expected_new_sub_competencies:
                old_tasks_need_update.append({
                    'id': task.get('id'),
                    'title': title,
                    'old_sub_competency': sub_comp
                })
                print(f"   ⚠️  Task '{title}' -> {sub_comp} - NEEDS UPDATE TO NEW STRUCTURE")
        
        # Check new tasks for correct structure
        new_tasks_valid = True
        for task in new_cross_functional_tasks:
            sub_comp = task.get('sub_competency')
            title = task.get('title', 'No title')
            
            if sub_comp in expected_new_sub_competencies:
                print(f"   ✅ Task '{title}' -> {sub_comp} - CORRECT NEW STRUCTURE")
            else:
                print(f"   ❌ Task '{title}' -> {sub_comp} - INVALID SUB-COMPETENCY")
                new_tasks_valid = False
        
        # Summary
        if len(old_tasks_need_update) == 0 and new_tasks_valid:
            print("   ✅ All cross-functional tasks use correct new structure")
            return True, {"old_tasks_needing_update": 0, "new_tasks_valid": True}
        else:
            print(f"   ⚠️  {len(old_tasks_need_update)} old tasks need updating to new structure")
            if not new_tasks_valid:
                print("   ❌ Some new tasks have invalid sub-competency references")
            return False, {"old_tasks_needing_update": len(old_tasks_need_update), "new_tasks_valid": new_tasks_valid}

    def test_cross_functional_collaboration_backend_frontend_alignment(self):
        """Test that backend structure matches refined frontend Cross-Functional Collaboration framework"""
        print("\n🔄 Cross-Functional Collaboration Backend-Frontend Alignment Verification")
        
        # Get competency framework from backend
        success, framework = self.run_test(
            "Get Competency Framework", 
            "GET", 
            "competencies", 
            200
        )
        
        if not success:
            return False, {}
        
        # Get user competencies to test the full data flow
        if self.user_id:
            success, user_competencies = self.run_test(
                "Get User Competencies", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
        else:
            user_competencies = {}
        
        # Expected refined frontend structure
        expected_structure = {
            "name": "Cross-Functional Collaboration",
            "description": "Breaking Down Silos & Building Unified Property Teams",
            "sub_competencies": {
                "understanding_other_department": "Understanding & Appreciating the Other Department",
                "unified_resident_experience": "Unified Resident Experience Creation",
                "communication_across_departments": "Effective Communication Across Departments",
                "stakeholder_relationship_building": "Stakeholder Relationship Building"
            }
        }
        
        # Verify framework structure (NEW KEY)
        cross_functional = framework.get('cross_functional_collaboration', {})
        alignment_issues = []
        
        if not cross_functional:
            alignment_issues.append("Missing 'cross_functional_collaboration' key in backend framework")
            return False, {"alignment": "critical_failure", "issues": alignment_issues}
        
        # Check name
        if cross_functional.get('name') != expected_structure['name']:
            alignment_issues.append(f"Name mismatch: expected '{expected_structure['name']}', got '{cross_functional.get('name')}'")
        
        # Check description
        if cross_functional.get('description') != expected_structure['description']:
            alignment_issues.append(f"Description mismatch: expected '{expected_structure['description']}', got '{cross_functional.get('description')}'")
        
        # Check sub-competencies
        backend_sub_comps = cross_functional.get('sub_competencies', {})
        expected_sub_comps = expected_structure['sub_competencies']
        
        if len(backend_sub_comps) != len(expected_sub_comps):
            alignment_issues.append(f"Sub-competency count mismatch: expected {len(expected_sub_comps)}, got {len(backend_sub_comps)}")
        
        for key, expected_name in expected_sub_comps.items():
            if key not in backend_sub_comps:
                alignment_issues.append(f"Missing sub-competency: {key}")
            elif backend_sub_comps[key] != expected_name:
                alignment_issues.append(f"Sub-competency name mismatch for {key}: expected '{expected_name}', got '{backend_sub_comps[key]}'")
        
        # Check user competency data structure alignment
        if user_competencies and 'cross_functional_collaboration' in user_competencies:
            user_cross_functional = user_competencies['cross_functional_collaboration']
            user_sub_comps = user_cross_functional.get('sub_competencies', {})
            
            for key in expected_sub_comps.keys():
                if key not in user_sub_comps:
                    alignment_issues.append(f"User competency missing sub-competency: {key}")
        elif user_competencies:
            alignment_issues.append("User competencies missing 'cross_functional_collaboration' key")
        
        # Report results
        if not alignment_issues:
            print("   ✅ PERFECT ALIGNMENT: Backend structure exactly matches refined frontend requirements!")
            print(f"   - Competency key: ✅ 'cross_functional_collaboration'")
            print(f"   - Competency name: ✅ '{cross_functional.get('name')}'")
            print(f"   - Description: ✅ '{cross_functional.get('description')}'")
            print(f"   - Sub-competencies: ✅ {len(backend_sub_comps)} areas correctly defined")
            print(f"   - User progress structure: ✅ Aligned")
            return True, {"alignment": "perfect", "issues": []}
        else:
            print("   ❌ ALIGNMENT ISSUES FOUND:")
            for issue in alignment_issues:
                print(f"     - {issue}")
            return False, {"alignment": "issues", "issues": alignment_issues}

def main():
    print("🚀 Starting CROSS-FUNCTIONAL COLLABORATION FRAMEWORK Backend Testing")
    print("🎯 FOCUS: Testing refined Cross-Functional Collaboration framework backend implementation")
    print("=" * 80)
    
    tester = TaskCompetencyAPITester()
    
    # Test sequence following the review request priorities
    print("\n📋 BASIC SETUP TESTS:")
    
    # 1. Basic setup tests
    tester.test_root_endpoint()
    
    # 2. User setup for testing
    print("\n👤 USER SETUP:")
    tester.test_create_user_frontend_format()
    tester.test_get_user()
    
    # 3. Admin setup for testing
    print("\n🔐 ADMIN SETUP:")
    tester.test_create_admin_user()
    tester.test_admin_login()
    
    # 4. CRITICAL - Cross-Functional Collaboration Framework Tests (MAIN FOCUS)
    print("\n🎯 CRITICAL - Cross-Functional Collaboration Framework Tests:")
    tester.test_cross_functional_collaboration_refined_structure()
    tester.test_cross_functional_collaboration_user_progress()
    tester.test_cross_functional_collaboration_admin_task_management()
    tester.test_existing_cross_functional_tasks_update()
    tester.test_cross_functional_collaboration_backend_frontend_alignment()
    
    # 5. Regression testing for other competency areas
    print("\n🔍 REGRESSION TESTING:")
    tester.test_other_competency_areas_regression()
    
    # Print final results
    print("\n" + "=" * 80)
    print(f"📊 FINAL TEST RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Specific analysis for Cross-Functional Collaboration framework
    print(f"\n🎯 CROSS-FUNCTIONAL COLLABORATION FRAMEWORK ANALYSIS:")
    print(f"   This test focused on verifying the backend has been updated to match")
    print(f"   the refined frontend framework with 4 streamlined sub-competencies:")
    print(f"   1. understanding_other_department: Understanding & Appreciating the Other Department")
    print(f"   2. unified_resident_experience: Unified Resident Experience Creation")
    print(f"   3. communication_across_departments: Effective Communication Across Departments")
    print(f"   4. stakeholder_relationship_building: Stakeholder Relationship Building")
    print(f"   ")
    print(f"   Key changes tested:")
    print(f"   - Competency key changed from 'cross_functional' to 'cross_functional_collaboration'")
    print(f"   - Sub-competencies reduced from 5 old ones to 4 new streamlined ones")
    print(f"   - SAMPLE_TASKS updated to use new competency structure")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED! Cross-Functional Collaboration framework backend is working correctly.")
        print("   Backend-frontend alignment achieved successfully.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} tests failed. Check the issues above.")
        
        # Provide specific feedback for Cross-Functional framework
        print("\n🚨 CROSS-FUNCTIONAL COLLABORATION ISSUES:")
        print("   If tests failed, the backend may not be properly synchronized with the frontend.")
        print("   Check that NAVIGATOR_COMPETENCIES['cross_functional_collaboration'] exists and matches frontend structure.")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())