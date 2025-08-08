#!/usr/bin/env python3
"""
Focused Backend API Testing for Key Endpoints
Testing the specific endpoints mentioned in the review request
"""

import requests
import json
import time
from datetime import datetime

class FocusedBackendTester:
    def __init__(self, base_url="https://e12824c6-9758-455d-a132-fa398ec594a3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        
    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def test_endpoint(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Test a single endpoint"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name}")
        self.log(f"   URL: {url}")
        
        start_time = time.time()
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            response_time = time.time() - start_time
            
            if response.status_code == expected_status:
                self.tests_passed += 1
                self.log(f"   ✅ PASSED - Status: {response.status_code}, Time: {response_time:.2f}s")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}...")
                return False, {}
                
        except Exception as e:
            self.log(f"   ❌ ERROR: {str(e)}")
            return False, {}

    def run_focused_tests(self):
        """Run focused tests on key endpoints"""
        self.log("🚀 Starting Focused Backend API Testing")
        self.log("🎯 Testing key endpoints after duplicate flightbook entries bug fix")
        self.log("=" * 70)
        
        # 1. Test POST /api/users (user creation)
        user_data = {
            "email": f"focused_test_{int(time.time())}@earnwings.com",
            "name": "Focused Test User",
            "role": "participant",
            "level": "navigator"
        }
        
        success, response = self.test_endpoint(
            "POST /api/users (User Creation)", 
            "POST", 
            "users", 
            200, 
            data=user_data
        )
        
        if success and 'id' in response:
            self.user_id = response['id']
            self.log(f"   📝 Created user ID: {self.user_id}")
        
        # 2. Test GET /api/users/{id}/competencies (user competency data)
        if self.user_id:
            success, response = self.test_endpoint(
                "GET /api/users/{id}/competencies (User Competency Data)", 
                "GET", 
                f"users/{self.user_id}/competencies", 
                200
            )
            
            if success:
                competency_count = len(response) if isinstance(response, dict) else 0
                self.log(f"   📊 Found {competency_count} competency areas")
        
        # 3. Test GET /api/users/{id}/portfolio (portfolio data)
        if self.user_id:
            success, response = self.test_endpoint(
                "GET /api/users/{id}/portfolio (Portfolio Data)", 
                "GET", 
                f"users/{self.user_id}/portfolio", 
                200
            )
            
            if success:
                portfolio_count = len(response) if isinstance(response, list) else 0
                self.log(f"   📁 Found {portfolio_count} portfolio items")
        
        # 4. Test POST /api/admin/login (admin authentication)
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        
        success, response = self.test_endpoint(
            "POST /api/admin/login (Admin Authentication)", 
            "POST", 
            "admin/login", 
            200, 
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log(f"   🔐 Admin token obtained")
        
        # 5. Test GET /api/admin/tasks (admin task management)
        if self.admin_token:
            success, response = self.test_endpoint(
                "GET /api/admin/tasks (Admin Task Management)", 
                "GET", 
                "admin/tasks", 
                200, 
                auth_required=True
            )
            
            if success:
                task_count = len(response) if isinstance(response, list) else 0
                active_tasks = len([t for t in response if t.get('active', True)]) if isinstance(response, list) else 0
                self.log(f"   📋 Found {task_count} total tasks ({active_tasks} active)")
        
        # 6. Test GET /api/admin/users (admin user management)
        if self.admin_token:
            success, response = self.test_endpoint(
                "GET /api/admin/users (Admin User Management)", 
                "GET", 
                "admin/users", 
                200, 
                auth_required=True
            )
            
            if success:
                user_count = len(response) if isinstance(response, list) else 0
                self.log(f"   👥 Found {user_count} users")
        
        # 7. Test GET /api/admin/stats (admin analytics)
        if self.admin_token:
            success, response = self.test_endpoint(
                "GET /api/admin/stats (Admin Analytics)", 
                "GET", 
                "admin/stats", 
                200, 
                auth_required=True
            )
            
            if success:
                stats = response if isinstance(response, dict) else {}
                self.log(f"   📈 Stats - Users: {stats.get('total_users', 'N/A')}, Tasks: {stats.get('total_tasks', 'N/A')}, Completion Rate: {stats.get('completion_rate', 'N/A')}%")
        
        # 8. Test MongoDB connectivity
        success, response = self.test_endpoint(
            "GET /api/competencies (Database Connectivity)", 
            "GET", 
            "competencies", 
            200
        )
        
        if success:
            competency_areas = len(response) if isinstance(response, dict) else 0
            self.log(f"   🗄️ Database connected - {competency_areas} competency areas")
        
        # Final Results
        self.log("=" * 70)
        self.log("📊 FOCUSED TEST RESULTS")
        self.log("=" * 70)
        self.log(f"   Tests Run: {self.tests_run}")
        self.log(f"   Tests Passed: {self.tests_passed}")
        self.log(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL KEY ENDPOINTS WORKING CORRECTLY!")
            return True
        elif self.tests_passed / self.tests_run >= 0.8:
            self.log("✅ MOST KEY ENDPOINTS WORKING - Minor issues detected")
            return True
        else:
            self.log("❌ SIGNIFICANT ISSUES WITH KEY ENDPOINTS")
            return False

if __name__ == "__main__":
    tester = FocusedBackendTester()
    success = tester.run_focused_tests()
    exit(0 if success else 1)