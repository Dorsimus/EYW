#!/usr/bin/env python3
"""
CRITICAL DOCUMENT UPLOAD FUNCTIONALITY INVESTIGATION
Testing specific endpoints mentioned in the review request for document upload failure
"""

import requests
import sys
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path

class DocumentUploadInvestigator:
    def __init__(self, base_url="https://prelaunch-check.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_user_id = "demo-user-123"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def create_test_document(self, filename="test_document.pdf", content_type="application/pdf"):
        """Create a test document file"""
        # Create PDF-like content (simplified)
        if filename.endswith('.pdf'):
            content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        else:
            content = f"""
NAVIGATOR LEVEL DOCUMENT UPLOAD TEST
===================================

Test Document: {filename}
Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
User: {self.test_user_id}

This is a test document for verifying document upload functionality
in the Navigator Level Leadership & Development platform.

DOCUMENT PURPOSE:
- Test file upload endpoints
- Verify portfolio integration
- Check database persistence
- Validate file storage system

EXPECTED BEHAVIOR:
1. Document should upload successfully
2. Portfolio item should be created
3. Document should appear in Portfolio tab
4. Database record should be created
5. File should be stored securely

This document serves as evidence for testing the critical
document upload functionality reported as failing by users.
            """.encode('utf-8')
        
        temp_file = tempfile.NamedTemporaryFile(mode='wb', suffix=f'.{filename.split(".")[-1]}', delete=False)
        temp_file.write(content)
        temp_file.close()
        return temp_file.name

    def test_portfolio_endpoint_direct(self):
        """Test POST /api/portfolio endpoint directly"""
        print("\n" + "="*60)
        print("📤 DIRECT PORTFOLIO ENDPOINT TEST")
        print("="*60)
        
        # Create test document
        test_file_path = self.create_test_document("evidence_document.pdf")
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {
                    'file': ('evidence_document.pdf', f, 'application/pdf')
                }
                
                data = {
                    'title': 'Test Document Upload',
                    'description': 'Testing document upload functionality as reported in user issue',
                    'competency_areas': json.dumps(['leadership_supervision']),
                    'tags': json.dumps(['test', 'document-upload', 'evidence']),
                    'visibility': 'private'
                }
                
                print(f"🔍 Testing POST /api/portfolio...")
                print(f"   URL: {self.api_url}/portfolio")
                print(f"   File: evidence_document.pdf")
                print(f"   Data: {data}")
                
                try:
                    response = requests.post(f"{self.api_url}/portfolio", data=data, files=files)
                    print(f"   Status: {response.status_code}")
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        print(f"   ✅ SUCCESS: Portfolio item created")
                        print(f"   📄 Title: {response_data.get('title')}")
                        print(f"   🆔 ID: {response_data.get('id')}")
                        print(f"   📁 File Path: {response_data.get('file_path')}")
                        self.log_test("POST /api/portfolio", True, "", response_data)
                        return True
                    else:
                        try:
                            error_data = response.json()
                            print(f"   ❌ ERROR: {error_data}")
                        except:
                            print(f"   ❌ ERROR: {response.text}")
                        self.log_test("POST /api/portfolio", False, f"Status {response.status_code}")
                        return False
                        
                except Exception as e:
                    print(f"   ❌ REQUEST FAILED: {str(e)}")
                    self.log_test("POST /api/portfolio", False, f"Request failed: {str(e)}")
                    return False
                    
        finally:
            # Clean up
            try:
                os.unlink(test_file_path)
            except:
                pass

    def test_task_completion_with_evidence(self):
        """Test POST /api/users/{user_id}/tasks/{task_id}/complete with file attachment"""
        print("\n" + "="*60)
        print("📋 TASK COMPLETION WITH EVIDENCE UPLOAD")
        print("="*60)
        
        # First get available tasks
        try:
            response = requests.get(f"{self.api_url}/users/{self.test_user_id}/tasks")
            if response.status_code == 200:
                tasks = response.json()
                # Find a task that's not completed
                incomplete_tasks = [task for task in tasks if not task.get('completed', False)]
                if not incomplete_tasks:
                    print("   ⚠️ No incomplete tasks found for testing")
                    self.log_test("Task Completion with Evidence", False, "No incomplete tasks available")
                    return False
                
                test_task = incomplete_tasks[0]
                task_id = test_task['id']
                print(f"   📋 Testing with task: {test_task['title']}")
                print(f"   🆔 Task ID: {task_id}")
                
        except Exception as e:
            print(f"   ❌ Failed to get tasks: {str(e)}")
            self.log_test("Task Completion with Evidence", False, f"Failed to get tasks: {str(e)}")
            return False
        
        # Create evidence document
        test_file_path = self.create_test_document("evidence_document.pdf")
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {
                    'file': ('evidence_document.pdf', f, 'application/pdf')
                }
                
                data = {
                    'notes': 'Task completed with evidence document attachment. This tests the document upload functionality for task completion workflow.',
                    'evidence_description': 'PDF document containing evidence of task completion including detailed analysis and supporting materials.'
                }
                
                print(f"🔍 Testing POST /api/users/{self.test_user_id}/tasks/{task_id}/complete...")
                print(f"   URL: {self.api_url}/users/{self.test_user_id}/tasks/{task_id}/complete")
                print(f"   File: evidence_document.pdf")
                
                try:
                    response = requests.post(f"{self.api_url}/users/{self.test_user_id}/tasks/{task_id}/complete", 
                                           data=data, files=files)
                    print(f"   Status: {response.status_code}")
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        print(f"   ✅ SUCCESS: Task completed with evidence")
                        print(f"   📄 Completion ID: {response_data.get('completion', {}).get('id')}")
                        print(f"   📁 Evidence File: {response_data.get('completion', {}).get('evidence_file_path')}")
                        print(f"   🎯 Flightbook Entry: {response_data.get('flightbook_entry_created', False)}")
                        self.log_test("Task Completion with Evidence", True, "", response_data)
                        return True
                    else:
                        try:
                            error_data = response.json()
                            print(f"   ❌ ERROR: {error_data}")
                        except:
                            print(f"   ❌ ERROR: {response.text}")
                        self.log_test("Task Completion with Evidence", False, f"Status {response.status_code}")
                        return False
                        
                except Exception as e:
                    print(f"   ❌ REQUEST FAILED: {str(e)}")
                    self.log_test("Task Completion with Evidence", False, f"Request failed: {str(e)}")
                    return False
                    
        finally:
            # Clean up
            try:
                os.unlink(test_file_path)
            except:
                pass

    def test_portfolio_retrieval_endpoints(self):
        """Test portfolio retrieval endpoints"""
        print("\n" + "="*60)
        print("📋 PORTFOLIO RETRIEVAL ENDPOINTS")
        print("="*60)
        
        endpoints = [
            f"users/{self.test_user_id}/portfolio",
            "portfolio"
        ]
        
        all_success = True
        
        for endpoint in endpoints:
            print(f"🔍 Testing GET /api/{endpoint}...")
            print(f"   URL: {self.api_url}/{endpoint}")
            
            try:
                response = requests.get(f"{self.api_url}/{endpoint}")
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"   ✅ SUCCESS: Found {len(data)} portfolio items")
                        
                        # Check for document uploads
                        doc_items = [item for item in data if item.get('file_path')]
                        print(f"   📄 Items with files: {len(doc_items)}")
                        
                        if doc_items:
                            for item in doc_items[:3]:  # Show first 3
                                print(f"     - {item.get('title')} ({item.get('file_size', 0)} bytes)")
                        
                        self.log_test(f"GET /api/{endpoint}", True, "", data)
                    except:
                        print(f"   ❌ Invalid JSON response")
                        self.log_test(f"GET /api/{endpoint}", False, "Invalid JSON response")
                        all_success = False
                else:
                    try:
                        error_data = response.json()
                        print(f"   ❌ ERROR: {error_data}")
                    except:
                        print(f"   ❌ ERROR: {response.text}")
                    self.log_test(f"GET /api/{endpoint}", False, f"Status {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                print(f"   ❌ REQUEST FAILED: {str(e)}")
                self.log_test(f"GET /api/{endpoint}", False, f"Request failed: {str(e)}")
                all_success = False
        
        return all_success

    def test_file_upload_validation(self):
        """Test file upload validation and security"""
        print("\n" + "="*60)
        print("🔒 FILE UPLOAD VALIDATION & SECURITY")
        print("="*60)
        
        test_cases = [
            ("Valid PDF", "test.pdf", "application/pdf", True),
            ("Valid DOC", "test.doc", "application/msword", True),
            ("Valid DOCX", "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", True),
            ("Invalid EXE", "test.exe", "application/octet-stream", False),
            ("Invalid JS", "test.js", "application/javascript", False),
        ]
        
        all_passed = True
        
        for test_name, filename, content_type, should_succeed in test_cases:
            print(f"🔍 Testing {test_name} ({filename})...")
            
            # Create test file
            test_file_path = self.create_test_document(filename, content_type)
            
            try:
                with open(test_file_path, 'rb') as f:
                    files = {
                        'file': (filename, f, content_type)
                    }
                    
                    data = {
                        'title': f'Test {test_name}',
                        'description': f'Testing file validation for {filename}',
                        'competency_areas': json.dumps(['leadership_supervision']),
                        'tags': json.dumps(['test', 'validation']),
                        'visibility': 'private'
                    }
                    
                    try:
                        response = requests.post(f"{self.api_url}/users/{self.test_user_id}/portfolio", 
                                               data=data, files=files)
                        
                        success = (response.status_code == 200) == should_succeed
                        
                        if success:
                            if should_succeed:
                                print(f"   ✅ PASS: File accepted as expected")
                            else:
                                print(f"   ✅ PASS: File rejected as expected (Status: {response.status_code})")
                        else:
                            if should_succeed:
                                print(f"   ❌ FAIL: Valid file rejected (Status: {response.status_code})")
                            else:
                                print(f"   ❌ FAIL: Invalid file accepted (Status: {response.status_code})")
                            all_passed = False
                        
                        self.log_test(f"File Validation - {test_name}", success, 
                                    f"Expected {'accept' if should_succeed else 'reject'}, got status {response.status_code}")
                        
                    except Exception as e:
                        print(f"   ❌ REQUEST FAILED: {str(e)}")
                        self.log_test(f"File Validation - {test_name}", False, f"Request failed: {str(e)}")
                        all_passed = False
                        
            finally:
                # Clean up
                try:
                    os.unlink(test_file_path)
                except:
                    pass
        
        return all_passed

    def test_database_persistence(self):
        """Test database persistence of uploaded documents"""
        print("\n" + "="*60)
        print("🗄️ DATABASE PERSISTENCE VERIFICATION")
        print("="*60)
        
        # Get current portfolio items
        try:
            response = requests.get(f"{self.api_url}/users/{self.test_user_id}/portfolio")
            if response.status_code == 200:
                portfolio_items = response.json()
                print(f"   📊 Current portfolio items: {len(portfolio_items)}")
                
                # Check for items with files
                items_with_files = [item for item in portfolio_items if item.get('file_path')]
                print(f"   📄 Items with uploaded files: {len(items_with_files)}")
                
                if items_with_files:
                    print("   📋 File upload details:")
                    for item in items_with_files:
                        print(f"     - {item.get('title')}")
                        print(f"       File: {item.get('original_filename')} ({item.get('file_size', 0)} bytes)")
                        print(f"       Path: {item.get('file_path')}")
                        print(f"       Upload Date: {item.get('upload_date')}")
                        print(f"       Competencies: {item.get('competency_areas', [])}")
                    
                    self.log_test("Database Persistence", True, f"Found {len(items_with_files)} items with files")
                    return True
                else:
                    print("   ⚠️ No items with uploaded files found")
                    self.log_test("Database Persistence", False, "No items with uploaded files found")
                    return False
            else:
                print(f"   ❌ Failed to retrieve portfolio: Status {response.status_code}")
                self.log_test("Database Persistence", False, f"Failed to retrieve portfolio: Status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Database check failed: {str(e)}")
            self.log_test("Database Persistence", False, f"Database check failed: {str(e)}")
            return False

    def run_comprehensive_investigation(self):
        """Run comprehensive document upload investigation"""
        print("🚨 CRITICAL DOCUMENT UPLOAD FUNCTIONALITY INVESTIGATION")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print(f"Test User ID: {self.test_user_id}")
        print("=" * 80)
        print("USER REPORTED ISSUES:")
        print("❌ No success message shown")
        print("❌ No indication of document attaching to task")
        print("❌ Document did not appear in Portfolio tab")
        print("❌ No database integration working")
        print("=" * 80)
        
        # Test sequence
        tests = [
            ("Direct Portfolio Endpoint", self.test_portfolio_endpoint_direct),
            ("Task Completion with Evidence", self.test_task_completion_with_evidence),
            ("Portfolio Retrieval Endpoints", self.test_portfolio_retrieval_endpoints),
            ("File Upload Validation", self.test_file_upload_validation),
            ("Database Persistence", self.test_database_persistence),
        ]
        
        for test_name, test_func in tests:
            try:
                print(f"\n{'='*20} {test_name.upper()} {'='*20}")
                result = test_func()
                if not result:
                    print(f"\n⚠️ {test_name} failed - continuing with remaining tests")
            except Exception as e:
                print(f"\n❌ {test_name} crashed: {str(e)}")
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        # Print final results
        self.print_investigation_results()
        
        return self.tests_passed == self.tests_run

    def print_investigation_results(self):
        """Print investigation results"""
        print("\n" + "=" * 80)
        print("🔍 DOCUMENT UPLOAD INVESTIGATION RESULTS")
        print("=" * 80)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "0%")
        
        print("\n📋 DETAILED RESULTS:")
        print("-" * 80)
        
        for result in self.test_results:
            status = "✅ WORKING" if result['success'] else "❌ BROKEN"
            print(f"{status} | {result['test']}")
            if not result['success'] and result['details']:
                print(f"      Issue: {result['details']}")
        
        print("\n🎯 CRITICAL FINDINGS:")
        print("-" * 80)
        
        # Analyze results for user-reported issues
        portfolio_creation_working = any(r['success'] for r in self.test_results if 'portfolio' in r['test'].lower() and 'POST' in r['test'])
        portfolio_retrieval_working = any(r['success'] for r in self.test_results if 'portfolio' in r['test'].lower() and 'GET' in r['test'])
        database_working = any(r['success'] for r in self.test_results if 'database' in r['test'].lower() or 'persistence' in r['test'].lower())
        task_completion_working = any(r['success'] for r in self.test_results if 'task completion' in r['test'].lower())
        
        print(f"✅ Document Upload to Portfolio: {'WORKING' if portfolio_creation_working else 'BROKEN'}")
        print(f"✅ Portfolio Retrieval: {'WORKING' if portfolio_retrieval_working else 'BROKEN'}")
        print(f"✅ Database Integration: {'WORKING' if database_working else 'BROKEN'}")
        print(f"✅ Task Completion with Evidence: {'WORKING' if task_completion_working else 'BROKEN'}")
        
        print("\n🚨 USER ISSUE ANALYSIS:")
        print("-" * 80)
        
        if portfolio_creation_working and portfolio_retrieval_working and database_working:
            print("✅ DOCUMENT UPLOAD FUNCTIONALITY IS WORKING CORRECTLY")
            print("   - Files can be uploaded to portfolio")
            print("   - Documents appear in Portfolio tab")
            print("   - Database integration is functional")
            print("   - User issue may be related to frontend UI or user workflow")
        else:
            print("❌ DOCUMENT UPLOAD FUNCTIONALITY HAS ISSUES")
            if not portfolio_creation_working:
                print("   - Portfolio creation endpoint not working")
            if not portfolio_retrieval_working:
                print("   - Portfolio retrieval endpoint not working")
            if not database_working:
                print("   - Database integration not working")
            if not task_completion_working:
                print("   - Task completion with evidence not working")

def main():
    """Main investigation execution"""
    investigator = DocumentUploadInvestigator()
    
    try:
        success = investigator.run_comprehensive_investigation()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⏹️ Investigation interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Investigation failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())