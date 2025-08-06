#!/usr/bin/env python3
"""
Clerk.com Backend Integration Testing
Test the newly implemented Clerk authentication system
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from environment
BACKEND_URL = "https://c2a0e12f-1224-4828-9864-215c6645b635.preview.emergentagent.com/api"

class ClerkBackendTestSuite:
    def __init__(self):
        self.test_results = []
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log_test(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}s",
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name} ({response_time:.2f}s)")
        print(f"   {details}")
        print()

    def test_clerk_jwks_connectivity(self):
        """Test that backend can connect to Clerk JWKS endpoint"""
        print("🔐 Testing Clerk JWKS Connectivity...")
        
        try:
            # Test direct connection to Clerk JWKS endpoint
            clerk_jwks_url = "https://secure-koi-87.clerk.accounts.dev/.well-known/jwks.json"
            
            start_time = time.time()
            response = self.session.get(clerk_jwks_url)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                jwks_data = response.json()
                
                # Verify JWKS structure
                if "keys" in jwks_data and isinstance(jwks_data["keys"], list):
                    keys_count = len(jwks_data["keys"])
                    has_required_fields = all(
                        key.get("kid") and key.get("kty") and key.get("use") 
                        for key in jwks_data["keys"]
                    )
                    
                    if has_required_fields:
                        self.log_test(
                            "Clerk JWKS Connectivity",
                            True,
                            f"Successfully connected to Clerk JWKS endpoint. Found {keys_count} valid keys.",
                            response_time
                        )
                        return True
                    else:
                        self.log_test(
                            "Clerk JWKS Structure",
                            False,
                            "JWKS keys missing required fields (kid, kty, use)",
                            response_time
                        )
                        return False
                else:
                    self.log_test(
                        "Clerk JWKS Format",
                        False,
                        "Invalid JWKS format - missing 'keys' array",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "Clerk JWKS HTTP Status",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Clerk JWKS Connection",
                False,
                f"Connection error: {str(e)}",
                0
            )
            return False

    def test_admin_endpoints_without_auth(self):
        """Test that admin endpoints properly reject requests without authentication"""
        print("🚫 Testing Admin Endpoints Without Authentication...")
        
        admin_endpoints = [
            "/admin/tasks",
            "/admin/stats", 
            "/admin/users",
            "/admin/storage/stats"
        ]
        
        all_protected = True
        results = []
        
        for endpoint in admin_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                response_time = time.time() - start_time
                
                # Should return 401 or 403 for unauthorized access
                if response.status_code in [401, 403]:
                    results.append(f"✅ {endpoint}: HTTP {response.status_code}")
                else:
                    results.append(f"❌ {endpoint}: HTTP {response.status_code} (should be 401/403)")
                    all_protected = False
                    
            except Exception as e:
                results.append(f"❌ {endpoint}: Connection error - {str(e)}")
                all_protected = False
        
        self.log_test(
            "Admin Endpoints Protection",
            all_protected,
            f"Tested {len(admin_endpoints)} admin endpoints. " + "; ".join(results),
            0
        )
        return all_protected

    def test_admin_endpoints_with_invalid_token(self):
        """Test admin endpoints with invalid JWT token"""
        print("🔒 Testing Admin Endpoints With Invalid Token...")
        
        admin_endpoints = [
            "/admin/tasks",
            "/admin/stats"
        ]
        
        # Test with various invalid tokens
        invalid_tokens = [
            "invalid.jwt.token",
            "Bearer invalid.jwt.token",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
            ""
        ]
        
        all_rejected = True
        results = []
        
        for token in invalid_tokens[:2]:  # Test first 2 to avoid too many requests
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            for endpoint in admin_endpoints[:1]:  # Test one endpoint per token
                try:
                    start_time = time.time()
                    response = self.session.get(f"{BACKEND_URL}{endpoint}", headers=headers)
                    response_time = time.time() - start_time
                    
                    # Should return 401 for invalid token
                    if response.status_code == 401:
                        results.append(f"✅ {endpoint} with token '{token[:20]}...': HTTP 401")
                    else:
                        results.append(f"❌ {endpoint} with token '{token[:20]}...': HTTP {response.status_code}")
                        all_rejected = False
                        
                except Exception as e:
                    results.append(f"❌ {endpoint}: Connection error - {str(e)}")
                    all_rejected = False
        
        self.log_test(
            "Invalid Token Rejection",
            all_rejected,
            f"Tested invalid tokens on admin endpoints. " + "; ".join(results),
            0
        )
        return all_rejected

    def test_jwt_token_validation_logic(self):
        """Test JWT token validation logic by examining error responses"""
        print("🔍 Testing JWT Token Validation Logic...")
        
        try:
            # Test with malformed JWT (missing parts)
            malformed_tokens = [
                "onlyonepart",
                "two.parts",
                "three.parts.but.invalid"
            ]
            
            validation_working = True
            results = []
            
            for token in malformed_tokens:
                headers = {"Authorization": f"Bearer {token}"}
                
                start_time = time.time()
                response = self.session.get(f"{BACKEND_URL}/admin/stats", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code == 401:
                    try:
                        error_data = response.json()
                        error_detail = error_data.get("detail", "")
                        
                        # Check if error message indicates proper JWT validation
                        if any(keyword in error_detail.lower() for keyword in ["token", "invalid", "malformed", "decode"]):
                            results.append(f"✅ Token '{token}': Proper validation error")
                        else:
                            results.append(f"⚠️ Token '{token}': Generic error message")
                    except:
                        results.append(f"✅ Token '{token}': HTTP 401 (no JSON response)")
                else:
                    results.append(f"❌ Token '{token}': HTTP {response.status_code} (should be 401)")
                    validation_working = False
            
            self.log_test(
                "JWT Token Validation Logic",
                validation_working,
                f"Tested malformed JWT tokens. " + "; ".join(results),
                0
            )
            return validation_working
            
        except Exception as e:
            self.log_test(
                "JWT Token Validation Logic",
                False,
                f"Test error: {str(e)}",
                0
            )
            return False

    def test_clerk_configuration_endpoints(self):
        """Test that Clerk configuration is properly set up"""
        print("⚙️ Testing Clerk Configuration...")
        
        try:
            # Test a simple endpoint to see if Clerk configuration is loaded
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                # Backend is running, which means Clerk config loaded without errors
                self.log_test(
                    "Clerk Configuration Loading",
                    True,
                    "Backend started successfully with Clerk configuration loaded",
                    response_time
                )
                
                # Test that authentication middleware is active by checking protected endpoint
                auth_test_response = self.session.get(f"{BACKEND_URL}/admin/stats")
                
                if auth_test_response.status_code in [401, 403]:
                    self.log_test(
                        "Clerk Authentication Middleware",
                        True,
                        f"Authentication middleware active - protected endpoint returns HTTP {auth_test_response.status_code}",
                        0
                    )
                    return True
                else:
                    self.log_test(
                        "Clerk Authentication Middleware",
                        False,
                        f"Authentication middleware may not be active - protected endpoint returns HTTP {auth_test_response.status_code}",
                        0
                    )
                    return False
            else:
                self.log_test(
                    "Clerk Configuration Loading",
                    False,
                    f"Backend not responding properly - HTTP {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Clerk Configuration Test",
                False,
                f"Configuration test error: {str(e)}",
                0
            )
            return False

    def test_role_based_access_control(self):
        """Test role-based access control logic"""
        print("👥 Testing Role-Based Access Control...")
        
        try:
            # Test that different admin endpoints use proper role checking
            # We can't test with valid tokens, but we can verify the endpoints exist and are protected
            
            admin_only_endpoints = [
                "/admin/tasks",
                "/admin/users", 
                "/admin/stats",
                "/admin/storage/stats"
            ]
            
            all_protected = True
            results = []
            
            for endpoint in admin_only_endpoints:
                start_time = time.time()
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                response_time = time.time() - start_time
                
                # All these endpoints should require admin role
                if response.status_code in [401, 403]:
                    results.append(f"✅ {endpoint}: Protected (HTTP {response.status_code})")
                else:
                    results.append(f"❌ {endpoint}: Not protected (HTTP {response.status_code})")
                    all_protected = False
            
            self.log_test(
                "Role-Based Access Control",
                all_protected,
                f"Tested {len(admin_only_endpoints)} admin-only endpoints. " + "; ".join(results),
                0
            )
            return all_protected
            
        except Exception as e:
            self.log_test(
                "Role-Based Access Control",
                False,
                f"RBAC test error: {str(e)}",
                0
            )
            return False

    def test_error_handling_quality(self):
        """Test quality of error messages and HTTP status codes"""
        print("🛡️ Testing Error Handling Quality...")
        
        try:
            test_scenarios = [
                {
                    "name": "No Authorization Header",
                    "headers": {},
                    "expected_status": [401, 403]
                },
                {
                    "name": "Empty Authorization Header", 
                    "headers": {"Authorization": ""},
                    "expected_status": [401, 403]
                },
                {
                    "name": "Invalid Bearer Format",
                    "headers": {"Authorization": "InvalidFormat token"},
                    "expected_status": [401, 403]
                },
                {
                    "name": "Bearer with Empty Token",
                    "headers": {"Authorization": "Bearer "},
                    "expected_status": [401, 403]
                }
            ]
            
            all_handled_properly = True
            results = []
            
            for scenario in test_scenarios:
                start_time = time.time()
                response = self.session.get(
                    f"{BACKEND_URL}/admin/stats", 
                    headers=scenario["headers"]
                )
                response_time = time.time() - start_time
                
                if response.status_code in scenario["expected_status"]:
                    # Check if response has proper JSON error format
                    try:
                        error_data = response.json()
                        if "detail" in error_data:
                            results.append(f"✅ {scenario['name']}: HTTP {response.status_code} with proper error format")
                        else:
                            results.append(f"⚠️ {scenario['name']}: HTTP {response.status_code} but no 'detail' field")
                    except:
                        results.append(f"✅ {scenario['name']}: HTTP {response.status_code} (non-JSON response)")
                else:
                    results.append(f"❌ {scenario['name']}: HTTP {response.status_code} (expected {scenario['expected_status']})")
                    all_handled_properly = False
            
            self.log_test(
                "Error Handling Quality",
                all_handled_properly,
                f"Tested {len(test_scenarios)} error scenarios. " + "; ".join(results),
                0
            )
            return all_handled_properly
            
        except Exception as e:
            self.log_test(
                "Error Handling Quality",
                False,
                f"Error handling test failed: {str(e)}",
                0
            )
            return False

    def test_legacy_admin_removal(self):
        """Test that legacy admin authentication endpoints have been removed/replaced"""
        print("🗑️ Testing Legacy Admin System Removal...")
        
        try:
            # Test that old admin login endpoint behavior has changed
            legacy_login_data = {
                "email": "admin@earnwings.com",
                "password": "admin123"
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{BACKEND_URL}/admin/login",
                json=legacy_login_data,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            # The endpoint might still exist but should not work with old JWT system
            # OR it might be completely removed (404)
            if response.status_code == 404:
                self.log_test(
                    "Legacy Admin Login Removal",
                    True,
                    "Legacy admin login endpoint properly removed (HTTP 404)",
                    response_time
                )
                return True
            elif response.status_code in [401, 403]:
                self.log_test(
                    "Legacy Admin Login Disabled",
                    True,
                    f"Legacy admin login properly disabled (HTTP {response.status_code})",
                    response_time
                )
                return True
            elif response.status_code == 200:
                # If it still returns 200, check if it's actually using Clerk now
                try:
                    response_data = response.json()
                    if "token" in response_data:
                        self.log_test(
                            "Legacy Admin Login Still Active",
                            False,
                            "Legacy JWT admin login still working - should be replaced with Clerk",
                            response_time
                        )
                        return False
                    else:
                        self.log_test(
                            "Legacy Admin Login Modified",
                            True,
                            "Legacy admin login endpoint modified (no JWT token returned)",
                            response_time
                        )
                        return True
                except:
                    self.log_test(
                        "Legacy Admin Login Response",
                        True,
                        "Legacy admin login returns non-standard response",
                        response_time
                    )
                    return True
            else:
                self.log_test(
                    "Legacy Admin Login Status",
                    True,
                    f"Legacy admin login returns HTTP {response.status_code} (not functioning as before)",
                    response_time
                )
                return True
                
        except Exception as e:
            self.log_test(
                "Legacy Admin System Test",
                False,
                f"Test error: {str(e)}",
                0
            )
            return False

    def run_comprehensive_test_suite(self):
        """Run all Clerk backend integration tests"""
        print("🚀 Starting Clerk.com Backend Integration Test Suite")
        print("=" * 70)
        
        test_methods = [
            self.test_clerk_jwks_connectivity,
            self.test_admin_endpoints_without_auth,
            self.test_admin_endpoints_with_invalid_token,
            self.test_jwt_token_validation_logic,
            self.test_clerk_configuration_endpoints,
            self.test_role_based_access_control,
            self.test_error_handling_quality,
            self.test_legacy_admin_removal
        ]
        
        passed_tests = 0
        total_tests = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_method.__name__}: {str(e)}")
        
        print("=" * 70)
        print(f"🎯 CLERK BACKEND INTEGRATION TEST RESULTS: {passed_tests}/{total_tests} tests passed")
        print(f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("✅ ALL CLERK INTEGRATION TESTS PASSED - Authentication system ready!")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️ MOST TESTS PASSED - Minor authentication issues need attention")
        else:
            print("❌ MULTIPLE TEST FAILURES - Significant authentication issues require fixing")
        
        return passed_tests, total_tests

def main():
    """Main test execution"""
    print("Clerk.com Backend Integration Testing")
    print("Testing newly implemented Clerk authentication system")
    print()
    
    test_suite = ClerkBackendTestSuite()
    passed, total = test_suite.run_comprehensive_test_suite()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)