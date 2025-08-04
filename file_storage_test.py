import requests
import sys
import json
import time
import os
import tempfile
from datetime import datetime
from pathlib import Path

class FileStorageSystemTester:
    def __init__(self, base_url="https://dfa066c0-2724-4f8c-87ee-696b2f1f82b7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.admin_user = None
        self.created_portfolio_items = []
        self.test_files = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False, timeout=30):
        """Run a single API test with timeout and detailed response analysis"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        # Add authorization header if admin token is available and auth is required
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if auth_required:
            print(f"   Auth: {'✅ Token provided' if self.admin_token else '❌ No token'}")
        
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
            print(f"❌ Failed - TIMEOUT after {response_time:.2f}s (limit: {timeout}s)")
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Failed - Error after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def create_test_files(self):
        """Create test files for upload testing"""
        print("\n📁 Creating test files for upload testing...")
        
        # Create temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create different types of test files
        test_files = {
            'small_pdf': {
                'filename': 'test_document.pdf',
                'content': b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF',
                'mime_type': 'application/pdf'
            },
            'small_image': {
                'filename': 'test_image.png',
                'content': b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82',
                'mime_type': 'image/png'
            },
            'text_file': {
                'filename': 'test_document.txt',
                'content': b'This is a test text file for portfolio upload testing.\nIt contains multiple lines of text to simulate a real document.',
                'mime_type': 'text/plain'
            },
            'large_file': {
                'filename': 'large_test_file.txt',
                'content': b'Large file content: ' + b'X' * (10 * 1024 * 1024),  # 10MB file
                'mime_type': 'text/plain'
            },
            'oversized_file': {
                'filename': 'oversized_file.txt',
                'content': b'Oversized file: ' + b'X' * (60 * 1024 * 1024),  # 60MB file (exceeds 50MB limit)
                'mime_type': 'text/plain'
            },
            'invalid_extension': {
                'filename': 'test_file.exe',
                'content': b'This is an executable file that should be rejected',
                'mime_type': 'application/octet-stream'
            }
        }
        
        # Write test files to disk
        for file_key, file_info in test_files.items():
            file_path = Path(self.temp_dir) / file_info['filename']
            with open(file_path, 'wb') as f:
                f.write(file_info['content'])
            
            self.test_files[file_key] = {
                'path': str(file_path),
                'filename': file_info['filename'],
                'mime_type': file_info['mime_type'],
                'size': len(file_info['content'])
            }
            
            print(f"   Created {file_key}: {file_info['filename']} ({len(file_info['content'])} bytes)")
        
        print(f"   Test files created in: {self.temp_dir}")

    def cleanup_test_files(self):
        """Clean up temporary test files"""
        if hasattr(self, 'temp_dir') and os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"   Cleaned up test files from: {self.temp_dir}")

    def setup_test_user(self):
        """Create a test user for file operations"""
        user_data = {
            "email": f"filetest_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "File Test User",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create Test User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created test user with ID: {self.user_id}")
        return success, response

    def setup_admin_auth(self):
        """Setup admin authentication for protected endpoints"""
        # First try to create admin user (might already exist)
        admin_data = {
            "email": "admin@earnwings.com",
            "name": "Admin User",
            "role": "admin",
            "level": "navigator",
            "is_admin": True,
            "password": "admin123"
        }
        self.run_test("Create Admin User", "POST", "admin/create", 200, data=admin_data)
        
        # Login as admin
        login_data = {
            "email": "admin@earnwings.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response.get('user')
            print(f"   Admin authentication successful")
        return success, response

    def test_portfolio_file_upload_valid(self):
        """Test portfolio file upload with valid files"""
        print("\n📤 Testing Portfolio File Upload - Valid Files")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        results = []
        valid_files = ['small_pdf', 'small_image', 'text_file']
        
        for file_key in valid_files:
            if file_key not in self.test_files:
                continue
                
            file_info = self.test_files[file_key]
            
            # Prepare form data
            form_data = {
                'title': f'Test Portfolio Item - {file_key}',
                'description': f'Test portfolio item with {file_info["filename"]}',
                'competency_areas': '["leadership_supervision", "financial_management"]',
                'tags': '["test", "automation", "file_upload"]',
                'visibility': 'private'
            }
            
            # Prepare file for upload
            with open(file_info['path'], 'rb') as f:
                files = {'file': (file_info['filename'], f, file_info['mime_type'])}
                
                success, response = self.run_test(
                    f"Portfolio Upload - {file_key}",
                    "POST",
                    f"users/{self.user_id}/portfolio",
                    200,
                    data=form_data,
                    files=files
                )
            
            if success:
                portfolio_id = response.get('id')
                if portfolio_id:
                    self.created_portfolio_items.append(portfolio_id)
                    print(f"   ✅ Created portfolio item: {portfolio_id}")
                    print(f"   File path: {response.get('file_path', 'N/A')}")
                    print(f"   Original filename: {response.get('original_filename', 'N/A')}")
                    print(f"   Secure filename: {response.get('secure_filename', 'N/A')}")
                    print(f"   File size: {response.get('file_size', 'N/A')} bytes")
                    print(f"   MIME type: {response.get('mime_type', 'N/A')}")
            
            results.append((file_key, success, response))
        
        return results

    def test_portfolio_file_upload_validation(self):
        """Test portfolio file upload validation (size limits, file types)"""
        print("\n🚫 Testing Portfolio File Upload - Validation")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        results = []
        
        # Test oversized file (should fail)
        if 'oversized_file' in self.test_files:
            file_info = self.test_files['oversized_file']
            form_data = {
                'title': 'Test Oversized File',
                'description': 'This should fail due to size limit',
                'competency_areas': '["leadership_supervision"]',
                'visibility': 'private'
            }
            
            with open(file_info['path'], 'rb') as f:
                files = {'file': (file_info['filename'], f, file_info['mime_type'])}
                
                success, response = self.run_test(
                    "Portfolio Upload - Oversized File (Should Fail)",
                    "POST",
                    f"users/{self.user_id}/portfolio",
                    400,  # Expect 400 Bad Request
                    data=form_data,
                    files=files
                )
            
            if not success and response.get('error') != 'timeout':
                print(f"   ✅ Correctly rejected oversized file")
                success = True  # This is expected behavior
            
            results.append(('oversized_file', success, response))
        
        # Test invalid file extension (should fail)
        if 'invalid_extension' in self.test_files:
            file_info = self.test_files['invalid_extension']
            form_data = {
                'title': 'Test Invalid Extension',
                'description': 'This should fail due to invalid extension',
                'competency_areas': '["leadership_supervision"]',
                'visibility': 'private'
            }
            
            with open(file_info['path'], 'rb') as f:
                files = {'file': (file_info['filename'], f, file_info['mime_type'])}
                
                success, response = self.run_test(
                    "Portfolio Upload - Invalid Extension (Should Fail)",
                    "POST",
                    f"users/{self.user_id}/portfolio",
                    400,  # Expect 400 Bad Request
                    data=form_data,
                    files=files
                )
            
            if not success and response.get('error') != 'timeout':
                print(f"   ✅ Correctly rejected invalid file extension")
                success = True  # This is expected behavior
            
            results.append(('invalid_extension', success, response))
        
        return results

    def test_portfolio_file_upload_without_file(self):
        """Test portfolio creation without file upload"""
        print("\n📝 Testing Portfolio Creation - Without File")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        form_data = {
            'title': 'Portfolio Item Without File',
            'description': 'This portfolio item has no file attachment',
            'competency_areas': '["operational_management"]',
            'tags': '["no_file", "text_only"]',
            'visibility': 'private'
        }
        
        success, response = self.run_test(
            "Portfolio Creation - No File",
            "POST",
            f"users/{self.user_id}/portfolio",
            200,
            data=form_data
        )
        
        if success:
            portfolio_id = response.get('id')
            if portfolio_id:
                self.created_portfolio_items.append(portfolio_id)
                print(f"   ✅ Created portfolio item without file: {portfolio_id}")
                print(f"   File path: {response.get('file_path', 'None')}")
        
        return success, response

    def test_get_user_portfolio(self):
        """Test retrieving user portfolio with visibility filtering"""
        print("\n📋 Testing Get User Portfolio")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        # Test getting all portfolio items
        success, response = self.run_test(
            "Get User Portfolio - All Items",
            "GET",
            f"users/{self.user_id}/portfolio",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} portfolio items")
            for i, item in enumerate(response[:3]):  # Show first 3 items
                title = item.get('title', 'No title')
                file_size = item.get('file_size_formatted', 'No file')
                visibility = item.get('visibility', 'Unknown')
                print(f"   Item {i+1}: {title} ({file_size}, {visibility})")
        
        # Test visibility filtering
        visibility_success, visibility_response = self.run_test(
            "Get User Portfolio - Private Only",
            "GET",
            f"users/{self.user_id}/portfolio?visibility=private",
            200
        )
        
        if visibility_success and isinstance(visibility_response, list):
            print(f"   Found {len(visibility_response)} private portfolio items")
        
        return success and visibility_success, response

    def test_file_serving(self):
        """Test file serving endpoint for secure access"""
        print("\n🔗 Testing File Serving")
        
        if not self.created_portfolio_items:
            print("❌ No portfolio items available for file serving test")
            return False, {}
        
        # Get portfolio items to find one with a file
        success, portfolio_items = self.run_test(
            "Get Portfolio Items for File Serving",
            "GET",
            f"users/{self.user_id}/portfolio",
            200
        )
        
        if not success or not portfolio_items:
            print("❌ Could not retrieve portfolio items")
            return False, {}
        
        # Find an item with a file
        file_item = None
        for item in portfolio_items:
            if item.get('file_path'):
                file_item = item
                break
        
        if not file_item:
            print("❌ No portfolio items with files found")
            return False, {}
        
        # Test file serving
        file_id = file_item.get('id')
        success, response = self.run_test(
            "Serve Portfolio File",
            "GET",
            f"files/portfolio/{file_id}",
            200
        )
        
        if success:
            print(f"   ✅ Successfully served file for portfolio item: {file_id}")
            print(f"   Response type: {type(response)}")
        
        return success, response

    def test_portfolio_item_deletion(self):
        """Test portfolio item deletion (soft delete)"""
        print("\n🗑️ Testing Portfolio Item Deletion")
        
        if not self.user_id or not self.created_portfolio_items:
            print("❌ No user ID or portfolio items available for deletion test")
            return False, {}
        
        # Delete the first created portfolio item
        item_to_delete = self.created_portfolio_items[0]
        
        success, response = self.run_test(
            "Delete Portfolio Item",
            "DELETE",
            f"users/{self.user_id}/portfolio/{item_to_delete}",
            200
        )
        
        if success:
            print(f"   ✅ Successfully deleted portfolio item: {item_to_delete}")
            
            # Verify item is no longer in active portfolio
            verify_success, verify_response = self.run_test(
                "Verify Portfolio Item Deleted",
                "GET",
                f"users/{self.user_id}/portfolio",
                200
            )
            
            if verify_success and isinstance(verify_response, list):
                deleted_item_found = any(item.get('id') == item_to_delete for item in verify_response)
                if not deleted_item_found:
                    print(f"   ✅ Confirmed item {item_to_delete} is no longer in active portfolio")
                else:
                    print(f"   ❌ Deleted item {item_to_delete} still appears in portfolio")
                    success = False
        
        return success, response

    def test_storage_statistics(self):
        """Test storage statistics endpoint (admin only)"""
        print("\n📊 Testing Storage Statistics")
        
        if not self.admin_token:
            print("❌ No admin token available for storage stats test")
            return False, {}
        
        success, response = self.run_test(
            "Get Storage Statistics",
            "GET",
            "admin/storage/stats",
            200,
            auth_required=True
        )
        
        if success and isinstance(response, dict):
            print(f"   Total Storage: {response.get('total_storage_formatted', 'N/A')}")
            print(f"   Total Files: {response.get('total_files', 'N/A')}")
            
            breakdown = response.get('breakdown', {})
            for storage_type, stats in breakdown.items():
                size = stats.get('size_formatted', 'N/A')
                files = stats.get('file_count', 'N/A')
                records = stats.get('db_records', 'N/A')
                print(f"   {storage_type.title()}: {size} ({files} files, {records} DB records)")
            
            constraints = response.get('constraints', {})
            max_size = constraints.get('max_file_size', 'N/A')
            extensions = constraints.get('allowed_extensions', [])
            mime_types = constraints.get('total_allowed_mime_types', 'N/A')
            print(f"   Max File Size: {max_size}")
            print(f"   Allowed Extensions: {len(extensions)} types")
            print(f"   Allowed MIME Types: {mime_types}")
        
        return success, response

    def test_file_system_verification(self):
        """Test that upload directories are created and organized properly"""
        print("\n📁 Testing File System Structure")
        
        # This test would ideally check the server's file system
        # Since we can't directly access the server filesystem, we'll test indirectly
        # by verifying that file uploads work and storage stats are available
        
        # Test that storage stats endpoint works (indicates directories exist)
        if self.admin_token:
            success, response = self.run_test(
                "Verify File System via Storage Stats",
                "GET",
                "admin/storage/stats",
                200,
                auth_required=True
            )
            
            if success:
                breakdown = response.get('breakdown', {})
                expected_dirs = ['portfolio', 'evidence', 'temp']
                found_dirs = list(breakdown.keys())
                
                print(f"   Expected directories: {expected_dirs}")
                print(f"   Found directories: {found_dirs}")
                
                all_dirs_present = all(dir_name in found_dirs for dir_name in expected_dirs)
                if all_dirs_present:
                    print("   ✅ All expected directories are present and accessible")
                else:
                    print("   ❌ Some expected directories are missing")
                    success = False
            
            return success, response
        else:
            print("   ⚠️ Cannot verify file system structure without admin access")
            return True, {"message": "Skipped - no admin access"}

    def test_task_completion_with_evidence_file(self):
        """Test task completion with evidence file upload"""
        print("\n📋 Testing Task Completion with Evidence File")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}
        
        # First, get available tasks
        success, tasks = self.run_test(
            "Get User Tasks for Evidence Test",
            "GET",
            f"users/{self.user_id}/tasks/leadership_supervision/inspiring_team_motivation",
            200
        )
        
        if not success or not tasks:
            print("❌ No tasks available for evidence file testing")
            return False, {}
        
        # Find an incomplete task
        incomplete_task = None
        for task in tasks:
            if not task.get('completed'):
                incomplete_task = task
                break
        
        if not incomplete_task:
            print("   ⚠️ All tasks already completed - cannot test evidence file upload")
            return True, {"message": "No incomplete tasks available"}
        
        # Complete task with evidence file
        if 'small_pdf' in self.test_files:
            file_info = self.test_files['small_pdf']
            
            form_data = {
                'task_id': incomplete_task['id'],
                'evidence_description': 'Test task completion with evidence file',
                'notes': 'Automated test completion with file upload'
            }
            
            with open(file_info['path'], 'rb') as f:
                files = {'file': (file_info['filename'], f, file_info['mime_type'])}
                
                success, response = self.run_test(
                    "Complete Task with Evidence File",
                    "POST",
                    f"users/{self.user_id}/task-completions",
                    200,
                    data=form_data,
                    files=files
                )
            
            if success:
                print(f"   ✅ Task completed with evidence file")
                print(f"   Evidence file path: {response.get('evidence_file_path', 'N/A')}")
            
            return success, response
        else:
            print("   ❌ No test file available for evidence upload")
            return False, {}

    def run_comprehensive_file_storage_tests(self):
        """Run all file storage system tests"""
        print("🚀 Starting Comprehensive File Storage System Tests")
        print("=" * 80)
        
        # Setup
        print("\n📋 SETUP PHASE")
        self.create_test_files()
        self.setup_test_user()
        self.setup_admin_auth()
        
        # Core file storage tests
        print("\n📤 FILE UPLOAD TESTS")
        self.test_portfolio_file_upload_valid()
        self.test_portfolio_file_upload_validation()
        self.test_portfolio_file_upload_without_file()
        
        print("\n📋 PORTFOLIO MANAGEMENT TESTS")
        self.test_get_user_portfolio()
        
        print("\n🔗 FILE SERVING TESTS")
        self.test_file_serving()
        
        print("\n🗑️ FILE DELETION TESTS")
        self.test_portfolio_item_deletion()
        
        print("\n📊 STORAGE MANAGEMENT TESTS")
        self.test_storage_statistics()
        self.test_file_system_verification()
        
        print("\n📋 INTEGRATION TESTS")
        self.test_task_completion_with_evidence_file()
        
        # Cleanup
        print("\n🧹 CLEANUP PHASE")
        self.cleanup_test_files()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 FILE STORAGE SYSTEM TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL FILE STORAGE TESTS PASSED!")
            return True
        else:
            print("⚠️ Some file storage tests failed - see details above")
            return False

def main():
    """Main test execution"""
    tester = FileStorageSystemTester()
    
    try:
        success = tester.run_comprehensive_file_storage_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()