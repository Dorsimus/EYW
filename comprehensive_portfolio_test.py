#!/usr/bin/env python3
"""
Final Comprehensive Portfolio Test
"""

import requests
import sys
import json
import time
import io
from datetime import datetime

class ComprehensivePortfolioTester:
    def __init__(self, base_url="https://b30c84c9-22c7-4573-80d3-8236f39befba.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.demo_user_id = "demo-user-123"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        start_time = time.time()
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                # Always use form data for portfolio endpoints
                response = requests.post(url, data=data, files=files, headers=headers, timeout=timeout)

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

    def test_complete_portfolio_flow(self):
        """Test the complete portfolio flow as requested in review"""
        print("\n" + "="*80)
        print("COMPREHENSIVE PORTFOLIO FLOW TEST")
        print("Testing: demo-user-123 consistency, JPEG/PNG support, immediate display")
        print("="*80)
        
        results = []
        
        # 1. Verify demo-user-123 exists and can be retrieved
        print("\n📋 STEP 1: User ID Consistency Testing")
        success1, user_data = self.run_test(
            "Get demo-user-123", 
            "GET", 
            f"users/{self.demo_user_id}", 
            200
        )
        
        if success1:
            user_id_match = user_data.get('id') == self.demo_user_id
            print(f"✅ User ID consistency: {user_id_match}")
            print(f"   Retrieved ID: {user_data.get('id')}")
            print(f"   Expected ID: {self.demo_user_id}")
            results.append(("User ID Consistency", user_id_match))
        else:
            results.append(("User ID Consistency", False))
            return results
        
        # 2. Check initial portfolio state
        print("\n📋 STEP 2: Portfolio Data Verification")
        success2, initial_portfolio = self.run_test(
            "Get initial portfolio for demo-user-123", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if success2:
            initial_count = len(initial_portfolio) if isinstance(initial_portfolio, list) else 0
            print(f"✅ Initial portfolio retrieved: {initial_count} items")
            results.append(("Portfolio Data Retrieval", True))
        else:
            results.append(("Portfolio Data Retrieval", False))
            return results
        
        # 3. Test JPEG image upload
        print("\n📋 STEP 3: JPEG Image Upload Testing")
        jpeg_file = self.create_test_image_file("test_jpeg.jpg", "jpeg")
        
        jpeg_data = {
            'title': 'JPEG Upload Test',
            'description': 'Testing JPEG image upload for portfolio display issue',
            'competency_areas': '["leadership_supervision"]',
            'tags': '["test", "jpeg"]',
            'visibility': 'private'
        }
        
        files_jpeg = {
            'file': ('test_jpeg.jpg', jpeg_file, 'image/jpeg')
        }
        
        success3, jpeg_response = self.run_test(
            "Upload JPEG image", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=jpeg_data,
            files=files_jpeg
        )
        
        if success3:
            jpeg_id = jpeg_response.get('id')
            print(f"✅ JPEG upload successful: {jpeg_id}")
            print(f"   MIME type: {jpeg_response.get('mime_type')}")
            print(f"   File size: {jpeg_response.get('file_size')} bytes")
            results.append(("JPEG Upload", True))
        else:
            results.append(("JPEG Upload", False))
        
        # 4. Test PNG image upload
        print("\n📋 STEP 4: PNG Image Upload Testing")
        png_file = self.create_test_image_file("test_png.png", "png")
        
        png_data = {
            'title': 'PNG Upload Test',
            'description': 'Testing PNG image upload for portfolio display issue',
            'competency_areas': '["financial_management"]',
            'tags': '["test", "png"]',
            'visibility': 'private'
        }
        
        files_png = {
            'file': ('test_png.png', png_file, 'image/png')
        }
        
        success4, png_response = self.run_test(
            "Upload PNG image", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=png_data,
            files=files_png
        )
        
        if success4:
            png_id = png_response.get('id')
            print(f"✅ PNG upload successful: {png_id}")
            print(f"   MIME type: {png_response.get('mime_type')}")
            print(f"   File size: {png_response.get('file_size')} bytes")
            results.append(("PNG Upload", True))
        else:
            results.append(("PNG Upload", False))
        
        # 5. Test portfolio item without file (using multipart form data)
        print("\n📋 STEP 5: Portfolio Item Without File")
        no_file_data = {
            'title': 'No File Portfolio Item',
            'description': 'Testing portfolio item creation without file attachment',
            'competency_areas': '["operational_management"]',
            'tags': '["test", "no-file"]',
            'visibility': 'private'
        }
        
        # Use empty files dict to force multipart/form-data
        success5, no_file_response = self.run_test(
            "Create portfolio item without file", 
            "POST", 
            f"users/{self.demo_user_id}/portfolio", 
            200,
            data=no_file_data,
            files={}  # Empty files dict forces multipart
        )
        
        if success5:
            no_file_id = no_file_response.get('id')
            print(f"✅ No-file item created: {no_file_id}")
            results.append(("Portfolio Without File", True))
        else:
            results.append(("Portfolio Without File", False))
        
        # 6. Verify all uploads appear in portfolio immediately
        print("\n📋 STEP 6: Integration Testing - Immediate Display")
        success6, final_portfolio = self.run_test(
            "Get portfolio after all uploads", 
            "GET", 
            f"users/{self.demo_user_id}/portfolio", 
            200
        )
        
        if success6:
            final_count = len(final_portfolio) if isinstance(final_portfolio, list) else 0
            expected_new_items = 3  # JPEG, PNG, no-file
            actual_new_items = final_count - initial_count
            
            print(f"✅ Final portfolio count: {final_count}")
            print(f"   Initial count: {initial_count}")
            print(f"   New items added: {actual_new_items}")
            print(f"   Expected new items: {expected_new_items}")
            
            immediate_display_success = actual_new_items >= expected_new_items
            print(f"✅ Immediate display working: {immediate_display_success}")
            
            # Show recent uploads
            print("\n   Recent portfolio items:")
            for i, item in enumerate(final_portfolio[:5]):
                file_info = "With file" if item.get('file_path') else "No file"
                print(f"     {i+1}. {item.get('title', 'No title')} - {file_info}")
                print(f"        MIME: {item.get('mime_type', 'N/A')}")
                print(f"        Size: {item.get('file_size_formatted', 'N/A')}")
            
            results.append(("Immediate Display", immediate_display_success))
        else:
            results.append(("Immediate Display", False))
        
        # 7. Test file serving for uploaded images
        print("\n📋 STEP 7: File Serving Verification")
        if success3 and success4:  # If both uploads succeeded
            jpeg_serve_success, _ = self.run_test(
                "Serve JPEG file", 
                "GET", 
                f"files/portfolio/{jpeg_id}", 
                200
            )
            
            png_serve_success, _ = self.run_test(
                "Serve PNG file", 
                "GET", 
                f"files/portfolio/{png_id}", 
                200
            )
            
            file_serving_success = jpeg_serve_success and png_serve_success
            print(f"✅ File serving working: {file_serving_success}")
            results.append(("File Serving", file_serving_success))
        else:
            results.append(("File Serving", False))
        
        return results

    def run_comprehensive_test(self):
        """Run the comprehensive portfolio test"""
        print("🎯 COMPREHENSIVE PORTFOLIO DISPLAY ISSUE DEBUG")
        print("Focus: Complete user-portfolio flow with demo-user-123")
        print("="*80)
        
        results = self.test_complete_portfolio_flow()
        
        # Summary
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE TEST RESULTS")
        print("="*80)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        print("\nDetailed Results:")
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} - {test_name}")
        
        # Key findings for the review request
        print("\n🔍 KEY FINDINGS FOR PORTFOLIO DISPLAY ISSUE:")
        
        user_consistency = next((result for name, result in results if "User ID" in name), False)
        jpeg_support = next((result for name, result in results if "JPEG" in name), False)
        png_support = next((result for name, result in results if "PNG" in name), False)
        immediate_display = next((result for name, result in results if "Immediate" in name), False)
        file_serving = next((result for name, result in results if "Serving" in name), False)
        
        print(f"✅ demo-user-123 consistency: {'WORKING' if user_consistency else 'FAILING'}")
        print(f"✅ JPEG image support: {'WORKING' if jpeg_support else 'FAILING'}")
        print(f"✅ PNG image support: {'WORKING' if png_support else 'FAILING'}")
        print(f"✅ Immediate portfolio display: {'WORKING' if immediate_display else 'FAILING'}")
        print(f"✅ File serving: {'WORKING' if file_serving else 'FAILING'}")
        
        if all([user_consistency, jpeg_support, png_support, immediate_display, file_serving]):
            print("\n🎉 CONCLUSION: Portfolio display issue appears to be RESOLVED!")
            print("   - User ID consistency verified")
            print("   - JPEG/PNG uploads working correctly")
            print("   - Files appear immediately in portfolio")
            print("   - File serving functional")
        else:
            print("\n⚠️  CONCLUSION: Portfolio display issues remain:")
            if not user_consistency:
                print("   - User ID consistency problems")
            if not jpeg_support:
                print("   - JPEG upload issues")
            if not png_support:
                print("   - PNG upload issues")
            if not immediate_display:
                print("   - Files not appearing immediately in portfolio")
            if not file_serving:
                print("   - File serving problems")
        
        return results

if __name__ == "__main__":
    tester = ComprehensivePortfolioTester()
    results = tester.run_comprehensive_test()
    
    all_passed = all(result for _, result in results)
    sys.exit(0 if all_passed else 1)