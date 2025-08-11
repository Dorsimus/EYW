#!/usr/bin/env python3
"""
Portfolio Display Issue Debug Test
Focus: Test complete user and portfolio flow with demo-user-123
"""

import requests
import sys
import json
import time
import io
from datetime import datetime

class PortfolioDebugTester:
    def __init__(self, base_url="https://f89e38a3-d297-4f05-9465-c93694e16aba.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.demo_user_id = "demo-user-123"
        self.admin_token = None
        self.uploaded_files = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False, timeout=30):
        """Run a single API test with detailed response analysis"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
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
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}...")
                return False, {}

        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            print(f"❌ Failed - TIMEOUT after {response_time:.2f}s")
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Failed - Error after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def create_test_image_file(self, filename, file_type="jpeg"):
        """Create a minimal test image file in memory"""
        if file_type.lower() == "jpeg":
            # Minimal JPEG header
            jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
            return io.BytesIO(jpeg_data)
        elif file_type.lower() == "png":
            # Minimal PNG header
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
            return io.BytesIO(png_data)
        else:
            # Simple text file for other types
            return io.BytesIO(b"Test file content for portfolio testing")

    def test_1_demo_user_creation(self):
        """Test 1: Create demo-user-123 with exact ID"""
        print("\n" + "="*60)
        print("TEST 1: DEMO USER CREATION AND RETRIEVAL")
        print("="*60)
        
        user_data = {
            "id": self.demo_user_id,
            "email": "demo@earnwings.com",
            "name": "Demo Navigator",
            "role": "participant",
            "level": "navigator"
        }
        
        print(f"Creating user with specific ID: {self.demo_user_id}")
        success, response = self.run_test(
            "Create Demo User with Specific ID", 
            "POST", 
            "users", 
            200, 
            data=user_data
        )
        
        if success:
            returned_id = response.get('id')
            if returned_id == self.demo_user_id:
                print(f"✅ User created with correct ID: {returned_id}")
            else:
                print(f"❌ ID mismatch - Expected: {self.demo_user_id}, Got: {returned_id}")
                return False
        else:
            print("❌ Failed to create demo user")
            return False
        
        return True

    def test_2_demo_user_retrieval(self):
        """Test 2: Verify demo-user-123 can be retrieved"""
        print("\n" + "="*60)
        print("TEST 2: DEMO USER RETRIEVAL VERIFICATION")
        print("="*60)
        
        success, response = self.run_test(
            "Get Demo User by ID", 
            "GET", 
            f"users/{self.demo_user_id}", 
            200
        )
        
        if success:
            print(f"✅ User retrieved successfully:")
            print(f"   ID: {response.get('id')}")
            print(f"   Name: {response.get('name')}")
            print(f"   Email: {response.get('email')}")
            print(f"   Role: {response.get('role')}")
            return True
        else:
            print("❌ Failed to retrieve demo user")
            return False

    def test_3_initial_portfolio_check(self):
        """Test 3: Check initial portfolio state for demo-user-123"""
        print("\n" + "="*60)
        print("TEST 3: INITIAL PORTFOLIO STATE CHECK")
        print("="*60)
        
        success, response = self.run_test(
            "Get Initial Portfolio State", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if success:
            portfolio_count = len(response) if isinstance(response, list) else 0
            print(f"✅ Initial portfolio retrieved successfully")
            print(f"   Portfolio items count: {portfolio_count}")
            if portfolio_count > 0:
                print("   Existing portfolio items:")
                for i, item in enumerate(response[:3]):  # Show first 3
                    print(f"     {i+1}. {item.get('title', 'No title')} - {item.get('file_size_formatted', 'No size')}")
            else:
                print("   Portfolio is empty (as expected for new user)")
            return True
        else:
            print("❌ Failed to retrieve initial portfolio")
            return False

    def test_4_jpeg_image_upload(self):
        """Test 4: Upload JPEG image to portfolio"""
        print("\n" + "="*60)
        print("TEST 4: JPEG IMAGE UPLOAD TEST")
        print("="*60)
        
        # Create test JPEG file
        jpeg_file = self.create_test_image_file("test_image.jpg", "jpeg")
        
        portfolio_data = {
            'title': 'Test JPEG Image Upload',
            'description': 'Testing JPEG image upload functionality for portfolio display issue',
            'competency_areas': '["leadership_supervision"]',
            'tags': '["test", "jpeg", "image"]',
            'visibility': 'private'
        }
        
        files = {
            'file': ('test_image.jpg', jpeg_file, 'image/jpeg')
        }
        
        success, response = self.run_test(
            "Upload JPEG Image to Portfolio", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data,
            files=files
        )
        
        if success:
            print(f"✅ JPEG upload successful:")
            print(f"   Item ID: {response.get('id')}")
            print(f"   Title: {response.get('title')}")
            print(f"   Original filename: {response.get('original_filename')}")
            print(f"   Secure filename: {response.get('secure_filename')}")
            print(f"   File size: {response.get('file_size')} bytes")
            print(f"   MIME type: {response.get('mime_type')}")
            self.uploaded_files.append(response.get('id'))
            return True
        else:
            print("❌ JPEG upload failed")
            return False

    def test_5_png_image_upload(self):
        """Test 5: Upload PNG image to portfolio"""
        print("\n" + "="*60)
        print("TEST 5: PNG IMAGE UPLOAD TEST")
        print("="*60)
        
        # Create test PNG file
        png_file = self.create_test_image_file("test_image.png", "png")
        
        portfolio_data = {
            'title': 'Test PNG Image Upload',
            'description': 'Testing PNG image upload functionality for portfolio display issue',
            'competency_areas': '["financial_management"]',
            'tags': '["test", "png", "image"]',
            'visibility': 'private'
        }
        
        files = {
            'file': ('test_image.png', png_file, 'image/png')
        }
        
        success, response = self.run_test(
            "Upload PNG Image to Portfolio", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data,
            files=files
        )
        
        if success:
            print(f"✅ PNG upload successful:")
            print(f"   Item ID: {response.get('id')}")
            print(f"   Title: {response.get('title')}")
            print(f"   Original filename: {response.get('original_filename')}")
            print(f"   Secure filename: {response.get('secure_filename')}")
            print(f"   File size: {response.get('file_size')} bytes")
            print(f"   MIME type: {response.get('mime_type')}")
            self.uploaded_files.append(response.get('id'))
            return True
        else:
            print("❌ PNG upload failed")
            return False

    def test_6_portfolio_without_file(self):
        """Test 6: Create portfolio item without file"""
        print("\n" + "="*60)
        print("TEST 6: PORTFOLIO ITEM WITHOUT FILE")
        print("="*60)
        
        portfolio_data = {
            'title': 'Portfolio Item Without File',
            'description': 'Testing portfolio creation without file attachment',
            'competency_areas': '["operational_management"]',
            'tags': '["test", "no-file"]',
            'visibility': 'private'
        }
        
        success, response = self.run_test(
            "Create Portfolio Item Without File", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data
        )
        
        if success:
            print(f"✅ Portfolio item without file created successfully:")
            print(f"   Item ID: {response.get('id')}")
            print(f"   Title: {response.get('title')}")
            print(f"   Has file: {'Yes' if response.get('file_path') else 'No'}")
            self.uploaded_files.append(response.get('id'))
            return True
        else:
            print("❌ Portfolio item without file creation failed")
            return False

    def test_7_portfolio_retrieval_after_uploads(self):
        """Test 7: Retrieve portfolio after uploads to verify items appear"""
        print("\n" + "="*60)
        print("TEST 7: PORTFOLIO RETRIEVAL AFTER UPLOADS")
        print("="*60)
        
        success, response = self.run_test(
            "Get Portfolio After Uploads", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if success:
            portfolio_count = len(response) if isinstance(response, list) else 0
            print(f"✅ Portfolio retrieved after uploads:")
            print(f"   Total portfolio items: {portfolio_count}")
            print(f"   Expected items: {len(self.uploaded_files)}")
            
            if portfolio_count == len(self.uploaded_files):
                print("✅ All uploaded items appear in portfolio!")
            else:
                print(f"❌ Item count mismatch - Expected: {len(self.uploaded_files)}, Found: {portfolio_count}")
            
            print("\n   Portfolio items details:")
            for i, item in enumerate(response):
                file_info = "With file" if item.get('file_path') else "No file"
                file_size = item.get('file_size_formatted', 'N/A')
                print(f"     {i+1}. {item.get('title', 'No title')} - {file_info} ({file_size})")
                print(f"        ID: {item.get('id')}")
                print(f"        MIME: {item.get('mime_type', 'N/A')}")
                print(f"        Upload date: {item.get('upload_date', 'N/A')}")
            
            return portfolio_count == len(self.uploaded_files)
        else:
            print("❌ Failed to retrieve portfolio after uploads")
            return False

    def test_8_file_serving_verification(self):
        """Test 8: Verify uploaded files can be served"""
        print("\n" + "="*60)
        print("TEST 8: FILE SERVING VERIFICATION")
        print("="*60)
        
        if not self.uploaded_files:
            print("❌ No uploaded files to test serving")
            return False
        
        # Test serving the first uploaded file (should be JPEG)
        file_id = self.uploaded_files[0]
        
        success, response = self.run_test(
            "Serve Portfolio File", 
            "GET", 
            f"files/portfolio/{file_id}", 
            200
        )
        
        if success:
            print(f"✅ File serving successful for file ID: {file_id}")
            print(f"   Response type: {type(response)}")
            if isinstance(response, str):
                print(f"   Response length: {len(response)} characters")
            return True
        else:
            print(f"❌ File serving failed for file ID: {file_id}")
            return False

    def test_9_portfolio_visibility_filtering(self):
        """Test 9: Test portfolio visibility filtering"""
        print("\n" + "="*60)
        print("TEST 9: PORTFOLIO VISIBILITY FILTERING")
        print("="*60)
        
        # Test filtering by private visibility
        success, response = self.run_test(
            "Get Private Portfolio Items", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio?visibility=private", 
            200
        )
        
        if success:
            private_count = len(response) if isinstance(response, list) else 0
            print(f"✅ Private portfolio items retrieved:")
            print(f"   Private items count: {private_count}")
            
            # All our test items should be private
            if private_count == len(self.uploaded_files):
                print("✅ All test items correctly filtered as private")
                return True
            else:
                print(f"❌ Private filter mismatch - Expected: {len(self.uploaded_files)}, Found: {private_count}")
                return False
        else:
            print("❌ Failed to retrieve private portfolio items")
            return False

    def test_10_integration_flow_verification(self):
        """Test 10: Complete integration flow verification"""
        print("\n" + "="*60)
        print("TEST 10: COMPLETE INTEGRATION FLOW VERIFICATION")
        print("="*60)
        
        print("🔄 Testing complete flow: User -> Upload -> Retrieve -> Verify")
        
        # Step 1: Verify user exists
        user_success, user_data = self.run_test(
            "Verify User Exists", 
            "GET", 
            f"users/{self.demo_user_id}", 
            200
        )
        
        if not user_success:
            print("❌ User verification failed")
            return False
        
        # Step 2: Upload a new test file
        test_file = self.create_test_image_file("integration_test.jpg", "jpeg")
        portfolio_data = {
            'title': 'Integration Test File',
            'description': 'Final integration test for portfolio display issue',
            'competency_areas': '["strategic_thinking"]',
            'tags': '["integration", "test"]',
            'visibility': 'private'
        }
        
        files = {
            'file': ('integration_test.jpg', test_file, 'image/jpeg')
        }
        
        upload_success, upload_data = self.run_test(
            "Integration Test Upload", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data,
            files=files
        )
        
        if not upload_success:
            print("❌ Integration test upload failed")
            return False
        
        new_file_id = upload_data.get('id')
        
        # Step 3: Immediately retrieve portfolio to verify new item appears
        retrieve_success, portfolio_data = self.run_test(
            "Immediate Portfolio Retrieval", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if not retrieve_success:
            print("❌ Portfolio retrieval after upload failed")
            return False
        
        # Step 4: Verify the new item is in the portfolio
        found_new_item = False
        for item in portfolio_data:
            if item.get('id') == new_file_id:
                found_new_item = True
                print(f"✅ New item found in portfolio immediately after upload:")
                print(f"   Title: {item.get('title')}")
                print(f"   ID: {item.get('id')}")
                break
        
        if found_new_item:
            print("✅ INTEGRATION FLOW SUCCESS: Upload -> Immediate Retrieval -> Item Found")
            return True
        else:
            print("❌ INTEGRATION FLOW FAILED: New item not found in portfolio after upload")
            return False

    def run_all_tests(self):
        """Run all portfolio debug tests"""
        print("🚀 STARTING PORTFOLIO DISPLAY ISSUE DEBUG TESTS")
        print("Focus: demo-user-123 consistency and JPEG/PNG support")
        print("="*80)
        
        test_results = []
        
        # Run all tests in sequence
        tests = [
            ("Demo User Creation", self.test_1_demo_user_creation),
            ("Demo User Retrieval", self.test_2_demo_user_retrieval),
            ("Initial Portfolio Check", self.test_3_initial_portfolio_check),
            ("JPEG Image Upload", self.test_4_jpeg_image_upload),
            ("PNG Image Upload", self.test_5_png_image_upload),
            ("Portfolio Without File", self.test_6_portfolio_without_file),
            ("Portfolio After Uploads", self.test_7_portfolio_retrieval_after_uploads),
            ("File Serving", self.test_8_file_serving_verification),
            ("Visibility Filtering", self.test_9_portfolio_visibility_filtering),
            ("Integration Flow", self.test_10_integration_flow_verification)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                test_results.append((test_name, result))
            except Exception as e:
                print(f"❌ Test '{test_name}' crashed: {str(e)}")
                test_results.append((test_name, False))
        
        # Print summary
        print("\n" + "="*80)
        print("🎯 PORTFOLIO DEBUG TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Overall Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Critical Tests Passed: {passed}/{total}")
        
        print("\nDetailed Results:")
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} - {test_name}")
        
        # Key findings
        print("\n🔍 KEY FINDINGS:")
        if all(result for _, result in test_results):
            print("✅ ALL TESTS PASSED - Portfolio display should be working correctly")
            print("✅ demo-user-123 consistency verified")
            print("✅ JPEG and PNG image uploads working")
            print("✅ Files appear immediately in portfolio after upload")
        else:
            print("❌ ISSUES FOUND - Portfolio display problems identified:")
            failed_tests = [name for name, result in test_results if not result]
            for failed_test in failed_tests:
                print(f"   - {failed_test} failed")
        
        return test_results

if __name__ == "__main__":
    tester = PortfolioDebugTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(result for _, result in results)
    sys.exit(0 if all_passed else 1)