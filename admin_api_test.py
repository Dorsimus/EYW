#!/usr/bin/env python3
"""
Focused Admin API Testing Script
Tests the core admin functionality for the Earn Your Wings Platform
"""

import requests
import json
from datetime import datetime

class AdminAPITester:
    def __init__(self, base_url="https://190b5148-8276-48d3-8f7c-e31d248916c6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.admin_user = None
        self.test_results = {}

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.test_results[test_name] = {
            "success": success,
            "details": details
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")

    def test_admin_login(self):
        """Test admin login with demo credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.api_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.admin_token = data['access_token']
                    self.admin_user = data.get('user', {})
                    self.log_test("Admin Login", True, f"Token obtained for {self.admin_user.get('name', 'Admin')}")
                    return True
                else:
                    self.log_test("Admin Login", False, "No access token in response")
                    return False
            else:
                self.log_test("Admin Login", False, f"Status {response.status_code}: {response.text[:100]}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_admin_task_management(self):
        """Test admin task management APIs"""
        print("\n📋 Testing Admin Task Management...")
        
        if not self.admin_token:
            self.log_test("Admin Task Management", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test 1: Get all tasks
        try:
            response = requests.get(f"{self.api_url}/admin/tasks", headers=headers)
            if response.status_code == 200:
                tasks = response.json()
                self.log_test("Get All Tasks", True, f"Retrieved {len(tasks)} tasks")
            else:
                self.log_test("Get All Tasks", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get All Tasks", False, f"Exception: {str(e)}")
            return False
        
        # Test 2: Create new task
        new_task = {
            "title": "Admin API Test Task",
            "description": "Task created via admin API testing",
            "task_type": "assessment",
            "competency_area": "leadership_supervision",
            "sub_competency": "team_motivation",
            "order": 100,
            "required": False,
            "estimated_hours": 1.0,
            "instructions": "This is a test task for API validation"
        }
        
        try:
            response = requests.post(f"{self.api_url}/admin/tasks", json=new_task, headers=headers)
            if response.status_code == 200:
                created_task = response.json()
                task_id = created_task.get('id')
                self.log_test("Create Task", True, f"Created task with ID: {task_id}")
                
                # Test 3: Update the task
                update_data = {
                    "title": "Updated Admin API Test Task",
                    "estimated_hours": 2.0
                }
                
                response = requests.put(f"{self.api_url}/admin/tasks/{task_id}", json=update_data, headers=headers)
                if response.status_code == 200:
                    self.log_test("Update Task", True, "Task updated successfully")
                    
                    # Test 4: Delete (deactivate) the task
                    response = requests.delete(f"{self.api_url}/admin/tasks/{task_id}", headers=headers)
                    if response.status_code == 200:
                        self.log_test("Delete Task", True, "Task deactivated successfully")
                        return True
                    else:
                        self.log_test("Delete Task", False, f"Status {response.status_code}")
                else:
                    self.log_test("Update Task", False, f"Status {response.status_code}")
            else:
                self.log_test("Create Task", False, f"Status {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.log_test("Task CRUD Operations", False, f"Exception: {str(e)}")
            
        return False

    def test_admin_user_management(self):
        """Test admin user management APIs"""
        print("\n👥 Testing Admin User Management...")
        
        if not self.admin_token:
            self.log_test("Admin User Management", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = requests.get(f"{self.api_url}/admin/users", headers=headers)
            if response.status_code == 200:
                users = response.json()
                self.log_test("Get All Users", True, f"Retrieved {len(users)} users")
                
                # Show sample user data
                if users:
                    sample_user = users[0]
                    completed_tasks = sample_user.get('completed_tasks', 0)
                    progress = sample_user.get('overall_progress', 0)
                    print(f"    Sample user: {sample_user.get('name', 'Unknown')} - {completed_tasks} tasks, {progress}% progress")
                
                return True
            else:
                self.log_test("Get All Users", False, f"Status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Get All Users", False, f"Exception: {str(e)}")
            return False

    def test_admin_analytics(self):
        """Test admin analytics APIs"""
        print("\n📊 Testing Admin Analytics...")
        
        if not self.admin_token:
            self.log_test("Admin Analytics", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = requests.get(f"{self.api_url}/admin/stats", headers=headers)
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Get Admin Stats", True, "Analytics data retrieved")
                
                # Display key metrics
                print(f"    Total Users: {stats.get('total_users', 'N/A')}")
                print(f"    Total Tasks: {stats.get('total_tasks', 'N/A')}")
                print(f"    Total Completions: {stats.get('total_completions', 'N/A')}")
                print(f"    Completion Rate: {stats.get('completion_rate', 'N/A')}%")
                print(f"    Active Competency Areas: {stats.get('active_competency_areas', 'N/A')}")
                
                return True
            else:
                self.log_test("Get Admin Stats", False, f"Status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Get Admin Stats", False, f"Exception: {str(e)}")
            return False

    def test_task_competency_linking(self):
        """Test task-competency area linking"""
        print("\n🔗 Testing Task-Competency Linking...")
        
        try:
            # Get competency framework
            response = requests.get(f"{self.api_url}/competencies")
            if response.status_code == 200:
                competencies = response.json()
                self.log_test("Get Competency Framework", True, f"Retrieved {len(competencies)} competency areas")
                
                # Test getting tasks for specific competency
                response = requests.get(f"{self.api_url}/tasks/leadership_supervision/team_motivation")
                if response.status_code == 200:
                    tasks = response.json()
                    self.log_test("Get Tasks by Competency", True, f"Found {len(tasks)} tasks for leadership_supervision/team_motivation")
                    return True
                else:
                    self.log_test("Get Tasks by Competency", False, f"Status {response.status_code}")
            else:
                self.log_test("Get Competency Framework", False, f"Status {response.status_code}")
                
        except Exception as e:
            self.log_test("Task-Competency Linking", False, f"Exception: {str(e)}")
            
        return False

    def run_all_tests(self):
        """Run all admin API tests"""
        print("🚀 Starting Admin Backend API Tests")
        print("=" * 50)
        
        # Test sequence based on priority
        tests = [
            ("Admin Authentication", self.test_admin_login),
            ("Admin Task Management", self.test_admin_task_management),
            ("Admin User Management", self.test_admin_user_management),
            ("Admin Analytics", self.test_admin_analytics),
            ("Task-Competency Linking", self.test_task_competency_linking)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            if test_func():
                passed += 1
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for test_name, result in self.test_results.items():
            status = "✅" if result["success"] else "❌"
            print(f"{status} {test_name}")
            if result["details"]:
                print(f"    {result['details']}")
        
        if passed == total:
            print("\n🎉 ALL ADMIN BACKEND APIS ARE WORKING CORRECTLY!")
            return True
        else:
            print(f"\n⚠️  {total - passed} tests failed. Admin system has issues.")
            return False

def main():
    tester = AdminAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())