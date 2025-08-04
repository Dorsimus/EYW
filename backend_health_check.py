#!/usr/bin/env python3
"""
Backend Health Check Test Suite
Focus: User management APIs, Admin authentication, and overall system health
After PDF export frontend fix verification
"""

import requests
import sys
import json
import time
from datetime import datetime

class BackendHealthChecker:
    def __init__(self, base_url="https://dfa066c0-2724-4f8c-87ee-696b2f1f82b7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.critical_failures = []
        self.minor_issues = []

    def log_result(self, test_name, success, response_time, details=""):
        """Log test result with categorization"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - {response_time:.2f}s")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {test_name} - {response_time:.2f}s")
            if details:
                print(f"   {details}")

    def run_api_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False, timeout=30):
        """Run a single API test with comprehensive error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        start_time = time.time()
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
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
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                except:
                    response_data = response.text
                self.log_result(name, True, response_time, f"Status: {response.status_code}")
                return True, response_data
            else:
                error_detail = f"Expected {expected_status}, got {response.status_code}"
                if response.status_code >= 500:
                    self.critical_failures.append(f"{name}: {error_detail}")
                else:
                    self.minor_issues.append(f"{name}: {error_detail}")
                self.log_result(name, False, response_time, error_detail)
                return False, {}

        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            error_detail = f"TIMEOUT after {response_time:.2f}s (limit: {timeout}s)"
            self.critical_failures.append(f"{name}: {error_detail}")
            self.log_result(name, False, response_time, error_detail)
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            error_detail = f"Connection error: {str(e)}"
            self.critical_failures.append(f"{name}: {error_detail}")
            self.log_result(name, False, response_time, error_detail)
            return False, {"error": str(e)}

    def test_api_root(self):
        """Test root API endpoint health"""
        print("\n🔍 Testing API Root Endpoint...")
        return self.run_api_test("API Root", "GET", "", 200)

    def test_user_management_apis(self):
        """Test user management APIs as specified in review request"""
        print("\n🔍 Testing User Management APIs...")
        
        # Test GET /api/users
        success1, users_data = self.run_api_test("GET /api/users", "GET", "users", 200)
        if success1:
            user_count = len(users_data) if isinstance(users_data, list) else 0
            print(f"   Found {user_count} users in system")

        # Test POST /api/users with realistic data
        user_data = {
            "email": f"health_check_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Health Check Navigator",
            "role": "participant",
            "level": "navigator"
        }
        success2, user_response = self.run_api_test("POST /api/users", "POST", "users", 200, data=user_data)
        if success2 and 'id' in user_response:
            self.user_id = user_response['id']
            print(f"   Created test user with ID: {self.user_id}")

        # Test GET /api/users/{id}/competencies
        if self.user_id:
            success3, competencies = self.run_api_test(
                "GET /api/users/{id}/competencies", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
            if success3:
                comp_count = len(competencies) if isinstance(competencies, dict) else 0
                print(f"   User has {comp_count} competency areas")
        else:
            success3 = False
            print("   ❌ Cannot test user competencies - no user ID available")

        return success1 and success2 and success3

    def test_admin_authentication(self):
        """Test admin authentication system as specified in review request"""
        print("\n🔍 Testing Admin Authentication System...")
        
        # First ensure admin user exists
        admin_data = {
            "email": "admin@earnwings.com",
            "name": "Admin User",
            "role": "admin",
            "level": "navigator",
            "is_admin": True,
            "password": "admin123"
        }
        self.run_api_test("Create Admin User", "POST", "admin/create", 200, data=admin_data)

        # Test POST /api/admin/login
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_api_test("POST /api/admin/login", "POST", "admin/login", 200, data=login_data)
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            admin_user = response.get('user', {})
            print(f"   Admin login successful: {admin_user.get('name', 'Unknown')}")
            print(f"   Token obtained and stored for further tests")
            return True
        else:
            self.critical_failures.append("Admin authentication failed - critical system component")
            return False

    def test_major_endpoints_health(self):
        """Test basic health of all major endpoints"""
        print("\n🔍 Testing Major Endpoints Health...")
        
        endpoints_to_test = [
            ("GET /api/competencies", "GET", "competencies", 200),
            ("GET /api/tasks", "GET", "tasks", 200),
        ]
        
        # Add admin endpoints if we have token
        if self.admin_token:
            endpoints_to_test.extend([
                ("GET /api/admin/stats", "GET", "admin/stats", 200, True),
                ("GET /api/admin/tasks", "GET", "admin/tasks", 200, True),
                ("GET /api/admin/users", "GET", "admin/users", 200, True),
            ])

        all_healthy = True
        for endpoint_info in endpoints_to_test:
            name, method, endpoint, expected_status = endpoint_info[:4]
            auth_required = endpoint_info[4] if len(endpoint_info) > 4 else False
            
            success, response = self.run_api_test(name, method, endpoint, expected_status, auth_required=auth_required)
            if not success:
                all_healthy = False
            elif isinstance(response, (list, dict)):
                # Log some basic info about the response
                if isinstance(response, list):
                    print(f"   Response: {len(response)} items")
                elif isinstance(response, dict) and 'total_users' in response:
                    print(f"   Stats: {response.get('total_users', 0)} users, {response.get('total_tasks', 0)} tasks")

        return all_healthy

    def test_competency_framework_integrity(self):
        """Test that competency framework is intact after frontend changes"""
        print("\n🔍 Testing Competency Framework Integrity...")
        
        success, framework = self.run_api_test("Competency Framework", "GET", "competencies", 200)
        if not success:
            return False

        expected_areas = [
            "leadership_supervision",
            "financial_management", 
            "operational_management",
            "cross_functional_collaboration",
            "strategic_thinking"
        ]

        framework_intact = True
        for area in expected_areas:
            if area in framework:
                area_data = framework[area]
                sub_comps = area_data.get('sub_competencies', {})
                print(f"   ✅ {area}: {len(sub_comps)} sub-competencies")
            else:
                print(f"   ❌ Missing competency area: {area}")
                framework_intact = False
                self.critical_failures.append(f"Missing competency area: {area}")

        return framework_intact

    def test_task_system_health(self):
        """Test that task system is working properly"""
        print("\n🔍 Testing Task System Health...")
        
        # Get all tasks
        success1, tasks = self.run_api_test("Get All Tasks", "GET", "tasks", 200)
        if success1:
            task_count = len(tasks) if isinstance(tasks, list) else 0
            print(f"   Found {task_count} active tasks")
            
            # Check task distribution across competencies
            if isinstance(tasks, list) and tasks:
                competency_counts = {}
                for task in tasks:
                    comp_area = task.get('competency_area', 'unknown')
                    competency_counts[comp_area] = competency_counts.get(comp_area, 0) + 1
                
                print("   Task distribution:")
                for comp, count in competency_counts.items():
                    print(f"     - {comp}: {count} tasks")

        # Test task completion if we have a user
        if self.user_id and success1 and isinstance(tasks, list) and tasks:
            # Try to get user tasks for a specific competency
            success2, user_tasks = self.run_api_test(
                "Get User Tasks", 
                "GET", 
                f"users/{self.user_id}/tasks/leadership_supervision/inspiring_team_motivation", 
                200
            )
            if success2:
                print(f"   User task retrieval working")
        else:
            success2 = True  # Skip if no user or tasks

        return success1 and success2

    def run_comprehensive_health_check(self):
        """Run comprehensive backend health check"""
        print("🚀 Starting Backend Health Check After PDF Export Frontend Fix")
        print("=" * 70)
        
        start_time = time.time()
        
        # Core health tests as specified in review request
        test_results = {
            "api_root": self.test_api_root(),
            "user_management": self.test_user_management_apis(),
            "admin_auth": self.test_admin_authentication(),
            "major_endpoints": self.test_major_endpoints_health(),
            "competency_framework": self.test_competency_framework_integrity(),
            "task_system": self.test_task_system_health()
        }

        total_time = time.time() - start_time
        
        # Generate comprehensive report
        print("\n" + "=" * 70)
        print("🎯 BACKEND HEALTH CHECK RESULTS")
        print("=" * 70)
        
        print(f"📊 Test Summary:")
        print(f"   Total Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"   Total Time: {total_time:.2f}s")
        
        print(f"\n🔍 Component Health Status:")
        for component, status in test_results.items():
            status_icon = "✅" if status else "❌"
            print(f"   {status_icon} {component.replace('_', ' ').title()}: {'HEALTHY' if status else 'ISSUES'}")

        # Critical failures
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   ❌ {failure}")
        
        # Minor issues
        if self.minor_issues:
            print(f"\n⚠️  MINOR ISSUES ({len(self.minor_issues)}):")
            for issue in self.minor_issues:
                print(f"   ⚠️  {issue}")

        # Overall assessment
        critical_systems_healthy = test_results["user_management"] and test_results["admin_auth"]
        overall_healthy = all(test_results.values())
        
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if overall_healthy:
            print("   ✅ ALL SYSTEMS HEALTHY - No issues introduced by PDF export frontend fix")
            print("   ✅ Backend APIs are working correctly")
            print("   ✅ System ready for production use")
        elif critical_systems_healthy:
            print("   ⚠️  CORE SYSTEMS HEALTHY - Minor issues detected but not critical")
            print("   ✅ User management and admin authentication working")
            print("   ⚠️  Some non-critical endpoints may need attention")
        else:
            print("   ❌ CRITICAL ISSUES DETECTED - Immediate attention required")
            print("   ❌ Core backend functionality compromised")
            print("   🚨 System may not be ready for production use")

        return overall_healthy, critical_systems_healthy

def main():
    """Main execution function"""
    print("Backend Health Check - Post PDF Export Frontend Fix")
    print("Focus: User Management APIs, Admin Authentication, System Health")
    print()
    
    checker = BackendHealthChecker()
    overall_healthy, critical_healthy = checker.run_comprehensive_health_check()
    
    # Exit with appropriate code
    if overall_healthy:
        sys.exit(0)  # All good
    elif critical_healthy:
        sys.exit(1)  # Minor issues
    else:
        sys.exit(2)  # Critical issues

if __name__ == "__main__":
    main()