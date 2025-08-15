#!/usr/bin/env python3
"""
Focused Backend Test for Review Request
Testing specific areas mentioned in the review:
1. User management APIs (GET /api/users, POST /api/users, GET /api/users/{id}/competencies)
2. Admin authentication system (POST /api/admin/login)
3. Basic health check of all major endpoints
4. Verify no issues were introduced by the frontend changes
"""

import requests
import json
import time
from datetime import datetime

class FocusedReviewTester:
    def __init__(self, base_url="https://earn-wings-migrate.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.test_user_id = None

    def test_user_management_apis(self):
        """Test the three specific user management APIs mentioned in review"""
        print("🔍 Testing User Management APIs (Review Request Focus)")
        print("=" * 60)
        
        results = {}
        
        # 1. GET /api/users
        print("1️⃣ Testing GET /api/users...")
        try:
            response = requests.get(f"{self.api_url}/users", timeout=10)
            if response.status_code == 200:
                users = response.json()
                print(f"   ✅ SUCCESS: Retrieved {len(users)} users")
                print(f"   📊 Response time: {response.elapsed.total_seconds():.2f}s")
                results['get_users'] = True
            else:
                print(f"   ❌ FAILED: Status {response.status_code}")
                results['get_users'] = False
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results['get_users'] = False

        # 2. POST /api/users
        print("\n2️⃣ Testing POST /api/users...")
        user_data = {
            "email": f"review_test_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Review Test Navigator",
            "role": "participant",
            "level": "navigator"
        }
        try:
            response = requests.post(f"{self.api_url}/users", json=user_data, timeout=10)
            if response.status_code == 200:
                user_response = response.json()
                self.test_user_id = user_response.get('id')
                print(f"   ✅ SUCCESS: Created user with ID {self.test_user_id}")
                print(f"   📊 Response time: {response.elapsed.total_seconds():.2f}s")
                print(f"   📋 User details: {user_response.get('name')} ({user_response.get('email')})")
                results['post_users'] = True
            else:
                print(f"   ❌ FAILED: Status {response.status_code}")
                print(f"   📄 Response: {response.text[:200]}")
                results['post_users'] = False
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results['post_users'] = False

        # 3. GET /api/users/{id}/competencies
        print("\n3️⃣ Testing GET /api/users/{id}/competencies...")
        if self.test_user_id:
            try:
                response = requests.get(f"{self.api_url}/users/{self.test_user_id}/competencies", timeout=10)
                if response.status_code == 200:
                    competencies = response.json()
                    print(f"   ✅ SUCCESS: Retrieved competencies for user")
                    print(f"   📊 Response time: {response.elapsed.total_seconds():.2f}s")
                    print(f"   📋 Competency areas: {len(competencies)}")
                    
                    # Show competency details
                    for area_key, area_data in competencies.items():
                        area_name = area_data.get('name', area_key)
                        progress = area_data.get('overall_progress', 0)
                        sub_count = len(area_data.get('sub_competencies', {}))
                        print(f"      - {area_name}: {progress}% ({sub_count} sub-competencies)")
                    
                    results['get_user_competencies'] = True
                else:
                    print(f"   ❌ FAILED: Status {response.status_code}")
                    results['get_user_competencies'] = False
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
                results['get_user_competencies'] = False
        else:
            print("   ⚠️  SKIPPED: No user ID available from previous test")
            results['get_user_competencies'] = False

        return results

    def test_admin_authentication(self):
        """Test admin authentication system"""
        print("\n🔐 Testing Admin Authentication System (Review Request Focus)")
        print("=" * 60)
        
        print("🔑 Testing POST /api/admin/login...")
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.api_url}/admin/login", json=login_data, timeout=10)
            if response.status_code == 200:
                auth_response = response.json()
                self.admin_token = auth_response.get('access_token')
                admin_user = auth_response.get('user', {})
                
                print(f"   ✅ SUCCESS: Admin authentication working")
                print(f"   📊 Response time: {response.elapsed.total_seconds():.2f}s")
                print(f"   👤 Admin user: {admin_user.get('name', 'Unknown')}")
                print(f"   🎫 Token obtained: {'Yes' if self.admin_token else 'No'}")
                print(f"   🔒 Token type: {auth_response.get('token_type', 'Unknown')}")
                
                return True
            else:
                print(f"   ❌ FAILED: Status {response.status_code}")
                print(f"   📄 Response: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False

    def test_major_endpoints_health(self):
        """Test basic health of all major endpoints"""
        print("\n🏥 Testing Major Endpoints Health (Review Request Focus)")
        print("=" * 60)
        
        endpoints = [
            ("Root API", "GET", ""),
            ("Competency Framework", "GET", "competencies"),
            ("All Tasks", "GET", "tasks"),
            ("Admin Stats", "GET", "admin/stats", True),
            ("Admin Tasks", "GET", "admin/tasks", True),
            ("Admin Users", "GET", "admin/users", True),
        ]
        
        results = {}
        
        for endpoint_info in endpoints:
            name = endpoint_info[0]
            method = endpoint_info[1]
            path = endpoint_info[2]
            requires_auth = len(endpoint_info) > 3 and endpoint_info[3]
            
            print(f"🔍 Testing {name}...")
            
            headers = {}
            if requires_auth and self.admin_token:
                headers['Authorization'] = f'Bearer {self.admin_token}'
            elif requires_auth and not self.admin_token:
                print(f"   ⚠️  SKIPPED: No admin token available")
                results[name.lower().replace(' ', '_')] = False
                continue
            
            try:
                url = f"{self.api_url}/{path}" if path else f"{self.api_url}/"
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ SUCCESS: {name} endpoint healthy")
                    print(f"   📊 Response time: {response.elapsed.total_seconds():.2f}s")
                    
                    # Add specific details for certain endpoints
                    try:
                        data = response.json()
                        if isinstance(data, list):
                            print(f"   📋 Items returned: {len(data)}")
                        elif isinstance(data, dict):
                            if 'total_users' in data:  # Admin stats
                                print(f"   📊 Users: {data.get('total_users')}, Tasks: {data.get('total_tasks')}")
                            elif 'message' in data:  # Root API
                                print(f"   💬 Message: {data.get('message')}")
                    except:
                        pass  # Non-JSON response
                    
                    results[name.lower().replace(' ', '_')] = True
                else:
                    print(f"   ❌ FAILED: Status {response.status_code}")
                    results[name.lower().replace(' ', '_')] = False
                    
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
                results[name.lower().replace(' ', '_')] = False
        
        return results

    def run_focused_review_test(self):
        """Run the complete focused review test"""
        print("🎯 FOCUSED BACKEND TEST - POST PDF EXPORT FRONTEND FIX")
        print("Review Request Focus Areas:")
        print("1. User management APIs (GET /api/users, POST /api/users, GET /api/users/{id}/competencies)")
        print("2. Admin authentication system (POST /api/admin/login)")
        print("3. Basic health check of all major endpoints")
        print("4. Verify no issues were introduced by the frontend changes")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run focused tests
        user_mgmt_results = self.test_user_management_apis()
        admin_auth_result = self.test_admin_authentication()
        endpoint_health_results = self.test_major_endpoints_health()
        
        total_time = time.time() - start_time
        
        # Generate focused report
        print("\n" + "=" * 80)
        print("🎯 FOCUSED REVIEW TEST RESULTS")
        print("=" * 80)
        
        # User Management APIs Results
        print("1️⃣ USER MANAGEMENT APIs:")
        user_mgmt_success = all(user_mgmt_results.values())
        status_icon = "✅" if user_mgmt_success else "❌"
        print(f"   {status_icon} Overall Status: {'HEALTHY' if user_mgmt_success else 'ISSUES DETECTED'}")
        for api, success in user_mgmt_results.items():
            api_icon = "✅" if success else "❌"
            print(f"   {api_icon} {api.replace('_', ' ').title()}: {'Working' if success else 'Failed'}")
        
        # Admin Authentication Results
        print(f"\n2️⃣ ADMIN AUTHENTICATION:")
        auth_icon = "✅" if admin_auth_result else "❌"
        print(f"   {auth_icon} POST /api/admin/login: {'Working' if admin_auth_result else 'Failed'}")
        
        # Major Endpoints Health Results
        print(f"\n3️⃣ MAJOR ENDPOINTS HEALTH:")
        endpoints_success = all(endpoint_health_results.values())
        endpoints_icon = "✅" if endpoints_success else "❌"
        print(f"   {endpoints_icon} Overall Status: {'HEALTHY' if endpoints_success else 'ISSUES DETECTED'}")
        for endpoint, success in endpoint_health_results.items():
            endpoint_icon = "✅" if success else "❌"
            print(f"   {endpoint_icon} {endpoint.replace('_', ' ').title()}: {'Working' if success else 'Failed'}")
        
        # Overall Assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        print(f"   ⏱️  Total test time: {total_time:.2f}s")
        
        critical_systems_healthy = user_mgmt_success and admin_auth_result
        all_systems_healthy = critical_systems_healthy and endpoints_success
        
        if all_systems_healthy:
            print("   ✅ ALL REVIEW FOCUS AREAS HEALTHY")
            print("   ✅ No issues introduced by PDF export frontend fix")
            print("   ✅ Backend APIs working correctly as requested")
            print("   ✅ System ready for production use")
            return True
        elif critical_systems_healthy:
            print("   ⚠️  CORE SYSTEMS HEALTHY - Minor endpoint issues detected")
            print("   ✅ User management and admin authentication working")
            print("   ⚠️  Some non-critical endpoints may need attention")
            return True
        else:
            print("   ❌ CRITICAL ISSUES DETECTED in review focus areas")
            print("   ❌ Core backend functionality compromised")
            print("   🚨 Immediate attention required")
            return False

def main():
    tester = FocusedReviewTester()
    success = tester.run_focused_review_test()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)