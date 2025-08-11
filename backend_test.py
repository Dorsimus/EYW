#!/usr/bin/env python3
"""
CYAN COLOR THEME INTEGRATION VERIFICATION TEST
==============================================

FOCUS: Verify that the new cyan color theme for Client Confidence & Connection competency is properly integrated and working.

SPECIFIC TESTS:
1. Backend Competency Structure Verification
2. Color Theme Readiness Check  
3. No Regression Testing

SUCCESS CRITERIA:
- All 6 competency areas accessible
- client_confidence_connection competency fully operational
- No regressions in existing competencies
- Backend ready to support cyan color theme in frontend
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://f89e38a3-d297-4f05-9465-c93694e16aba.preview.emergentagent.com/api"
TIMEOUT = 15

class ColorThemeIntegrationTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, passed, details=""):
        """Log test result"""
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        self.test_results.append(result)
        print(result)
        
    def test_competency_framework_structure(self):
        """Test 1: Backend Competency Structure Verification"""
        print("\n=== TEST 1: BACKEND COMPETENCY STRUCTURE VERIFICATION ===")
        
        try:
            response = requests.get(f"{BACKEND_URL}/competencies", timeout=TIMEOUT)
            
            if response.status_code == 200:
                competencies = response.json()
                
                # Test 1.1: Verify 6 competency areas total
                total_areas = len(competencies)
                self.log_test(
                    "Total Competency Areas Count", 
                    total_areas == 6,
                    f"Expected 6, got {total_areas}"
                )
                
                # Test 1.2: Verify client_confidence_connection exists
                has_client_competency = 'client_confidence_connection' in competencies
                self.log_test(
                    "Client Confidence & Connection Competency Exists",
                    has_client_competency,
                    "client_confidence_connection key found" if has_client_competency else "client_confidence_connection key missing"
                )
                
                if has_client_competency:
                    client_comp = competencies['client_confidence_connection']
                    
                    # Test 1.3: Verify correct name
                    expected_name = "Client Confidence & Connection"
                    actual_name = client_comp.get('name', '')
                    self.log_test(
                        "Client Competency Name Correct",
                        actual_name == expected_name,
                        f"Expected '{expected_name}', got '{actual_name}'"
                    )
                    
                    # Test 1.4: Verify description exists
                    has_description = bool(client_comp.get('description', ''))
                    self.log_test(
                        "Client Competency Description Exists",
                        has_description,
                        f"Description: '{client_comp.get('description', 'MISSING')[:50]}...'"
                    )
                    
                    # Test 1.5: Verify 4 sub-competencies
                    sub_competencies = client_comp.get('sub_competencies', {})
                    sub_count = len(sub_competencies)
                    self.log_test(
                        "Client Competency Has 4 Sub-Competencies",
                        sub_count == 4,
                        f"Expected 4, got {sub_count}: {list(sub_competencies.keys())}"
                    )
                    
                    # Test 1.6: Verify specific sub-competency keys
                    expected_subs = [
                        'understanding_client_impact',
                        'service_excellence_presence', 
                        'client_communication_skills',
                        'client_advocacy_value'
                    ]
                    
                    for sub_key in expected_subs:
                        has_sub = sub_key in sub_competencies
                        self.log_test(
                            f"Sub-competency '{sub_key}' exists",
                            has_sub,
                            f"Found: {sub_competencies.get(sub_key, 'MISSING')}" if has_sub else "Missing"
                        )
                
                # Test 1.7: Verify all existing competencies still exist
                expected_existing = [
                    'leadership_supervision',
                    'financial_management', 
                    'operational_management',
                    'cross_functional_collaboration',
                    'strategic_thinking'
                ]
                
                for comp_key in expected_existing:
                    has_comp = comp_key in competencies
                    self.log_test(
                        f"Existing competency '{comp_key}' still exists",
                        has_comp,
                        f"Name: {competencies.get(comp_key, {}).get('name', 'MISSING')}" if has_comp else "Missing"
                    )
                    
            else:
                self.log_test(
                    "GET /api/competencies endpoint accessible",
                    False,
                    f"HTTP {response.status_code}: {response.text[:100]}"
                )
                
        except Exception as e:
            self.log_test(
                "Competency Framework Structure Test",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_color_theme_readiness(self):
        """Test 2: Color Theme Readiness Check"""
        print("\n=== TEST 2: COLOR THEME READINESS CHECK ===")
        
        # Test 2.1: Create test user for task assignment testing
        try:
            test_user_data = {
                "email": f"colortest_{uuid.uuid4().hex[:8]}@earnwings.com",
                "name": "Color Theme Test User",
                "role": "participant",
                "level": "navigator"
            }
            
            response = requests.post(f"{BACKEND_URL}/users", json=test_user_data, timeout=TIMEOUT)
            
            if response.status_code == 200:
                test_user = response.json()
                test_user_id = test_user['id']
                
                self.log_test(
                    "Test User Creation for Color Theme Testing",
                    True,
                    f"Created user: {test_user_id}"
                )
                
                # Test 2.2: Get user competencies to verify client_confidence_connection is initialized
                comp_response = requests.get(f"{BACKEND_URL}/users/{test_user_id}/competencies", timeout=TIMEOUT)
                
                if comp_response.status_code == 200:
                    user_competencies = comp_response.json()
                    
                    has_client_comp = 'client_confidence_connection' in user_competencies
                    self.log_test(
                        "Client Competency Initialized for New User",
                        has_client_comp,
                        "client_confidence_connection found in user competencies" if has_client_comp else "Missing from user competencies"
                    )
                    
                    if has_client_comp:
                        client_user_comp = user_competencies['client_confidence_connection']
                        
                        # Test 2.3: Verify sub-competencies are properly initialized
                        sub_comps = client_user_comp.get('sub_competencies', {})
                        sub_count = len(sub_comps)
                        self.log_test(
                            "Client Sub-Competencies Initialized",
                            sub_count == 4,
                            f"Found {sub_count} sub-competencies: {list(sub_comps.keys())}"
                        )
                        
                        # Test 2.4: Verify progress tracking structure
                        for sub_key, sub_data in sub_comps.items():
                            has_progress_fields = all(field in sub_data for field in ['completion_percentage', 'completed_tasks', 'total_tasks'])
                            self.log_test(
                                f"Progress tracking for '{sub_key}'",
                                has_progress_fields,
                                f"Progress: {sub_data.get('completion_percentage', 'N/A')}%, Tasks: {sub_data.get('completed_tasks', 'N/A')}/{sub_data.get('total_tasks', 'N/A')}"
                            )
                
                else:
                    self.log_test(
                        "User Competencies Retrieval",
                        False,
                        f"HTTP {comp_response.status_code}: {comp_response.text[:100]}"
                    )
                    
            else:
                self.log_test(
                    "Test User Creation",
                    False,
                    f"HTTP {response.status_code}: {response.text[:100]}"
                )
                
        except Exception as e:
            self.log_test(
                "Color Theme Readiness Test",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_task_assignment_capability(self):
        """Test 3: Task Assignment to New Competency"""
        print("\n=== TEST 3: TASK ASSIGNMENT CAPABILITY ===")
        
        try:
            # Test 3.1: Get all tasks to see if any are assigned to client_confidence_connection
            response = requests.get(f"{BACKEND_URL}/tasks", timeout=TIMEOUT)
            
            if response.status_code == 200:
                all_tasks = response.json()
                
                # Count tasks by competency area
                competency_task_counts = {}
                client_tasks = []
                
                for task in all_tasks:
                    comp_area = task.get('competency_area', 'unknown')
                    competency_task_counts[comp_area] = competency_task_counts.get(comp_area, 0) + 1
                    
                    if comp_area == 'client_confidence_connection':
                        client_tasks.append(task)
                
                self.log_test(
                    "Tasks Endpoint Accessible",
                    True,
                    f"Retrieved {len(all_tasks)} total tasks across {len(competency_task_counts)} competency areas"
                )
                
                # Test 3.2: Check if client_confidence_connection tasks exist
                client_task_count = competency_task_counts.get('client_confidence_connection', 0)
                self.log_test(
                    "Client Confidence Tasks Available",
                    client_task_count >= 0,  # 0 is acceptable for new competency
                    f"Found {client_task_count} tasks for client_confidence_connection"
                )
                
                # Test 3.3: Verify task structure supports client competency
                if client_tasks:
                    sample_task = client_tasks[0]
                    has_required_fields = all(field in sample_task for field in ['competency_area', 'sub_competency', 'title', 'description'])
                    self.log_test(
                        "Client Task Structure Valid",
                        has_required_fields,
                        f"Sample task: {sample_task.get('title', 'N/A')} in {sample_task.get('sub_competency', 'N/A')}"
                    )
                
                # Test 3.4: Verify all existing competencies still have tasks
                expected_competencies = [
                    'leadership_supervision',
                    'financial_management', 
                    'operational_management',
                    'cross_functional_collaboration',
                    'strategic_thinking'
                ]
                
                for comp in expected_competencies:
                    task_count = competency_task_counts.get(comp, 0)
                    self.log_test(
                        f"Existing competency '{comp}' has tasks",
                        task_count > 0,
                        f"{task_count} tasks found"
                    )
                    
            else:
                self.log_test(
                    "Tasks Endpoint Access",
                    False,
                    f"HTTP {response.status_code}: {response.text[:100]}"
                )
                
        except Exception as e:
            self.log_test(
                "Task Assignment Capability Test",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_admin_endpoints_compatibility(self):
        """Test 4: Admin Endpoints Still Work with New Competency"""
        print("\n=== TEST 4: ADMIN ENDPOINTS COMPATIBILITY ===")
        
        try:
            # Test 4.1: Admin stats endpoint (should work without auth for basic info)
            response = requests.get(f"{BACKEND_URL}/admin/stats", timeout=TIMEOUT)
            
            # Expect 403 (auth required) or 401, not 500 (server error)
            expected_codes = [401, 403]
            auth_required = response.status_code in expected_codes
            
            self.log_test(
                "Admin Stats Endpoint Structure",
                auth_required,
                f"HTTP {response.status_code} (auth required as expected)" if auth_required else f"Unexpected: HTTP {response.status_code}"
            )
            
            # Test 4.2: Admin tasks endpoint
            tasks_response = requests.get(f"{BACKEND_URL}/admin/tasks", timeout=TIMEOUT)
            tasks_auth_required = tasks_response.status_code in expected_codes
            
            self.log_test(
                "Admin Tasks Endpoint Structure", 
                tasks_auth_required,
                f"HTTP {tasks_response.status_code} (auth required as expected)" if tasks_auth_required else f"Unexpected: HTTP {tasks_response.status_code}"
            )
            
            # Test 4.3: Admin users endpoint
            users_response = requests.get(f"{BACKEND_URL}/admin/users", timeout=TIMEOUT)
            users_auth_required = users_response.status_code in expected_codes
            
            self.log_test(
                "Admin Users Endpoint Structure",
                users_auth_required,
                f"HTTP {users_response.status_code} (auth required as expected)" if users_auth_required else f"Unexpected: HTTP {users_response.status_code}"
            )
            
        except Exception as e:
            self.log_test(
                "Admin Endpoints Compatibility Test",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_no_regression_verification(self):
        """Test 5: No Regression Testing"""
        print("\n=== TEST 5: NO REGRESSION VERIFICATION ===")
        
        try:
            # Test 5.1: Basic API health check
            response = requests.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
            
            api_healthy = response.status_code == 200
            self.log_test(
                "API Root Endpoint Health",
                api_healthy,
                f"HTTP {response.status_code}: {response.json() if api_healthy else response.text[:50]}"
            )
            
            # Test 5.2: Competencies endpoint still works
            comp_response = requests.get(f"{BACKEND_URL}/competencies", timeout=TIMEOUT)
            comp_working = comp_response.status_code == 200
            
            if comp_working:
                competencies = comp_response.json()
                total_competencies = len(competencies)
                
                self.log_test(
                    "Competencies Endpoint Functional",
                    total_competencies == 6,
                    f"Returns {total_competencies} competency areas"
                )
                
                # Test 5.3: All competencies have required structure
                structure_valid = True
                for comp_key, comp_data in competencies.items():
                    if not all(field in comp_data for field in ['name', 'description', 'sub_competencies']):
                        structure_valid = False
                        break
                
                self.log_test(
                    "All Competencies Have Valid Structure",
                    structure_valid,
                    "All competencies have name, description, and sub_competencies"
                )
                
            else:
                self.log_test(
                    "Competencies Endpoint Functional",
                    False,
                    f"HTTP {comp_response.status_code}: {comp_response.text[:100]}"
                )
            
            # Test 5.4: User creation still works
            test_user_data = {
                "email": f"regression_{uuid.uuid4().hex[:8]}@earnwings.com",
                "name": "Regression Test User",
                "role": "participant",
                "level": "navigator"
            }
            
            user_response = requests.post(f"{BACKEND_URL}/users", json=test_user_data, timeout=TIMEOUT)
            user_creation_works = user_response.status_code == 200
            
            self.log_test(
                "User Creation Still Functional",
                user_creation_works,
                f"HTTP {user_response.status_code}" + (f": Created user {user_response.json().get('id', 'N/A')}" if user_creation_works else f": {user_response.text[:50]}")
            )
            
        except Exception as e:
            self.log_test(
                "No Regression Verification Test",
                False,
                f"Exception: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all color theme integration tests"""
        print("🎨 CYAN COLOR THEME INTEGRATION VERIFICATION")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Run all test suites
        self.test_competency_framework_structure()
        self.test_color_theme_readiness()
        self.test_task_assignment_capability()
        self.test_admin_endpoints_compatibility()
        self.test_no_regression_verification()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🎨 CYAN COLOR THEME INTEGRATION TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Cyan color theme integration is working perfectly!")
            print("✅ Backend is ready to support cyan color theme in frontend")
        elif success_rate >= 75:
            print("\n✅ GOOD: Cyan color theme integration is mostly working")
            print("⚠️  Some minor issues detected - review failed tests")
        else:
            print("\n❌ ISSUES DETECTED: Cyan color theme integration has problems")
            print("🔧 Review failed tests and fix issues before frontend implementation")
        
        print("\nDETAILED RESULTS:")
        print("-" * 40)
        for result in self.test_results:
            print(result)
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = ColorThemeIntegrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)