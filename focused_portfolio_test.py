#!/usr/bin/env python3
"""
Focused Portfolio Test - Fix the issues found
"""

import requests
import sys
import json
import time
import io
from datetime import datetime

class FocusedPortfolioTester:
    def __init__(self, base_url="https://c2a0e12f-1224-4828-9864-215c6645b635.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.demo_user_id = "demo-user-123"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

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

            response_time = time.time() - start_time
            print(f"   Response Time: {response_time:.2f}s")
            
            success = response.status_code == expected_status
            if success:
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}...")
                return False, {}

        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Failed - Error after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def create_test_image_file(self, filename, file_type="jpeg"):
        """Create a minimal test image file in memory"""
        if file_type.lower() == "jpeg":
            jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
            return io.BytesIO(jpeg_data)
        elif file_type.lower() == "png":
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
            return io.BytesIO(png_data)

    def test_portfolio_creation_form_data(self):
        """Test portfolio creation using proper form data format"""
        print("\n" + "="*60)
        print("TESTING PORTFOLIO CREATION WITH FORM DATA")
        print("="*60)
        
        # Test with file
        jpeg_file = self.create_test_image_file("test_form.jpg", "jpeg")
        
        portfolio_data = {
            'title': 'Form Data Test with File',
            'description': 'Testing form data submission with file',
            'competency_areas': '["leadership_supervision"]',
            'tags': '["test", "form-data"]',
            'visibility': 'private'
        }
        
        files = {
            'file': ('test_form.jpg', jpeg_file, 'image/jpeg')
        }
        
        success1, response1 = self.run_test(
            "Portfolio Creation with File (Form Data)", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data,
            files=files
        )
        
        # Test without file using form data
        portfolio_data_no_file = {
            'title': 'Form Data Test without File',
            'description': 'Testing form data submission without file',
            'competency_areas': '["operational_management"]',
            'tags': '["test", "no-file"]',
            'visibility': 'private'
        }
        
        success2, response2 = self.run_test(
            "Portfolio Creation without File (Form Data)", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data_no_file
        )
        
        return success1 and success2

    def test_demo_user_consistency(self):
        """Test demo-user-123 consistency across operations"""
        print("\n" + "="*60)
        print("TESTING DEMO-USER-123 CONSISTENCY")
        print("="*60)
        
        # 1. Get user
        success1, user_data = self.run_test(
            "Get Demo User", 
            "GET", 
            f"users/{self.demo_user_id}", 
            200
        )
        
        if not success1:
            return False
        
        print(f"✅ User ID consistency: {user_data.get('id') == self.demo_user_id}")
        
        # 2. Get portfolio
        success2, portfolio_data = self.run_test(
            "Get Demo User Portfolio", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if not success2:
            return False
        
        print(f"✅ Portfolio retrieved for demo-user-123: {len(portfolio_data)} items")
        
        # 3. Upload new file
        test_file = self.create_test_image_file("consistency_test.png", "png")
        portfolio_data_new = {
            'title': 'Consistency Test Upload',
            'description': 'Testing user ID consistency in uploads',
            'competency_areas': '["strategic_thinking"]',
            'tags': '["consistency"]',
            'visibility': 'private'
        }
        
        files = {
            'file': ('consistency_test.png', test_file, 'image/png')
        }
        
        success3, upload_response = self.run_test(
            "Upload for Consistency Test", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=portfolio_data_new,
            files=files
        )
        
        if not success3:
            return False
        
        # 4. Verify upload appears in portfolio immediately
        success4, updated_portfolio = self.run_test(
            "Get Portfolio After Consistency Upload", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if not success4:
            return False
        
        new_item_id = upload_response.get('id')
        found_new_item = any(item.get('id') == new_item_id for item in updated_portfolio)
        
        print(f"✅ New upload immediately visible: {found_new_item}")
        print(f"✅ User ID in upload response: {upload_response.get('user_id') == self.demo_user_id}")
        
        return success1 and success2 and success3 and success4 and found_new_item

    def test_jpeg_png_support(self):
        """Test JPEG and PNG support specifically"""
        print("\n" + "="*60)
        print("TESTING JPEG AND PNG IMAGE SUPPORT")
        print("="*60)
        
        # Test JPEG
        jpeg_file = self.create_test_image_file("test_jpeg_support.jpg", "jpeg")
        jpeg_data = {
            'title': 'JPEG Support Test',
            'description': 'Testing JPEG image support',
            'competency_areas': '["financial_management"]',
            'tags': '["jpeg", "image"]',
            'visibility': 'private'
        }
        
        files_jpeg = {
            'file': ('test_jpeg_support.jpg', jpeg_file, 'image/jpeg')
        }
        
        success1, jpeg_response = self.run_test(
            "JPEG Image Upload", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=jpeg_data,
            files=files_jpeg
        )
        
        # Test PNG
        png_file = self.create_test_image_file("test_png_support.png", "png")
        png_data = {
            'title': 'PNG Support Test',
            'description': 'Testing PNG image support',
            'competency_areas': '["operational_management"]',
            'tags': '["png", "image"]',
            'visibility': 'private'
        }
        
        files_png = {
            'file': ('test_png_support.png', png_file, 'image/png')
        }
        
        success2, png_response = self.run_test(
            "PNG Image Upload", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=png_data,
            files=files_png
        )
        
        if success1 and success2:
            print(f"✅ JPEG MIME type: {jpeg_response.get('mime_type')}")
            print(f"✅ PNG MIME type: {png_response.get('mime_type')}")
            print(f"✅ JPEG file size: {jpeg_response.get('file_size')} bytes")
            print(f"✅ PNG file size: {png_response.get('file_size')} bytes")
            
            # Test file serving
            jpeg_id = jpeg_response.get('id')
            png_id = png_response.get('id')
            
            success3, _ = self.run_test(
                "Serve JPEG File", 
                "GET", 
                f"files/portfolio/{jpeg_id}", 
                200
            )
            
            success4, _ = self.run_test(
                "Serve PNG File", 
                "GET", 
                f"files/portfolio/{png_id}", 
                200
            )
            
            print(f"✅ JPEG file serving: {success3}")
            print(f"✅ PNG file serving: {success4}")
            
            return success1 and success2 and success3 and success4
        
        return False

    def run_focused_tests(self):
        """Run focused tests on the key issues"""
        print("🎯 FOCUSED PORTFOLIO TESTS")
        print("Focus: Form data, user consistency, JPEG/PNG support")
        print("="*80)
        
        results = []
        
        # Test 1: Portfolio creation with proper form data
        result1 = self.test_portfolio_creation_form_data()
        results.append(("Portfolio Form Data Creation", result1))
        
        # Test 2: Demo user consistency
        result2 = self.test_demo_user_consistency()
        results.append(("Demo User Consistency", result2))
        
        # Test 3: JPEG/PNG support
        result3 = self.test_jpeg_png_support()
        results.append(("JPEG/PNG Image Support", result3))
        
        # Summary
        print("\n" + "="*80)
        print("🎯 FOCUSED TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        print(f"Critical Tests Passed: {passed}/{total}")
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} - {test_name}")
        
        # Key conclusions
        print("\n🔍 KEY CONCLUSIONS:")
        if all(result for _, result in results):
            print("✅ ALL CRITICAL TESTS PASSED")
            print("✅ Portfolio display issue likely resolved")
            print("✅ demo-user-123 working consistently")
            print("✅ JPEG and PNG uploads working correctly")
            print("✅ Files appear immediately in portfolio after upload")
        else:
            print("❌ CRITICAL ISSUES REMAIN:")
            failed_tests = [name for name, result in results if not result]
            for failed_test in failed_tests:
                print(f"   - {failed_test}")
        
        return results

if __name__ == "__main__":
    tester = FocusedPortfolioTester()
    results = tester.run_focused_tests()
    
    all_passed = all(result for _, result in results)
    sys.exit(0 if all_passed else 1)