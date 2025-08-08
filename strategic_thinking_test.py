#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class StrategicThinkingTester:
    def __init__(self, base_url="https://6c89303b-3b46-458e-8c48-ff40dea979ca.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None

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

    def setup_admin_session(self):
        """Setup admin session for testing"""
        print("\n🔐 Setting up admin session...")
        
        # Try to create admin user (may already exist)
        admin_data = {
            "email": "admin@earnwings.com",
            "name": "Admin User",
            "role": "admin",
            "level": "navigator",
            "is_admin": True,
            "password": "admin123"
        }
        self.run_test("Create Admin User", "POST", "admin/create", 200, data=admin_data)
        
        # Login as admin
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin login successful, token obtained")
        return success

    def setup_test_user(self):
        """Create test user for testing"""
        print("\n👤 Creating test user...")
        user_data = {
            "email": f"strategic_test_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Strategic Test User",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create Test User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created user with ID: {self.user_id}")
        return success

    def test_strategic_thinking_framework_structure(self):
        """Test Strategic Thinking framework structure - CRITICAL TEST"""
        print("\n🎯 CRITICAL: Strategic Thinking Framework Structure Verification")
        
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
        # Expected structure for refined framework (4 sub-competencies)
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

    def test_user_competency_progress(self):
        """Test user competency progress calculation with new Strategic Thinking structure"""
        print("\n📊 Strategic Thinking User Competency Progress Calculation")
        
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
        
        # Expected sub-competencies for refined framework
        expected_sub_competencies = {
            "seeing_patterns_anticipating_trends",
            "innovation_continuous_improvement",
            "problem_solving_future_focus", 
            "planning_goal_achievement"
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

    def test_admin_task_management(self):
        """Test admin can manage tasks across new Strategic Thinking sub-competency areas"""
        print("\n🔐 Admin Strategic Thinking Task Management")
        
        if not self.admin_token:
            print("❌ No admin token available for testing")
            return False, {}
        
        # Test creating tasks for each refined sub-competency
        expected_sub_competencies = [
            "seeing_patterns_anticipating_trends",
            "innovation_continuous_improvement",
            "problem_solving_future_focus",
            "planning_goal_achievement"
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
            print("   ✅ Admin can successfully manage Strategic Thinking tasks across all refined sub-competencies")
        else:
            print("   ❌ Admin task management has issues with Strategic Thinking sub-competencies")
        
        return all_successful, {"created_tasks": len(created_task_ids)}

    def test_existing_task_references(self):
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
        
        # Expected sub-competencies for refined framework
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

    def test_backend_frontend_alignment(self):
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
        
        # Expected frontend structure for refined framework
        expected_structure = {
            "name": "Strategic Thinking & Planning",
            "description": "Think Beyond Today - Lead for Tomorrow",
            "sub_competencies": {
                "seeing_patterns_anticipating_trends": "Seeing Patterns & Anticipating Trends",
                "innovation_continuous_improvement": "Innovation & Continuous Improvement Thinking",
                "problem_solving_future_focus": "Problem-Solving with Future Focus",
                "planning_goal_achievement": "Planning & Goal Achievement with Strategic Perspective"
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
            print("   ✅ PERFECT ALIGNMENT: Backend structure exactly matches refined frontend requirements!")
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

    def test_regression_check(self):
        """Test that other competency areas still work correctly"""
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
            "operational_management": "Operational Management",
            "cross_functional_collaboration": "Cross-Functional Collaboration"
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
        
        # Report results
        if not regression_issues:
            print("   ✅ NO REGRESSIONS: All other competency areas working correctly!")
            return True, {"regressions": False, "issues": []}
        else:
            print("   ❌ REGRESSION ISSUES FOUND:")
            for issue in regression_issues:
                print(f"     - {issue}")
            return False, {"regressions": True, "issues": regression_issues}

    def run_comprehensive_tests(self):
        """Run comprehensive Strategic Thinking framework tests"""
        print("\n" + "="*80)
        print("🎯 STRATEGIC THINKING FRAMEWORK COMPREHENSIVE TESTING")
        print("="*80)
        
        # Setup
        if not self.setup_admin_session():
            print("❌ Failed to setup admin session")
            return 0, []
        
        if not self.setup_test_user():
            print("❌ Failed to setup test user")
            return 0, []
        
        # Run Strategic Thinking specific tests
        tests = [
            ("Strategic Thinking Framework Structure", self.test_strategic_thinking_framework_structure),
            ("User Competency Progress Calculation", self.test_user_competency_progress),
            ("Admin Task Management", self.test_admin_task_management),
            ("Task References Verification", self.test_existing_task_references),
            ("Backend-Frontend Alignment", self.test_backend_frontend_alignment),
            ("Other Competency Areas Regression", self.test_regression_check)
        ]
        
        results = []
        for test_name, test_method in tests:
            print(f"\n{'='*60}")
            print(f"🧪 Running: {test_name}")
            print(f"{'='*60}")
            
            try:
                success, response = test_method()
                results.append((test_name, success, response))
                
                if success:
                    print(f"✅ {test_name}: PASSED")
                else:
                    print(f"❌ {test_name}: FAILED")
            except Exception as e:
                print(f"💥 {test_name}: ERROR - {str(e)}")
                results.append((test_name, False, {"error": str(e)}))
        
        # Summary
        print("\n" + "="*80)
        print("📊 STRATEGIC THINKING FRAMEWORK TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, success, _ in results if success)
        total = len(results)
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        print(f"Tests Run: {total}")
        print(f"Tests Passed: {passed}")
        print(f"Tests Failed: {total - passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 Detailed Results:")
        for test_name, success, response in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"  {status} - {test_name}")
            if not success and isinstance(response, dict) and 'error' in response:
                print(f"    Error: {response['error']}")
        
        return success_rate, results

if __name__ == "__main__":
    tester = StrategicThinkingTester()
    success_rate, results = tester.run_comprehensive_tests()
    
    if success_rate >= 80:
        print(f"\n🎉 OVERALL SUCCESS: {success_rate:.1f}% success rate - Strategic Thinking framework testing completed successfully!")
        sys.exit(0)
    else:
        print(f"\n⚠️  ISSUES FOUND: {success_rate:.1f}% success rate - Some tests failed, review needed")
        sys.exit(1)