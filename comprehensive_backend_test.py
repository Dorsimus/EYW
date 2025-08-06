import requests
import sys
import json
import time
from datetime import datetime

class ComprehensiveBackendTester:
    def __init__(self, base_url="https://5c4e7af9-58b9-4c17-9f37-d1d722047d4c.preview.emergentagent.com"):
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
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Failed - Error after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def test_user_creation_api(self):
        """Test POST /api/users (user creation) - PRIORITY 1"""
        print("\n🎯 PRIORITY 1: User Creation API Testing")
        
        user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Test Navigator",
            "role": "participant",
            "level": "navigator"
        }
        
        success, response = self.run_test("Create User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   ✅ Created user with ID: {self.user_id}")
        return success, response

    def test_competency_progress_data(self):
        """Test GET /api/users/{id}/competencies (competency progress data) - PRIORITY 1"""
        print("\n🎯 PRIORITY 1: Competency Progress Data Testing")
        
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
            
            # Verify all 5 competency areas exist
            expected_areas = [
                'leadership_supervision',
                'financial_management', 
                'operational_management',
                'cross_functional_collaboration',
                'strategic_thinking'
            ]
            
            missing_areas = []
            for area in expected_areas:
                if area not in response:
                    missing_areas.append(area)
                else:
                    area_data = response[area]
                    overall_progress = area_data.get('overall_progress', 0)
                    sub_count = len(area_data.get('sub_competencies', {}))
                    print(f"   ✅ {area_data.get('name', area)}: {overall_progress}% ({sub_count} sub-competencies)")
            
            if missing_areas:
                print(f"   ❌ Missing competency areas: {missing_areas}")
                return False, response
            else:
                print("   ✅ All 5 competency areas present with progress calculation")
        
        return success, response

    def test_competency_structure_verification(self):
        """Test backend NAVIGATOR_COMPETENCIES has correct streamlined structures - PRIORITY 2"""
        print("\n🎯 PRIORITY 2: Competency Structure Verification")
        
        success, response = self.run_test("Get Competency Framework", "GET", "competencies", 200)
        
        if not success:
            return False, {}
        
        # Expected streamlined structures
        expected_structures = {
            'cross_functional_collaboration': {
                'expected_sub_count': 4,
                'expected_sub_competencies': [
                    'understanding_other_department',
                    'unified_resident_experience', 
                    'communication_across_departments',
                    'stakeholder_relationship_building'
                ]
            },
            'strategic_thinking': {
                'expected_sub_count': 4,
                'expected_sub_competencies': [
                    'seeing_patterns_anticipating_trends',
                    'innovation_continuous_improvement',
                    'problem_solving_future_focus',
                    'planning_goal_achievement'
                ]
            },
            'leadership_supervision': {
                'expected_sub_count': 4,
                'expected_sub_competencies': [
                    'inspiring_team_motivation',
                    'mastering_difficult_conversations',
                    'building_collaborative_culture',
                    'developing_others_success'
                ]
            },
            'financial_management': {
                'expected_sub_count': 4,
                'expected_sub_competencies': [
                    'property_pl_understanding',
                    'departmental_budget_management',
                    'cost_conscious_decision_making',
                    'financial_communication_business_understanding'
                ]
            },
            'operational_management': {
                'expected_sub_count': 4,
                'expected_sub_competencies': [
                    'process_improvement_efficiency',
                    'quality_control_standards',
                    'safety_leadership_risk_awareness',
                    'technology_system_optimization'
                ]
            }
        }
        
        structure_issues = []
        total_expected_tasks = 0
        
        for area_key, expected in expected_structures.items():
            if area_key not in response:
                structure_issues.append(f"Missing competency area: {area_key}")
                continue
            
            area_data = response[area_key]
            sub_competencies = area_data.get('sub_competencies', {})
            actual_sub_count = len(sub_competencies)
            expected_sub_count = expected['expected_sub_count']
            
            print(f"   {area_key}: {actual_sub_count}/{expected_sub_count} sub-competencies")
            
            if actual_sub_count != expected_sub_count:
                structure_issues.append(f"{area_key}: Expected {expected_sub_count} sub-competencies, got {actual_sub_count}")
            
            # Check specific sub-competencies
            for expected_sub in expected['expected_sub_competencies']:
                if expected_sub not in sub_competencies:
                    structure_issues.append(f"{area_key} missing sub-competency: {expected_sub}")
            
            # Each area should have 16 tasks (4 sub-competencies × 4 tasks each)
            total_expected_tasks += 16
        
        print(f"   Expected total tasks across all frameworks: {total_expected_tasks}")
        
        if structure_issues:
            print("   ❌ Structure issues found:")
            for issue in structure_issues:
                print(f"     - {issue}")
            return False, response
        else:
            print("   ✅ All competency structures match streamlined requirements")
            return True, response

    def test_admin_login(self):
        """Test POST /api/admin/login - PRIORITY 3"""
        print("\n🎯 PRIORITY 3: Admin Authentication Testing")
        
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response.get('user')
            print(f"   ✅ Admin login successful, token obtained")
        return success, response

    def test_admin_stats_total_tasks(self):
        """Test GET /api/admin/stats (should show 80 total tasks) - PRIORITY 3"""
        print("\n🎯 PRIORITY 3: Admin Stats Testing (Expected 80 Total Tasks)")
        
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False, {}
        
        success, response = self.run_test("Admin Stats", "GET", "admin/stats", 200, auth_required=True)
        if success and isinstance(response, dict):
            total_tasks = response.get('total_tasks', 0)
            total_users = response.get('total_users', 0)
            total_completions = response.get('total_completions', 0)
            completion_rate = response.get('completion_rate', 0)
            active_areas = response.get('active_competency_areas', 0)
            
            print(f"   Total Users: {total_users}")
            print(f"   Total Tasks: {total_tasks}")
            print(f"   Total Completions: {total_completions}")
            print(f"   Completion Rate: {completion_rate}%")
            print(f"   Active Competency Areas: {active_areas}")
            
            # Check if we have the expected 80 tasks (5 areas × 16 tasks each)
            if total_tasks == 80:
                print("   ✅ PERFECT: Total tasks = 80 (matches streamlined framework expectation)")
            else:
                print(f"   ⚠️  Total tasks = {total_tasks} (expected 80 for streamlined frameworks)")
            
            if active_areas == 5:
                print("   ✅ All 5 competency areas active")
            else:
                print(f"   ⚠️  Active areas = {active_areas} (expected 5)")
        
        return success, response

    def test_admin_task_management_apis(self):
        """Test admin task management APIs - PRIORITY 3"""
        print("\n🎯 PRIORITY 3: Admin Task Management APIs Testing")
        
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False, {}
        
        # Test GET all tasks
        success, tasks = self.run_test("Admin Get All Tasks", "GET", "admin/tasks", 200, auth_required=True)
        if not success:
            return False, {}
        
        print(f"   Found {len(tasks)} total tasks")
        
        # Test CREATE task
        task_data = {
            "title": "Test Streamlined Framework Task",
            "description": "Test task for streamlined framework verification",
            "task_type": "assessment",
            "competency_area": "cross_functional_collaboration",
            "sub_competency": "understanding_other_department",
            "order": 99,
            "required": True,
            "estimated_hours": 2.0,
            "instructions": "Complete this test task"
        }
        
        success, created_task = self.run_test("Admin Create Task", "POST", "admin/tasks", 200, data=task_data, auth_required=True)
        if not success:
            return False, {}
        
        created_task_id = created_task.get('id')
        print(f"   ✅ Created test task: {created_task_id}")
        
        # Test UPDATE task
        update_data = {
            "title": "Updated Streamlined Framework Task",
            "estimated_hours": 3.0
        }
        
        success, updated_task = self.run_test(
            "Admin Update Task", 
            "PUT", 
            f"admin/tasks/{created_task_id}", 
            200, 
            data=update_data, 
            auth_required=True
        )
        if success:
            print(f"   ✅ Updated task successfully")
        
        # Test DELETE task
        success, delete_response = self.run_test(
            "Admin Delete Task", 
            "DELETE", 
            f"admin/tasks/{created_task_id}", 
            200, 
            auth_required=True
        )
        if success:
            print(f"   ✅ Deleted task successfully")
        
        return True, {"create": created_task, "update": updated_task, "delete": delete_response}

    def test_data_consistency(self):
        """Test data consistency between backend and frontend requirements - PRIORITY 4"""
        print("\n🎯 PRIORITY 4: Data Consistency Verification")
        
        # Get competency framework
        success, framework = self.run_test("Get Competency Framework", "GET", "competencies", 200)
        if not success:
            return False, {}
        
        # Get user competencies if user exists
        user_competencies = {}
        if self.user_id:
            success, user_competencies = self.run_test(
                "Get User Competencies", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
        
        consistency_issues = []
        
        # Check Cross-Functional Collaboration consistency
        if 'cross_functional_collaboration' in framework:
            cf_framework = framework['cross_functional_collaboration']
            expected_name = "Cross-Functional Collaboration"
            expected_desc = "Breaking Down Silos & Building Unified Property Teams"
            
            if cf_framework.get('name') != expected_name:
                consistency_issues.append(f"Cross-Functional name mismatch: expected '{expected_name}', got '{cf_framework.get('name')}'")
            
            if cf_framework.get('description') != expected_desc:
                consistency_issues.append(f"Cross-Functional description mismatch")
            
            # Check user competency alignment
            if user_competencies and 'cross_functional_collaboration' in user_competencies:
                user_cf = user_competencies['cross_functional_collaboration']
                if user_cf.get('name') != expected_name:
                    consistency_issues.append("User competency Cross-Functional name mismatch")
        else:
            consistency_issues.append("Missing cross_functional_collaboration in framework")
        
        # Check Strategic Thinking consistency
        if 'strategic_thinking' in framework:
            st_framework = framework['strategic_thinking']
            expected_name = "Strategic Thinking & Planning"
            expected_desc = "Think Beyond Today - Lead for Tomorrow"
            
            if st_framework.get('name') != expected_name:
                consistency_issues.append(f"Strategic Thinking name mismatch: expected '{expected_name}', got '{st_framework.get('name')}'")
            
            if st_framework.get('description') != expected_desc:
                consistency_issues.append(f"Strategic Thinking description mismatch")
        else:
            consistency_issues.append("Missing strategic_thinking in framework")
        
        if consistency_issues:
            print("   ❌ Data consistency issues found:")
            for issue in consistency_issues:
                print(f"     - {issue}")
            return False, {"issues": consistency_issues}
        else:
            print("   ✅ Data consistency verified - backend matches frontend requirements")
            return True, {"issues": []}

    def test_no_regressions(self):
        """Test that existing functionality has no regressions - PRIORITY 4"""
        print("\n🎯 PRIORITY 4: Regression Testing")
        
        # Test basic user operations
        if not self.user_id:
            print("❌ No user ID for regression testing")
            return False, {}
        
        # Test user retrieval
        success, user_data = self.run_test("Get User", "GET", f"users/{self.user_id}", 200)
        if not success:
            print("   ❌ User retrieval regression")
            return False, {}
        
        # Test competency progress calculation
        success, competencies = self.run_test(
            "Get User Competencies", 
            "GET", 
            f"users/{self.user_id}/competencies", 
            200
        )
        if not success:
            print("   ❌ Competency progress regression")
            return False, {}
        
        # Test admin functionality if token available
        if self.admin_token:
            success, admin_users = self.run_test("Admin Get Users", "GET", "admin/users", 200, auth_required=True)
            if not success:
                print("   ❌ Admin users regression")
                return False, {}
        
        print("   ✅ No regressions detected in existing functionality")
        return True, {}

    def run_comprehensive_test(self):
        """Run all comprehensive backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print("🎯 FOCUS: Streamlined Framework Backend Verification")
        print("=" * 80)
        
        # Priority 1: User Management APIs
        print("\n📋 PRIORITY 1: USER MANAGEMENT APIs")
        self.test_user_creation_api()
        self.test_competency_progress_data()
        
        # Priority 2: Competency Structure Verification
        print("\n📋 PRIORITY 2: COMPETENCY STRUCTURE VERIFICATION")
        self.test_competency_structure_verification()
        
        # Priority 3: Admin APIs
        print("\n📋 PRIORITY 3: ADMIN APIs")
        self.test_admin_login()
        self.test_admin_stats_total_tasks()
        self.test_admin_task_management_apis()
        
        # Priority 4: Data Consistency & Regressions
        print("\n📋 PRIORITY 4: DATA CONSISTENCY & REGRESSIONS")
        self.test_data_consistency()
        self.test_no_regressions()
        
        # Final Results
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST RESULTS:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL TESTS PASSED! Backend is ready for streamlined framework.")
        else:
            failed = self.tests_run - self.tests_passed
            print(f"\n⚠️  {failed} tests failed. Review issues above.")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)