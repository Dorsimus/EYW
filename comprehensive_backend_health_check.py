#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND HEALTH CHECK
Focus: Verify all backend systems are working properly before investigating frontend sync issues
Review Request: Backend API Health, User Management, Admin APIs, File Storage APIs
"""

import requests
import sys
import json
import time
import io
from datetime import datetime

class ComprehensiveBackendHealthCheck:
    def __init__(self, base_url="https://e12824c6-9758-455d-a132-fa398ec594a3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.admin_user = None
        self.created_portfolio_id = None
        self.created_task_id = None
        
        print(f"🏥 COMPREHENSIVE BACKEND HEALTH CHECK")
        print(f"🎯 Focus: Verify all backend systems before investigating frontend sync issues")
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"📡 API Endpoint: {self.api_url}")
        print("=" * 80)

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False, timeout=30):
        """Run a single API test with comprehensive error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 {name}")
        print(f"   URL: {url}")
        if auth_required:
            print(f"   Auth: {'✅ Token provided' if self.admin_token else '❌ No token'}")
        
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
            print(f"   Response Time: {response_time:.2f}s")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return False, {}

        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            print(f"❌ TIMEOUT after {response_time:.2f}s (limit: {timeout}s)")
            print(f"   ⚠️  This could explain frontend hanging issues!")
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ ERROR after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def test_1_backend_api_health(self):
        """1. BACKEND API HEALTH - Test major endpoints are responding"""
        print("\n" + "="*60)
        print("🏥 1. BACKEND API HEALTH VERIFICATION")
        print("="*60)
        
        health_results = []
        
        # Root API endpoint
        success, response = self.run_test("Root API Endpoint", "GET", "", 200)
        health_results.append(("Root API", success))
        
        # Competency Framework endpoint
        success, response = self.run_test("Competency Framework", "GET", "competencies", 200)
        health_results.append(("Competency Framework", success))
        if success:
            print(f"   📊 Found {len(response)} competency areas")
        
        # All Tasks endpoint
        success, response = self.run_test("All Tasks", "GET", "tasks", 200)
        health_results.append(("All Tasks", success))
        if success and isinstance(response, list):
            print(f"   📋 Found {len(response)} active tasks")
        
        # Summary
        passed = sum(1 for _, success in health_results if success)
        total = len(health_results)
        print(f"\n🏥 BACKEND API HEALTH SUMMARY: {passed}/{total} endpoints healthy")
        
        return passed == total

    def test_2_user_management_apis(self):
        """2. USER MANAGEMENT APIs - Test user creation, data loading, competency tracking"""
        print("\n" + "="*60)
        print("👥 2. USER MANAGEMENT APIs VERIFICATION")
        print("="*60)
        
        user_mgmt_results = []
        
        # Get all users first
        success, response = self.run_test("Get All Users", "GET", "users", 200)
        user_mgmt_results.append(("Get All Users", success))
        if success and isinstance(response, list):
            print(f"   👥 Found {len(response)} total users")
        
        # Create user with exact frontend format
        user_data = {
            "email": f"health_check_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Health Check Navigator",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create User", "POST", "users", 200, data=user_data)
        user_mgmt_results.append(("Create User", success))
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   🆔 Created user ID: {self.user_id}")
        
        # Get user by ID
        if self.user_id:
            success, response = self.run_test("Get User by ID", "GET", f"users/{self.user_id}", 200)
            user_mgmt_results.append(("Get User by ID", success))
        
        # Get user competencies (data loading)
        if self.user_id:
            success, response = self.run_test("Get User Competencies", "GET", f"users/{self.user_id}/competencies", 200)
            user_mgmt_results.append(("User Competencies", success))
            if success and isinstance(response, dict):
                print(f"   📊 Found {len(response)} competency areas with progress tracking")
                for area_key, area_data in response.items():
                    overall_progress = area_data.get('overall_progress', 0)
                    sub_count = len(area_data.get('sub_competencies', {}))
                    print(f"     - {area_data.get('name', area_key)}: {overall_progress}% ({sub_count} sub-competencies)")
        
        # Summary
        passed = sum(1 for _, success in user_mgmt_results if success)
        total = len(user_mgmt_results)
        print(f"\n👥 USER MANAGEMENT SUMMARY: {passed}/{total} APIs working")
        
        return passed == total

    def test_3_admin_apis(self):
        """3. ADMIN APIs - Test admin authentication and task management"""
        print("\n" + "="*60)
        print("🔐 3. ADMIN APIs VERIFICATION")
        print("="*60)
        
        admin_results = []
        
        # Admin login
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        admin_results.append(("Admin Login", success))
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response.get('user')
            print(f"   🔑 Admin token obtained")
            print(f"   👤 Admin user: {self.admin_user.get('name', 'Unknown') if self.admin_user else 'No user data'}")
        
        # Admin stats
        success, response = self.run_test("Admin Stats", "GET", "admin/stats", 200, auth_required=True)
        admin_results.append(("Admin Stats", success))
        if success and isinstance(response, dict):
            print(f"   📈 Total Users: {response.get('total_users', 'N/A')}")
            print(f"   📋 Total Tasks: {response.get('total_tasks', 'N/A')}")
            print(f"   ✅ Total Completions: {response.get('total_completions', 'N/A')}")
            print(f"   📊 Completion Rate: {response.get('completion_rate', 'N/A')}%")
        
        # Admin get all tasks
        success, response = self.run_test("Admin Get All Tasks", "GET", "admin/tasks", 200, auth_required=True)
        admin_results.append(("Admin Get All Tasks", success))
        if success and isinstance(response, list):
            print(f"   📋 Found {len(response)} tasks (including inactive)")
        
        # Admin get all users
        success, response = self.run_test("Admin Get All Users", "GET", "admin/users", 200, auth_required=True)
        admin_results.append(("Admin Get All Users", success))
        if success and isinstance(response, list):
            print(f"   👥 Found {len(response)} users with progress stats")
        
        # Admin create task
        task_data = {
            "title": "Health Check Test Task",
            "description": "Test task created during backend health check",
            "task_type": "assessment",
            "competency_area": "leadership_supervision",
            "sub_competency": "inspiring_team_motivation",
            "order": 999,
            "required": False,
            "estimated_hours": 1.0,
            "instructions": "Complete this test task for health check validation"
        }
        success, response = self.run_test("Admin Create Task", "POST", "admin/tasks", 200, data=task_data, auth_required=True)
        admin_results.append(("Admin Create Task", success))
        if success and 'id' in response:
            self.created_task_id = response['id']
            print(f"   🆔 Created task ID: {self.created_task_id}")
        
        # Admin update task
        if self.created_task_id:
            update_data = {
                "title": "Updated Health Check Task",
                "estimated_hours": 2.0
            }
            success, response = self.run_test("Admin Update Task", "PUT", f"admin/tasks/{self.created_task_id}", 200, data=update_data, auth_required=True)
            admin_results.append(("Admin Update Task", success))
        
        # Admin delete task (cleanup)
        if self.created_task_id:
            success, response = self.run_test("Admin Delete Task", "DELETE", f"admin/tasks/{self.created_task_id}", 200, auth_required=True)
            admin_results.append(("Admin Delete Task", success))
        
        # Summary
        passed = sum(1 for _, success in admin_results if success)
        total = len(admin_results)
        print(f"\n🔐 ADMIN APIs SUMMARY: {passed}/{total} APIs working")
        
        return passed == total

    def test_4_file_storage_apis(self):
        """4. FILE STORAGE APIs - Test portfolio upload and file serving"""
        print("\n" + "="*60)
        print("📁 4. FILE STORAGE APIs VERIFICATION")
        print("="*60)
        
        if not self.user_id:
            print("❌ No user ID available - skipping file storage tests")
            return False
        
        file_storage_results = []
        
        # Create test file content
        test_file_content = b"This is a test file for backend health check validation."
        test_file = io.BytesIO(test_file_content)
        test_file.name = "health_check_test.txt"
        
        # Portfolio file upload
        portfolio_data = {
            'title': 'Health Check Portfolio Item',
            'description': 'Test portfolio item created during backend health check',
            'competency_areas': '["leadership_supervision"]',
            'tags': '["health_check", "test"]',
            'visibility': 'private'
        }
        
        files = {'file': ('health_check_test.txt', test_file_content, 'text/plain')}
        success, response = self.run_test("Portfolio File Upload", "POST", f"users/{self.user_id}/portfolio", 200, data=portfolio_data, files=files)
        file_storage_results.append(("Portfolio Upload", success))
        if success and 'id' in response:
            self.created_portfolio_id = response['id']
            print(f"   🆔 Created portfolio item ID: {self.created_portfolio_id}")
            print(f"   📄 File size: {response.get('file_size', 'Unknown')} bytes")
            print(f"   🔒 Visibility: {response.get('visibility', 'Unknown')}")
        
        # Get user portfolio
        success, response = self.run_test("Get User Portfolio", "GET", f"users/{self.user_id}/portfolio", 200)
        file_storage_results.append(("Get Portfolio", success))
        if success and isinstance(response, list):
            print(f"   📁 Found {len(response)} portfolio items")
            for item in response:
                print(f"     - {item.get('title', 'No title')}: {item.get('file_size_formatted', 'No size')}")
        
        # File serving test
        if self.created_portfolio_id:
            success, response = self.run_test("File Serving", "GET", f"files/portfolio/{self.created_portfolio_id}", 200)
            file_storage_results.append(("File Serving", success))
            if success:
                print(f"   📥 File served successfully")
        
        # Storage statistics (admin required)
        if self.admin_token:
            success, response = self.run_test("Storage Statistics", "GET", "admin/storage/stats", 200, auth_required=True)
            file_storage_results.append(("Storage Stats", success))
            if success and isinstance(response, dict):
                print(f"   💾 Total Storage: {response.get('total_storage_formatted', 'Unknown')}")
                print(f"   📊 Total Files: {response.get('total_files', 'Unknown')}")
                breakdown = response.get('breakdown', {})
                if breakdown:
                    portfolio_info = breakdown.get('portfolio', {})
                    print(f"   📁 Portfolio Files: {portfolio_info.get('file_count', 0)} ({portfolio_info.get('size_formatted', '0 B')})")
        
        # Portfolio deletion (cleanup)
        if self.created_portfolio_id:
            success, response = self.run_test("Delete Portfolio Item", "DELETE", f"users/{self.user_id}/portfolio/{self.created_portfolio_id}", 200)
            file_storage_results.append(("Portfolio Delete", success))
        
        # Summary
        passed = sum(1 for _, success in file_storage_results if success)
        total = len(file_storage_results)
        print(f"\n📁 FILE STORAGE SUMMARY: {passed}/{total} APIs working")
        
        return passed == total

    def test_5_critical_backend_integrations(self):
        """5. CRITICAL BACKEND INTEGRATIONS - Test task completion and progress tracking"""
        print("\n" + "="*60)
        print("🔗 5. CRITICAL BACKEND INTEGRATIONS")
        print("="*60)
        
        if not self.user_id:
            print("❌ No user ID available - skipping integration tests")
            return False
        
        integration_results = []
        
        # Get tasks for specific competency
        success, response = self.run_test("Get Tasks for Competency", "GET", "tasks/leadership_supervision/inspiring_team_motivation", 200)
        integration_results.append(("Get Competency Tasks", success))
        available_tasks = response if success and isinstance(response, list) else []
        
        # Get user tasks for competency
        success, response = self.run_test("Get User Tasks for Competency", "GET", f"users/{self.user_id}/tasks/leadership_supervision/inspiring_team_motivation", 200)
        integration_results.append(("Get User Tasks", success))
        if success and isinstance(response, list):
            print(f"   📋 Found {len(response)} tasks for user")
            incomplete_tasks = [task for task in response if not task.get('completed')]
            print(f"   ⏳ Incomplete tasks: {len(incomplete_tasks)}")
        
        # Task completion test (if tasks available)
        if available_tasks and len(available_tasks) > 0:
            test_task = available_tasks[0]
            task_data = {
                'task_id': test_task['id'],
                'evidence_description': 'Health check task completion test',
                'notes': 'Automated backend health check completion'
            }
            
            # Check if already completed
            success, user_tasks = self.run_test("Check Task Status", "GET", f"users/{self.user_id}/tasks/leadership_supervision/inspiring_team_motivation", 200)
            if success:
                user_task = next((t for t in user_tasks if t['id'] == test_task['id']), None)
                if user_task and not user_task.get('completed'):
                    # Complete the task
                    url = f"{self.api_url}/users/{self.user_id}/task-completions"
                    headers = {}
                    
                    self.tests_run += 1
                    print(f"\n🔍 Task Completion Test")
                    print(f"   URL: {url}")
                    
                    try:
                        response = requests.post(url, data=task_data, headers=headers, timeout=30)
                        success = response.status_code == 200
                        if success:
                            self.tests_passed += 1
                            print(f"✅ PASSED - Task completed successfully")
                        else:
                            print(f"❌ FAILED - Status: {response.status_code}")
                    except Exception as e:
                        print(f"❌ ERROR: {str(e)}")
                        success = False
                    
                    integration_results.append(("Task Completion", success))
                else:
                    print(f"   ℹ️  Task already completed or not found")
        
        # Get user task completions
        success, response = self.run_test("Get User Completions", "GET", f"users/{self.user_id}/task-completions", 200)
        integration_results.append(("Get Completions", success))
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} completed tasks")
        
        # Summary
        passed = sum(1 for _, success in integration_results if success)
        total = len(integration_results)
        print(f"\n🔗 INTEGRATIONS SUMMARY: {passed}/{total} integrations working")
        
        return passed == total

    def run_comprehensive_health_check(self):
        """Run all health check tests and provide comprehensive report"""
        print(f"\n🚀 STARTING COMPREHENSIVE BACKEND HEALTH CHECK")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        start_time = time.time()
        
        # Run all test categories
        test_results = []
        
        try:
            # 1. Backend API Health
            result = self.test_1_backend_api_health()
            test_results.append(("Backend API Health", result))
            
            # 2. User Management APIs
            result = self.test_2_user_management_apis()
            test_results.append(("User Management APIs", result))
            
            # 3. Admin APIs
            result = self.test_3_admin_apis()
            test_results.append(("Admin APIs", result))
            
            # 4. File Storage APIs
            result = self.test_4_file_storage_apis()
            test_results.append(("File Storage APIs", result))
            
            # 5. Critical Backend Integrations
            result = self.test_5_critical_backend_integrations()
            test_results.append(("Critical Integrations", result))
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR during health check: {str(e)}")
            test_results.append(("Health Check Execution", False))
        
        # Generate comprehensive report
        total_time = time.time() - start_time
        self.generate_health_report(test_results, total_time)
        
        return test_results

    def generate_health_report(self, test_results, total_time):
        """Generate comprehensive health check report"""
        print("\n" + "="*80)
        print("🏥 COMPREHENSIVE BACKEND HEALTH CHECK REPORT")
        print("="*80)
        
        # Overall statistics
        passed_categories = sum(1 for _, result in test_results if result)
        total_categories = len(test_results)
        overall_success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"⏱️  Total Execution Time: {total_time:.2f} seconds")
        print(f"🧪 Total Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📊 Success Rate: {overall_success_rate:.1f}%")
        print(f"🏆 Categories Passed: {passed_categories}/{total_categories}")
        
        print(f"\n📋 DETAILED CATEGORY RESULTS:")
        for category, result in test_results:
            status = "✅ HEALTHY" if result else "❌ ISSUES"
            print(f"   {status} - {category}")
        
        # Health assessment
        print(f"\n🎯 OVERALL BACKEND HEALTH ASSESSMENT:")
        if passed_categories == total_categories and overall_success_rate >= 90:
            print("🟢 EXCELLENT - All backend systems are healthy and ready for production")
            health_status = "EXCELLENT"
        elif passed_categories >= total_categories * 0.8 and overall_success_rate >= 75:
            print("🟡 GOOD - Most backend systems are healthy with minor issues")
            health_status = "GOOD"
        elif passed_categories >= total_categories * 0.6 and overall_success_rate >= 60:
            print("🟠 FAIR - Backend has some issues that should be addressed")
            health_status = "FAIR"
        else:
            print("🔴 POOR - Backend has significant issues requiring immediate attention")
            health_status = "POOR"
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if health_status == "EXCELLENT":
            print("   ✅ Backend is ready for frontend sync issue investigation")
            print("   ✅ All major systems are operational")
            print("   ✅ No blocking issues found")
        elif health_status == "GOOD":
            print("   ⚠️  Minor backend issues found but not blocking")
            print("   ✅ Safe to proceed with frontend sync investigation")
            print("   📝 Address minor issues when convenient")
        else:
            print("   🚨 Backend issues may be contributing to frontend problems")
            print("   🔧 Fix backend issues before investigating frontend sync")
            print("   📞 Consider escalating to backend development team")
        
        print("="*80)
        
        return health_status

def main():
    """Main execution function"""
    print("🏥 COMPREHENSIVE BACKEND HEALTH CHECK")
    print("🎯 Focus: Verify all backend systems before investigating frontend sync issues")
    print("📋 Review Request Areas: Backend API Health, User Management, Admin APIs, File Storage")
    print()
    
    try:
        # Initialize health checker
        health_checker = ComprehensiveBackendHealthCheck()
        
        # Run comprehensive health check
        results = health_checker.run_comprehensive_health_check()
        
        # Exit with appropriate code
        all_passed = all(result for _, result in results)
        sys.exit(0 if all_passed else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Health check interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()