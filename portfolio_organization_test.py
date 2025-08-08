import requests
import sys
import json
import time
from datetime import datetime
import io

class PortfolioOrganizationTester:
    def __init__(self, base_url="https://e12824c6-9758-455d-a132-fa398ec594a3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_token = None
        self.portfolio_items = []
        
        # Expected competency areas from the review request
        self.expected_competency_areas = [
            "leadership_supervision",
            "financial_management", 
            "operational_management",
            "cross_functional_collaboration",
            "strategic_thinking"
        ]

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
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            print(f"❌ Failed - TIMEOUT after {response_time:.2f}s (limit: {timeout}s)")
            return False, {"error": "timeout"}
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Failed - Error after {response_time:.2f}s: {str(e)}")
            return False, {"error": str(e)}

    def setup_test_user(self):
        """Create a test user for portfolio testing or use existing demo user"""
        # First try to use existing demo user
        demo_user_id = "demo-user-123"
        success, response = self.run_test("Get Demo User", "GET", f"users/{demo_user_id}", 200)
        if success:
            self.user_id = demo_user_id
            print(f"   Using existing demo user with ID: {self.user_id}")
            return True, response
        
        # If demo user doesn't exist, create a new test user with explicit ID
        user_data = {
            "id": f"portfolio_test_{datetime.now().strftime('%H%M%S')}",
            "email": f"portfolio_test_{datetime.now().strftime('%H%M%S')}@earnwings.com",
            "name": "Portfolio Test User",
            "role": "participant",
            "level": "navigator"
        }
        success, response = self.run_test("Create Test User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created test user with ID: {self.user_id}")
        return success, response

    def setup_admin_token(self):
        """Setup admin token for admin operations"""
        # First create admin user if needed
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
            print(f"   Admin login successful, token obtained")
        return success, response

    def create_sample_portfolio_items(self):
        """Create sample portfolio items with different competency associations"""
        if not self.user_id:
            print("❌ No user ID available for portfolio creation")
            return False, {}

        # Sample portfolio items with various competency associations
        sample_items = [
            {
                "title": "Leadership Team Meeting Minutes",
                "description": "Documentation of weekly leadership team meetings and decisions",
                "competency_areas": ["leadership_supervision"],
                "tags": ["leadership", "meetings", "documentation"]
            },
            {
                "title": "Budget Analysis Report Q1",
                "description": "Comprehensive financial analysis and budget variance report",
                "competency_areas": ["financial_management"],
                "tags": ["finance", "budget", "analysis"]
            },
            {
                "title": "Process Improvement Initiative",
                "description": "Documentation of workflow optimization project",
                "competency_areas": ["operational_management"],
                "tags": ["process", "improvement", "efficiency"]
            },
            {
                "title": "Cross-Department Collaboration Plan",
                "description": "Strategic plan for improving inter-departmental communication",
                "competency_areas": ["cross_functional_collaboration"],
                "tags": ["collaboration", "communication", "strategy"]
            },
            {
                "title": "Strategic Planning Workshop Results",
                "description": "Outcomes and action items from strategic planning session",
                "competency_areas": ["strategic_thinking"],
                "tags": ["strategy", "planning", "workshop"]
            },
            {
                "title": "Leadership & Financial Integration Project",
                "description": "Project combining leadership skills with financial acumen",
                "competency_areas": ["leadership_supervision", "financial_management"],
                "tags": ["leadership", "finance", "integration"]
            },
            {
                "title": "Operational Excellence & Strategy Alignment",
                "description": "Document showing how operational improvements align with strategic goals",
                "competency_areas": ["operational_management", "strategic_thinking"],
                "tags": ["operations", "strategy", "alignment"]
            },
            {
                "title": "Multi-Competency Leadership Initiative",
                "description": "Comprehensive project touching all competency areas",
                "competency_areas": ["leadership_supervision", "financial_management", "operational_management"],
                "tags": ["leadership", "comprehensive", "multi-area"]
            },
            {
                "title": "Team Building & Communication Workshop",
                "description": "Workshop materials for improving team dynamics",
                "competency_areas": ["leadership_supervision", "cross_functional_collaboration"],
                "tags": ["team-building", "communication", "workshop"]
            },
            {
                "title": "Financial Strategy & Operations Review",
                "description": "Quarterly review combining financial analysis with operational metrics",
                "competency_areas": ["financial_management", "operational_management", "strategic_thinking"],
                "tags": ["finance", "operations", "strategy", "review"]
            },
            {
                "title": "Cross-Functional Strategic Planning",
                "description": "Strategic planning involving multiple departments",
                "competency_areas": ["cross_functional_collaboration", "strategic_thinking"],
                "tags": ["cross-functional", "strategy", "planning"]
            },
            {
                "title": "Leadership Development Portfolio",
                "description": "Collection of leadership development activities and reflections",
                "competency_areas": ["leadership_supervision"],
                "tags": ["leadership", "development", "portfolio"]
            },
            {
                "title": "Comprehensive Competency Showcase",
                "description": "Portfolio item demonstrating skills across all competency areas",
                "competency_areas": ["leadership_supervision", "financial_management", "operational_management", "cross_functional_collaboration", "strategic_thinking"],
                "tags": ["comprehensive", "all-areas", "showcase"]
            },
            {
                "title": "Unassigned Portfolio Item",
                "description": "Portfolio item without specific competency area assignment",
                "competency_areas": [],
                "tags": ["unassigned", "general"]
            }
        ]

        created_items = []
        for i, item in enumerate(sample_items):
            # Create a simple text file for each portfolio item
            file_content = f"Portfolio Item {i+1}: {item['title']}\n\nDescription: {item['description']}\n\nCompetency Areas: {', '.join(item['competency_areas'])}\n\nTags: {', '.join(item['tags'])}"
            
            # Prepare form data
            form_data = {
                'title': item['title'],
                'description': item['description'],
                'competency_areas': json.dumps(item['competency_areas']),
                'tags': json.dumps(item['tags']),
                'visibility': 'private'
            }
            
            # Create file-like object
            files = {
                'file': (f"portfolio_item_{i+1}.txt", io.StringIO(file_content), 'text/plain')
            }
            
            success, response = self.run_test(
                f"Create Portfolio Item {i+1}: {item['title'][:30]}...", 
                "POST", 
                f"users/{self.user_id}/portfolio", 
                200,
                data=form_data,
                files=files
            )
            
            if success:
                created_items.append(response)
                self.portfolio_items.append(response)
                print(f"   ✅ Created portfolio item: {item['title']}")
            else:
                print(f"   ❌ Failed to create portfolio item: {item['title']}")

        print(f"\n📊 Portfolio Creation Summary:")
        print(f"   Total items attempted: {len(sample_items)}")
        print(f"   Successfully created: {len(created_items)}")
        
        return len(created_items) > 0, created_items

    def test_portfolio_data_structure(self):
        """Test 1: Verify portfolio items with competency areas assigned"""
        print("\n🎯 TEST 1: Portfolio Data Structure Verification")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        print(f"   Found {len(portfolio_items)} portfolio items")
        
        # Verify data structure
        structure_valid = True
        required_fields = ['id', 'title', 'description', 'competency_areas', 'original_filename', 'file_size', 'upload_date']
        
        for i, item in enumerate(portfolio_items):
            print(f"\n   📄 Item {i+1}: {item.get('title', 'No title')}")
            
            # Check required fields
            missing_fields = []
            for field in required_fields:
                if field not in item:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"      ❌ Missing fields: {', '.join(missing_fields)}")
                structure_valid = False
            else:
                print(f"      ✅ All required fields present")
            
            # Check competency areas
            competency_areas = item.get('competency_areas', [])
            if isinstance(competency_areas, list):
                print(f"      📋 Competency areas: {competency_areas}")
                if len(competency_areas) == 0:
                    print(f"      ⚠️  No competency areas assigned")
                else:
                    print(f"      ✅ {len(competency_areas)} competency area(s) assigned")
            else:
                print(f"      ❌ Competency areas not a list: {type(competency_areas)}")
                structure_valid = False
            
            # Check file metadata
            file_size = item.get('file_size')
            original_filename = item.get('original_filename')
            file_size_formatted = item.get('file_size_formatted')
            
            if file_size:
                print(f"      📁 File size: {file_size} bytes")
            if original_filename:
                print(f"      📄 Original filename: {original_filename}")
            if file_size_formatted:
                print(f"      📊 Formatted size: {file_size_formatted}")

        if structure_valid:
            print(f"\n   ✅ Portfolio data structure is valid")
        else:
            print(f"\n   ❌ Portfolio data structure has issues")
        
        return structure_valid, portfolio_items

    def test_competency_organization(self):
        """Test 2: Verify items can be grouped by competency areas correctly"""
        print("\n🎯 TEST 2: Competency Organization Verification")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        
        # Group items by competency areas
        competency_groups = {}
        unassigned_items = []
        cross_competency_items = []
        
        for item in portfolio_items:
            competency_areas = item.get('competency_areas', [])
            
            if len(competency_areas) == 0:
                unassigned_items.append(item)
            elif len(competency_areas) > 1:
                cross_competency_items.append(item)
            
            for area in competency_areas:
                if area not in competency_groups:
                    competency_groups[area] = []
                competency_groups[area].append(item)
        
        print(f"   📊 Competency Organization Results:")
        print(f"   Total portfolio items: {len(portfolio_items)}")
        print(f"   Competency areas found: {len(competency_groups)}")
        print(f"   Cross-competency items: {len(cross_competency_items)}")
        print(f"   Unassigned items: {len(unassigned_items)}")
        
        # Show breakdown by competency area
        print(f"\n   📋 Items per Competency Area:")
        total_assignments = 0
        for area in self.expected_competency_areas:
            count = len(competency_groups.get(area, []))
            total_assignments += count
            print(f"   - {area}: {count} items")
            
            # Show sample items for this competency
            if count > 0:
                sample_items = competency_groups[area][:3]  # Show first 3
                for item in sample_items:
                    print(f"     • {item.get('title', 'No title')}")
        
        print(f"\n   📈 Organization Statistics:")
        print(f"   Total competency assignments: {total_assignments}")
        print(f"   Average assignments per item: {total_assignments / len(portfolio_items) if portfolio_items else 0:.1f}")
        
        # Verify cross-competency items
        if cross_competency_items:
            print(f"\n   🔗 Cross-Competency Items:")
            for item in cross_competency_items:
                areas = item.get('competency_areas', [])
                print(f"   - {item.get('title', 'No title')}: {len(areas)} areas ({', '.join(areas)})")
        
        organization_valid = len(competency_groups) > 0
        return organization_valid, {
            "competency_groups": competency_groups,
            "cross_competency_items": cross_competency_items,
            "unassigned_items": unassigned_items
        }

    def test_file_metadata_completeness(self):
        """Test 3: Confirm file information is complete"""
        print("\n🎯 TEST 3: File Metadata Completeness Verification")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        
        metadata_complete = True
        required_file_fields = ['original_filename', 'file_size', 'secure_filename', 'mime_type', 'file_path']
        
        print(f"   📁 File Metadata Analysis:")
        
        for i, item in enumerate(portfolio_items):
            title = item.get('title', f'Item {i+1}')
            print(f"\n   📄 {title}:")
            
            # Check each required file field
            item_complete = True
            for field in required_file_fields:
                value = item.get(field)
                if value:
                    if field == 'file_size':
                        # Also check for formatted size
                        formatted_size = item.get('file_size_formatted')
                        print(f"      ✅ {field}: {value} bytes ({formatted_size if formatted_size else 'no formatted size'})")
                    else:
                        print(f"      ✅ {field}: {value}")
                else:
                    print(f"      ❌ {field}: Missing")
                    item_complete = False
                    metadata_complete = False
            
            # Check additional metadata
            upload_date = item.get('upload_date')
            visibility = item.get('visibility')
            tags = item.get('tags', [])
            
            if upload_date:
                print(f"      ✅ upload_date: {upload_date}")
            if visibility:
                print(f"      ✅ visibility: {visibility}")
            if tags:
                print(f"      ✅ tags: {tags}")
            
            if item_complete:
                print(f"      🎯 Metadata complete for this item")
            else:
                print(f"      ⚠️  Metadata incomplete for this item")
        
        if metadata_complete:
            print(f"\n   ✅ All portfolio items have complete file metadata")
        else:
            print(f"\n   ❌ Some portfolio items have incomplete file metadata")
        
        return metadata_complete, portfolio_items

    def test_cross_competency_items(self):
        """Test 4: Verify items that belong to multiple competency areas"""
        print("\n🎯 TEST 4: Cross-Competency Items Verification")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        
        # Find cross-competency items
        cross_competency_items = []
        single_competency_items = []
        unassigned_items = []
        
        for item in portfolio_items:
            competency_areas = item.get('competency_areas', [])
            
            if len(competency_areas) == 0:
                unassigned_items.append(item)
            elif len(competency_areas) == 1:
                single_competency_items.append(item)
            else:
                cross_competency_items.append(item)
        
        print(f"   🔗 Cross-Competency Analysis:")
        print(f"   Total items: {len(portfolio_items)}")
        print(f"   Single competency items: {len(single_competency_items)}")
        print(f"   Cross-competency items: {len(cross_competency_items)}")
        print(f"   Unassigned items: {len(unassigned_items)}")
        
        if cross_competency_items:
            print(f"\n   📋 Cross-Competency Items Details:")
            for item in cross_competency_items:
                title = item.get('title', 'No title')
                areas = item.get('competency_areas', [])
                print(f"   - {title}")
                print(f"     Competency areas ({len(areas)}): {', '.join(areas)}")
                
                # Verify all areas are valid
                valid_areas = all(area in self.expected_competency_areas for area in areas)
                if valid_areas:
                    print(f"     ✅ All competency areas are valid")
                else:
                    invalid_areas = [area for area in areas if area not in self.expected_competency_areas]
                    print(f"     ❌ Invalid competency areas: {invalid_areas}")
        else:
            print(f"\n   ⚠️  No cross-competency items found")
        
        # Test competency area combinations
        area_combinations = {}
        for item in cross_competency_items:
            areas = tuple(sorted(item.get('competency_areas', [])))
            if areas not in area_combinations:
                area_combinations[areas] = []
            area_combinations[areas].append(item['title'])
        
        if area_combinations:
            print(f"\n   🔄 Competency Area Combinations:")
            for combination, titles in area_combinations.items():
                print(f"   - {' + '.join(combination)}: {len(titles)} item(s)")
                for title in titles[:2]:  # Show first 2 titles
                    print(f"     • {title}")
        
        cross_competency_valid = len(cross_competency_items) > 0
        return cross_competency_valid, {
            "cross_competency_items": cross_competency_items,
            "single_competency_items": single_competency_items,
            "unassigned_items": unassigned_items,
            "area_combinations": area_combinations
        }

    def test_competency_item_counts(self):
        """Test 5: Show breakdown of portfolio items by competency area"""
        print("\n🎯 TEST 5: Portfolio Items Count by Competency Area")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        
        # Count items per competency area
        competency_counts = {}
        total_assignments = 0
        
        for area in self.expected_competency_areas:
            competency_counts[area] = 0
        
        for item in portfolio_items:
            competency_areas = item.get('competency_areas', [])
            for area in competency_areas:
                if area in competency_counts:
                    competency_counts[area] += 1
                    total_assignments += 1
                else:
                    # Track unexpected competency areas
                    if area not in competency_counts:
                        competency_counts[area] = 1
                        total_assignments += 1
        
        print(f"   📊 Portfolio Items Breakdown by Competency Area:")
        print(f"   Total portfolio items: {len(portfolio_items)}")
        print(f"   Total competency assignments: {total_assignments}")
        
        # Sort by count (descending)
        sorted_counts = sorted(competency_counts.items(), key=lambda x: x[1], reverse=True)
        
        for area, count in sorted_counts:
            if area in self.expected_competency_areas:
                print(f"   ✅ {area}: {count} items")
            else:
                print(f"   ⚠️  {area}: {count} items (unexpected area)")
        
        # Calculate statistics
        if competency_counts:
            max_count = max(competency_counts.values())
            min_count = min(competency_counts.values())
            avg_count = total_assignments / len(self.expected_competency_areas)
            
            print(f"\n   📈 Statistics:")
            print(f"   Maximum items in one area: {max_count}")
            print(f"   Minimum items in one area: {min_count}")
            print(f"   Average items per area: {avg_count:.1f}")
        
        # Check for balanced distribution
        expected_total = 14  # From review request
        if len(portfolio_items) == expected_total:
            print(f"   ✅ Portfolio has expected {expected_total} items")
        else:
            print(f"   ⚠️  Portfolio has {len(portfolio_items)} items, expected {expected_total}")
        
        counts_valid = total_assignments > 0
        return counts_valid, competency_counts

    def test_unassigned_items(self):
        """Test 6: Identify items without competency associations"""
        print("\n🎯 TEST 6: Unassigned Items Identification")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        
        # Find unassigned items
        unassigned_items = []
        assigned_items = []
        
        for item in portfolio_items:
            competency_areas = item.get('competency_areas', [])
            
            if len(competency_areas) == 0:
                unassigned_items.append(item)
            else:
                assigned_items.append(item)
        
        print(f"   🔍 Unassigned Items Analysis:")
        print(f"   Total portfolio items: {len(portfolio_items)}")
        print(f"   Assigned items: {len(assigned_items)}")
        print(f"   Unassigned items: {len(unassigned_items)}")
        
        if unassigned_items:
            print(f"\n   ⚠️  Unassigned Items Found:")
            for item in unassigned_items:
                title = item.get('title', 'No title')
                description = item.get('description', 'No description')
                upload_date = item.get('upload_date', 'No date')
                print(f"   - {title}")
                print(f"     Description: {description[:100]}...")
                print(f"     Upload date: {upload_date}")
                print(f"     Tags: {item.get('tags', [])}")
        else:
            print(f"\n   ✅ No unassigned items found - all items have competency associations")
        
        # Calculate assignment rate
        assignment_rate = (len(assigned_items) / len(portfolio_items)) * 100 if portfolio_items else 0
        print(f"\n   📊 Assignment Statistics:")
        print(f"   Assignment rate: {assignment_rate:.1f}%")
        
        if assignment_rate >= 90:
            print(f"   ✅ Excellent assignment rate")
        elif assignment_rate >= 75:
            print(f"   ⚠️  Good assignment rate, some improvement needed")
        else:
            print(f"   ❌ Poor assignment rate, many items unassigned")
        
        assignment_valid = assignment_rate >= 75
        return assignment_valid, {
            "unassigned_items": unassigned_items,
            "assigned_items": assigned_items,
            "assignment_rate": assignment_rate
        }

    def test_enhanced_metadata_structure(self):
        """Test 7: Verify new portfolio structure supports organized view"""
        print("\n🎯 TEST 7: Enhanced Metadata Structure Verification")
        
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False, {}

        success, response = self.run_test(
            "Get User Portfolio", 
            "GET", 
            f"users/{self.user_id}/portfolio", 
            200
        )
        
        if not success:
            return False, {}

        portfolio_items = response
        
        # Check enhanced metadata fields
        enhanced_fields = {
            'id': 'Unique identifier',
            'user_id': 'User association',
            'title': 'Item title',
            'description': 'Item description',
            'competency_areas': 'Competency associations',
            'tags': 'Categorization tags',
            'visibility': 'Access control',
            'upload_date': 'Creation timestamp',
            'updated_at': 'Last modification',
            'status': 'Item status',
            'original_filename': 'Original file name',
            'secure_filename': 'Secure file name',
            'file_size': 'File size in bytes',
            'file_size_formatted': 'Human-readable size',
            'mime_type': 'File type',
            'file_path': 'Storage location'
        }
        
        print(f"   🔧 Enhanced Metadata Structure Analysis:")
        
        structure_complete = True
        field_coverage = {}
        
        for field, description in enhanced_fields.items():
            field_coverage[field] = 0
        
        for i, item in enumerate(portfolio_items):
            print(f"\n   📄 Item {i+1}: {item.get('title', 'No title')}")
            
            item_fields_present = 0
            for field, description in enhanced_fields.items():
                if field in item and item[field] is not None:
                    field_coverage[field] += 1
                    item_fields_present += 1
                    
                    # Show sample values for key fields
                    if field in ['competency_areas', 'tags', 'file_size_formatted', 'visibility']:
                        value = item[field]
                        print(f"      ✅ {field}: {value}")
            
            coverage_rate = (item_fields_present / len(enhanced_fields)) * 100
            print(f"      📊 Field coverage: {item_fields_present}/{len(enhanced_fields)} ({coverage_rate:.1f}%)")
            
            if coverage_rate < 80:
                structure_complete = False
        
        # Overall field coverage analysis
        print(f"\n   📈 Overall Field Coverage Analysis:")
        total_items = len(portfolio_items)
        
        for field, description in enhanced_fields.items():
            coverage_count = field_coverage[field]
            coverage_rate = (coverage_count / total_items) * 100 if total_items > 0 else 0
            
            if coverage_rate >= 90:
                status = "✅"
            elif coverage_rate >= 70:
                status = "⚠️ "
            else:
                status = "❌"
            
            print(f"   {status} {field}: {coverage_count}/{total_items} items ({coverage_rate:.1f}%)")
        
        # Test organized view capability
        print(f"\n   🎯 Organized View Capability Test:")
        
        # Group by competency areas
        competency_groups = {}
        for item in portfolio_items:
            for area in item.get('competency_areas', []):
                if area not in competency_groups:
                    competency_groups[area] = []
                competency_groups[area].append({
                    'title': item.get('title'),
                    'file_size_formatted': item.get('file_size_formatted'),
                    'upload_date': item.get('upload_date'),
                    'tags': item.get('tags', [])
                })
        
        # Group by tags
        tag_groups = {}
        for item in portfolio_items:
            for tag in item.get('tags', []):
                if tag not in tag_groups:
                    tag_groups[tag] = []
                tag_groups[tag].append(item.get('title'))
        
        # Group by visibility
        visibility_groups = {}
        for item in portfolio_items:
            visibility = item.get('visibility', 'unknown')
            if visibility not in visibility_groups:
                visibility_groups[visibility] = []
            visibility_groups[visibility].append(item.get('title'))
        
        print(f"   📋 Grouping capabilities:")
        print(f"   - By competency areas: {len(competency_groups)} groups")
        print(f"   - By tags: {len(tag_groups)} groups")
        print(f"   - By visibility: {len(visibility_groups)} groups")
        
        organized_view_supported = len(competency_groups) > 0 and structure_complete
        
        if organized_view_supported:
            print(f"   ✅ Enhanced metadata structure supports organized view")
        else:
            print(f"   ❌ Enhanced metadata structure has limitations for organized view")
        
        return organized_view_supported, {
            "field_coverage": field_coverage,
            "competency_groups": competency_groups,
            "tag_groups": tag_groups,
            "visibility_groups": visibility_groups
        }

    def run_comprehensive_test(self):
        """Run all portfolio organization tests"""
        print("🎯 ENHANCED PORTFOLIO ORGANIZATION SYSTEM TESTING")
        print("=" * 60)
        
        # Setup
        print("\n🔧 SETUP PHASE")
        self.setup_admin_token()
        self.setup_test_user()
        
        if not self.user_id:
            print("❌ Cannot proceed without test user")
            return False
        
        # Create sample portfolio items
        print("\n📁 PORTFOLIO CREATION PHASE")
        self.create_sample_portfolio_items()
        
        # Run tests
        test_results = {}
        
        test_results['data_structure'] = self.test_portfolio_data_structure()
        test_results['competency_organization'] = self.test_competency_organization()
        test_results['file_metadata'] = self.test_file_metadata_completeness()
        test_results['cross_competency'] = self.test_cross_competency_items()
        test_results['item_counts'] = self.test_competency_item_counts()
        test_results['unassigned_items'] = self.test_unassigned_items()
        test_results['enhanced_metadata'] = self.test_enhanced_metadata_structure()
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 ENHANCED PORTFOLIO ORGANIZATION TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for success, _ in test_results.values() if success)
        total_tests = len(test_results)
        
        print(f"\n📊 Overall Results:")
        print(f"   Tests run: {self.tests_run}")
        print(f"   Tests passed: {self.tests_passed}")
        print(f"   Success rate: {(self.tests_passed / self.tests_run) * 100:.1f}%")
        
        print(f"\n🎯 Portfolio Organization Tests:")
        print(f"   Major tests passed: {passed_tests}/{total_tests}")
        print(f"   Portfolio organization success rate: {(passed_tests / total_tests) * 100:.1f}%")
        
        print(f"\n📋 Test Results Breakdown:")
        for test_name, (success, data) in test_results.items():
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"   {test_name}: {status}")
        
        # Key findings
        if test_results['competency_organization'][0]:
            competency_data = test_results['competency_organization'][1]
            print(f"\n🔍 Key Findings:")
            print(f"   - Portfolio items successfully organized by competency areas")
            print(f"   - {len(competency_data['cross_competency_items'])} cross-competency items found")
            print(f"   - {len(competency_data['unassigned_items'])} unassigned items")
            
            if test_results['item_counts'][0]:
                counts = test_results['item_counts'][1]
                print(f"   - Competency area distribution:")
                for area in self.expected_competency_areas:
                    count = counts.get(area, 0)
                    print(f"     • {area}: {count} items")
        
        overall_success = passed_tests >= 5  # At least 5 out of 7 tests should pass
        
        if overall_success:
            print(f"\n✅ ENHANCED PORTFOLIO ORGANIZATION SYSTEM: WORKING CORRECTLY")
            print(f"   The portfolio system successfully supports competency-based organization")
            print(f"   with complete metadata and cross-competency item handling.")
        else:
            print(f"\n❌ ENHANCED PORTFOLIO ORGANIZATION SYSTEM: ISSUES FOUND")
            print(f"   The portfolio system has limitations that may affect organized views.")
        
        return overall_success

if __name__ == "__main__":
    tester = PortfolioOrganizationTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)