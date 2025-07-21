import requests
import sys
import json
from datetime import datetime
import uuid

class EarnYourWingsAPITester:
    def __init__(self, base_url="https://b1a7c88e-b2b4-42eb-afc5-3fd571246cd2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_competency_framework(self):
        """Test competency framework endpoint"""
        success, response = self.run_test(
            "Competency Framework",
            "GET", 
            "competencies",
            200
        )
        
        if success:
            # Verify the 5 main competency areas
            expected_areas = [
                "leadership_supervision",
                "financial_management", 
                "operational_management",
                "cross_functional",
                "strategic_thinking"
            ]
            
            for area in expected_areas:
                if area in response:
                    print(f"   ✓ Found competency area: {response[area]['name']}")
                else:
                    print(f"   ❌ Missing competency area: {area}")
                    return False
                    
            print(f"   ✓ All 5 competency areas found")
        
        return success

    def test_create_user(self):
        """Test user creation"""
        user_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Test Navigator",
            "role": "participant",
            "level": "navigator"
        }
        
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   ✓ Created user with ID: {self.test_user_id}")
        
        return success

    def test_get_user(self):
        """Test getting user by ID"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Get User",
            "GET",
            f"users/{self.test_user_id}",
            200
        )
        
        if success:
            print(f"   ✓ Retrieved user: {response.get('name', 'Unknown')}")
        
        return success

    def test_get_all_users(self):
        """Test getting all users"""
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200
        )
        
        if success:
            print(f"   ✓ Found {len(response)} users")
        
        return success

    def test_get_user_competencies(self):
        """Test getting user competencies"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Get User Competencies",
            "GET",
            f"users/{self.test_user_id}/competencies",
            200
        )
        
        if success:
            print(f"   ✓ Found {len(response)} competency areas")
            for area_key, area_data in response.items():
                print(f"     - {area_data['name']}: {area_data['overall_progress']}%")
        
        return success

    def test_update_competency(self):
        """Test updating competency progress"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        # Update a specific competency
        success, response = self.run_test(
            "Update Competency Progress",
            "PUT",
            f"users/{self.test_user_id}/competencies/leadership_supervision/team_motivation?proficiency_level=75",
            200
        )
        
        return success

    def test_create_portfolio_item_without_file(self):
        """Test creating portfolio item without file"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        portfolio_data = {
            'title': 'Test Portfolio Item',
            'description': 'This is a test portfolio item for API testing',
            'competency_areas': '["leadership_supervision", "financial_management"]',
            'tags': '["test", "api"]'
        }
        
        success, response = self.run_test(
            "Create Portfolio Item (No File)",
            "POST",
            f"users/{self.test_user_id}/portfolio",
            200,
            data=portfolio_data
        )
        
        if success:
            print(f"   ✓ Created portfolio item: {response.get('title', 'Unknown')}")
        
        return success

    def test_create_portfolio_item_with_file(self):
        """Test creating portfolio item with file"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        # Create a simple test file
        test_content = "This is a test document for portfolio upload testing."
        
        portfolio_data = {
            'title': 'Test Portfolio with File',
            'description': 'This portfolio item includes a test file upload',
            'competency_areas': '["operational_management"]',
            'tags': '["test", "file-upload"]'
        }
        
        files = {
            'file': ('test_document.txt', test_content, 'text/plain')
        }
        
        success, response = self.run_test(
            "Create Portfolio Item (With File)",
            "POST",
            f"users/{self.test_user_id}/portfolio",
            200,
            data=portfolio_data,
            files=files
        )
        
        if success:
            print(f"   ✓ Created portfolio item with file: {response.get('title', 'Unknown')}")
            if response.get('file_path'):
                print(f"     File saved to: {response['file_path']}")
        
        return success

    def test_get_user_portfolio(self):
        """Test getting user portfolio"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Get User Portfolio",
            "GET",
            f"users/{self.test_user_id}/portfolio",
            200
        )
        
        if success:
            print(f"   ✓ Found {len(response)} portfolio items")
            for item in response:
                print(f"     - {item['title']} ({len(item['competency_areas'])} competencies)")
        
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Earn Your Wings Platform API Tests")
        print(f"Testing against: {self.api_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_competency_framework,
            self.test_create_user,
            self.test_get_user,
            self.test_get_all_users,
            self.test_get_user_competencies,
            self.test_update_competency,
            self.test_create_portfolio_item_without_file,
            self.test_create_portfolio_item_with_file,
            self.test_get_user_portfolio
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
        
        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! API is working correctly.")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed.")
            return 1

def main():
    tester = EarnYourWingsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())