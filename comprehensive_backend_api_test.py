#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Earn Your Wings Platform
Focus: Testing all key backend endpoints after duplicate flightbook entries bug fix
"""

import requests
import json
import time
import sys
from datetime import datetime
import io

class ComprehensiveBackendAPITester:
    def __init__(self, base_url="https://190b5148-8276-48d3-8f7c-e31d248916c6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.admin_user = None
        self.portfolio_item_id = None
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False, timeout=30):
        """Run a single API test with comprehensive error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        # Add authorization header if admin token is available and auth is required
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        self.log(f"Testing {name}")
        self.log(f"   URL: {url}")
        if auth_required:
            self.log(f"   Auth: {'✅ Token provided' if self.admin_token else '❌ No token'}")
        
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
            self.log(f"   Response Time: {response_time:.2f}s")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            self.log(f"❌ FAILED - TIMEOUT after {response_time:.2f}s (limit: {timeout}s)", "ERROR")
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            self.log(f"❌ FAILED - Error after {response_time:.2f}s: {str(e)}", "ERROR")
            return False, {"error": str(e)}

    def test_user_creation_api(self):
        """Test POST /api/users (user creation)"""
        self.log("=" * 60)
        self.log("TESTING USER MANAGEMENT APIs")
        self.log("=" * 60)
        
        user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Test Navigator User",
            "role": "participant",
            "level": "navigator"
        }
        
        success, response = self.run_test(
            "POST /api/users (User Creation)", 
            "POST", 
            "users", 
            200, 
            data=user_data
        )
        
        if success and 'id' in response:
            self.user_id = response['id']
            self.log(f"   ✅ Created user with ID: {self.user_id}")
            self.log(f"   ✅ User email: {response.get('email')}")
            self.log(f"   ✅ User name: {response.get('name')}")
            self.log(f"   ✅ User role: {response.get('role')}")
        
        return success, response

    def test_user_competency_data_api(self):
        """Test GET /api/users/{id}/competencies (user competency data)"""
        if not self.user_id:
            self.log("❌ No user ID available for competency testing", "ERROR")
            return False, {}
        
        success, response = self.run_test(
            "GET /api/users/{id}/competencies (User Competency Data)", 
            "GET", 
            f"users/{self.user_id}/competencies", 
            200
        )
        
        if success and isinstance(response, dict):
            self.log(f"   ✅ Found {len(response)} competency areas")
            for area_key, area_data in response.items():
                overall_progress = area_data.get('overall_progress', 0)
                sub_count = len(area_data.get('sub_competencies', {}))
                self.log(f"   ✅ {area_data.get('name', area_key)}: {overall_progress}% ({sub_count} sub-competencies)")
        
        return success, response

    def test_portfolio_data_api(self):
        """Test GET /api/users/{id}/portfolio (portfolio data)"""
        if not self.user_id:
            self.log("❌ No user ID available for portfolio testing", "ERROR")
            return False, {}
        
        success, response = self.run_test(
            "GET /api/users/{id}/portfolio (Portfolio Data)", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if success:
            portfolio_count = len(response) if isinstance(response, list) else 0
            self.log(f"   ✅ Found {portfolio_count} portfolio items")
        
        return success, response

    def test_portfolio_upload_api(self):
        """Test POST /api/users/{id}/portfolio (portfolio upload)"""
        if not self.user_id:
            self.log("❌ No user ID available for portfolio upload testing", "ERROR")
            return False, {}
        
        # Create a test file
        test_file_content = b"This is a test portfolio document for API testing."
        test_file = io.BytesIO(test_file_content)
        test_file.name = "test_portfolio_document.txt"
        
        portfolio_data = {
            'title': 'API Test Portfolio Item',
            'description': 'Test portfolio item created via API testing',
            'competency_areas': '["leadership_supervision"]',
            'tags': '["test", "api"]',
            'visibility': 'private'
        }
        
        files = {'file': ('test_portfolio_document.txt', test_file, 'text/plain')}
        
        success, response = self.run_test(
            "POST /api/users/{id}/portfolio (Portfolio Upload)", 
            "POST", 
            f"users/{self.user_id}/portfolio", 
            200,
            data=portfolio_data,
            files=files
        )
        
        if success and 'id' in response:
            self.portfolio_item_id = response['id']
            self.log(f"   ✅ Created portfolio item with ID: {self.portfolio_item_id}")
            self.log(f"   ✅ File uploaded: {response.get('original_filename')}")
            self.log(f"   ✅ File size: {response.get('file_size')} bytes")
        
        return success, response

    def test_admin_authentication_api(self):
        """Test POST /api/admin/login (admin authentication)"""
        self.log("=" * 60)
        self.log("TESTING ADMIN APIs")
        self.log("=" * 60)
        
        # First try to create admin user (might already exist)
        admin_data = {
            "email": "admin@earnwings.com",
            "name": "Admin User",
            "role": "admin",
            "level": "navigator",
            "is_admin": True,
            "password": "admin123"
        }
        
        # Try to create admin (ignore if already exists)
        self.run_test("Create Admin User", "POST", "admin/create", 200, data=admin_data)
        
        # Now test login
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "POST /api/admin/login (Admin Authentication)", 
            "POST", 
            "admin/login", 
            200, 
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response.get('user')
            self.log(f"   ✅ Admin login successful, JWT token obtained")
            self.log(f"   ✅ Admin user: {self.admin_user.get('name', 'Unknown') if self.admin_user else 'No user data'}")
            self.log(f"   ✅ Token type: {response.get('token_type', 'bearer')}")
        
        return success, response

    def test_admin_task_management_api(self):
        """Test GET /api/admin/tasks (admin task management)"""
        if not self.admin_token:
            self.log("❌ No admin token available for task management testing", "ERROR")
            return False, {}
        
        success, response = self.run_test(
            "GET /api/admin/tasks (Admin Task Management)", 
            "GET", 
            "admin/tasks", 
            200, 
            auth_required=True
        )
        
        if success and isinstance(response, list):
            active_tasks = [task for task in response if task.get('active', True)]
            inactive_tasks = [task for task in response if not task.get('active', True)]
            
            self.log(f"   ✅ Found {len(response)} total tasks")
            self.log(f"   ✅ Active tasks: {len(active_tasks)}")
            self.log(f"   ✅ Inactive tasks: {len(inactive_tasks)}")
            
            # Show sample tasks
            for i, task in enumerate(response[:3]):
                active_status = "Active" if task.get('active', True) else "Inactive"
                competency = task.get('competency_area', 'Unknown')
                self.log(f"   ✅ Task {i+1}: {task.get('title', 'No title')} ({competency}, {active_status})")
        
        return success, response

    def test_admin_user_management_api(self):
        """Test GET /api/admin/users (admin user management)"""
        if not self.admin_token:
            self.log("❌ No admin token available for user management testing", "ERROR")
            return False, {}
        
        success, response = self.run_test(
            "GET /api/admin/users (Admin User Management)", 
            "GET", 
            "admin/users", 
            200, 
            auth_required=True
        )
        
        if success and isinstance(response, list):
            self.log(f"   ✅ Found {len(response)} users")
            
            # Show sample users with progress
            for i, user in enumerate(response[:3]):
                completed_tasks = user.get('completed_tasks', 0)
                overall_progress = user.get('overall_progress', 0)
                role = user.get('role', 'Unknown')
                self.log(f"   ✅ User {i+1}: {user.get('name', 'No name')} ({role}) - {completed_tasks} tasks, {overall_progress}% progress")
        
        return success, response

    def test_admin_analytics_api(self):
        """Test GET /api/admin/stats (admin analytics)"""
        if not self.admin_token:
            self.log("❌ No admin token available for analytics testing", "ERROR")
            return False, {}
        
        success, response = self.run_test(
            "GET /api/admin/stats (Admin Analytics)", 
            "GET", 
            "admin/stats", 
            200, 
            auth_required=True
        )
        
        if success and isinstance(response, dict):
            self.log(f"   ✅ Total Users: {response.get('total_users', 'N/A')}")
            self.log(f"   ✅ Total Tasks: {response.get('total_tasks', 'N/A')}")
            self.log(f"   ✅ Total Completions: {response.get('total_completions', 'N/A')}")
            self.log(f"   ✅ Completion Rate: {response.get('completion_rate', 'N/A')}%")
            self.log(f"   ✅ Active Competency Areas: {response.get('active_competency_areas', 'N/A')}")
        
        return success, response

    def test_database_connectivity(self):
        """Test MongoDB connectivity and data persistence"""
        self.log("=" * 60)
        self.log("TESTING DATABASE OPERATIONS")
        self.log("=" * 60)
        
        # Test basic connectivity by getting competency framework
        success, response = self.run_test(
            "Database Connectivity (GET /api/competencies)", 
            "GET", 
            "competencies", 
            200
        )
        
        if success and isinstance(response, dict):
            self.log(f"   ✅ Database connection successful")
            self.log(f"   ✅ Found {len(response)} competency areas in database")
            
            # Verify all expected competency areas exist
            expected_areas = [
                'leadership_supervision',
                'financial_management', 
                'operational_management',
                'cross_functional_collaboration',
                'strategic_thinking'
            ]
            
            for area in expected_areas:
                if area in response:
                    area_data = response[area]
                    sub_count = len(area_data.get('sub_competencies', {}))
                    self.log(f"   ✅ {area_data.get('name', area)}: {sub_count} sub-competencies")
                else:
                    self.log(f"   ❌ Missing competency area: {area}", "ERROR")
                    success = False
        
        return success, response

    def test_data_persistence(self):
        """Test data persistence by creating and retrieving data"""
        if not self.user_id:
            self.log("❌ No user ID available for persistence testing", "ERROR")
            return False, {}
        
        # Test user data persistence
        success, user_data = self.run_test(
            "Data Persistence (GET user after creation)", 
            "GET", 
            f"users/{self.user_id}", 
            200
        )
        
        if success:
            self.log(f"   ✅ User data persisted correctly")
            self.log(f"   ✅ User ID: {user_data.get('id')}")
            self.log(f"   ✅ Created at: {user_data.get('created_at')}")
            
            # Test competency progress initialization
            success2, competency_data = self.run_test(
                "Competency Progress Initialization", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
            
            if success2:
                self.log(f"   ✅ Competency progress initialized for new user")
                total_sub_competencies = sum(len(area.get('sub_competencies', {})) for area in competency_data.values())
                self.log(f"   ✅ Total sub-competencies tracked: {total_sub_competencies}")
        
        return success, user_data

    def test_response_times(self):
        """Test that response times are reasonable"""
        self.log("=" * 60)
        self.log("TESTING RESPONSE TIMES")
        self.log("=" * 60)
        
        endpoints_to_test = [
            ("GET /api/competencies", "GET", "competencies"),
            ("GET /api/users", "GET", "users"),
            ("GET /api/tasks", "GET", "tasks"),
        ]
        
        if self.admin_token:
            endpoints_to_test.extend([
                ("GET /api/admin/stats", "GET", "admin/stats", True),
                ("GET /api/admin/users", "GET", "admin/users", True),
                ("GET /api/admin/tasks", "GET", "admin/tasks", True),
            ])
        
        response_times = []
        
        for endpoint_info in endpoints_to_test:
            name, method, endpoint = endpoint_info[:3]
            auth_required = endpoint_info[3] if len(endpoint_info) > 3 else False
            
            start_time = time.time()
            success, _ = self.run_test(f"Response Time Test: {name}", method, endpoint, 200, auth_required=auth_required)
            response_time = time.time() - start_time
            
            if success:
                response_times.append(response_time)
                status = "✅ GOOD" if response_time < 2.0 else "⚠️ SLOW" if response_time < 5.0 else "❌ TOO SLOW"
                self.log(f"   {status} {name}: {response_time:.2f}s")
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            self.log(f"   📊 Average response time: {avg_response_time:.2f}s")
            self.log(f"   📊 Maximum response time: {max_response_time:.2f}s")
            
            if avg_response_time < 2.0:
                self.log("   ✅ Response times are reasonable")
                return True, {"avg": avg_response_time, "max": max_response_time}
            else:
                self.log("   ⚠️ Response times may be slow", "WARNING")
                return True, {"avg": avg_response_time, "max": max_response_time}
        
        return False, {}

    def test_data_structures(self):
        """Test that all endpoints return expected data structures"""
        self.log("=" * 60)
        self.log("TESTING DATA STRUCTURES")
        self.log("=" * 60)
        
        # Test competency framework structure
        success, competencies = self.run_test(
            "Competency Framework Structure", 
            "GET", 
            "competencies", 
            200
        )
        
        if success:
            structure_valid = True
            for area_key, area_data in competencies.items():
                if not isinstance(area_data, dict):
                    self.log(f"   ❌ Invalid area data structure for {area_key}", "ERROR")
                    structure_valid = False
                    continue
                
                required_fields = ['name', 'description', 'sub_competencies']
                for field in required_fields:
                    if field not in area_data:
                        self.log(f"   ❌ Missing field '{field}' in {area_key}", "ERROR")
                        structure_valid = False
                
                if 'sub_competencies' in area_data and isinstance(area_data['sub_competencies'], dict):
                    sub_count = len(area_data['sub_competencies'])
                    self.log(f"   ✅ {area_key}: Valid structure with {sub_count} sub-competencies")
            
            if structure_valid:
                self.log("   ✅ All competency areas have valid data structures")
            
        # Test user competency progress structure
        if self.user_id:
            success2, user_competencies = self.run_test(
                "User Competency Progress Structure", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
            
            if success2:
                progress_structure_valid = True
                for area_key, area_data in user_competencies.items():
                    required_fields = ['name', 'description', 'sub_competencies', 'overall_progress']
                    for field in required_fields:
                        if field not in area_data:
                            self.log(f"   ❌ Missing field '{field}' in user progress for {area_key}", "ERROR")
                            progress_structure_valid = False
                    
                    # Check sub-competency progress structure
                    if 'sub_competencies' in area_data:
                        for sub_key, sub_data in area_data['sub_competencies'].items():
                            sub_required_fields = ['name', 'completion_percentage', 'completed_tasks', 'total_tasks']
                            for sub_field in sub_required_fields:
                                if sub_field not in sub_data:
                                    self.log(f"   ❌ Missing field '{sub_field}' in {area_key}.{sub_key}", "ERROR")
                                    progress_structure_valid = False
                
                if progress_structure_valid:
                    self.log("   ✅ User competency progress has valid data structures")
        
        return success, competencies

    def run_comprehensive_test(self):
        """Run all comprehensive backend API tests"""
        self.log("🚀 Starting Comprehensive Backend API Testing")
        self.log("🎯 FOCUS: Testing backend APIs after duplicate flightbook entries bug fix")
        self.log("=" * 80)
        
        start_time = time.time()
        
        # Test User Management APIs
        self.test_user_creation_api()
        self.test_user_competency_data_api()
        self.test_portfolio_data_api()
        self.test_portfolio_upload_api()
        
        # Test Admin APIs
        self.test_admin_authentication_api()
        self.test_admin_task_management_api()
        self.test_admin_user_management_api()
        self.test_admin_analytics_api()
        
        # Test Database Operations
        self.test_database_connectivity()
        self.test_data_persistence()
        
        # Test Performance and Data Structures
        self.test_response_times()
        self.test_data_structures()
        
        total_time = time.time() - start_time
        
        # Final Results
        self.log("=" * 80)
        self.log("📊 COMPREHENSIVE BACKEND API TEST RESULTS")
        self.log("=" * 80)
        self.log(f"   Tests Run: {self.tests_run}")
        self.log(f"   Tests Passed: {self.tests_passed}")
        self.log(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        self.log(f"   Total Test Time: {total_time:.2f}s")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED! Backend APIs are working correctly after the bug fix.")
        elif self.tests_passed / self.tests_run >= 0.9:
            self.log("✅ MOSTLY SUCCESSFUL! Minor issues detected but core functionality working.")
        else:
            self.log("⚠️ SIGNIFICANT ISSUES DETECTED! Backend APIs may have problems.", "WARNING")
        
        self.log("=" * 80)
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run)*100,
            "total_time": total_time,
            "user_id": self.user_id,
            "admin_token_obtained": bool(self.admin_token),
            "portfolio_item_created": bool(self.portfolio_item_id)
        }

if __name__ == "__main__":
    tester = ComprehensiveBackendAPITester()
    results = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if results["success_rate"] >= 90:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure