#!/usr/bin/env python3
"""
AI-Powered Learning Analytics Backend Testing
Test the newly implemented AI integration endpoints
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from environment
BACKEND_URL = "https://6c89303b-3b46-458e-8c48-ff40dea979ca.preview.emergentagent.com/api"

class AIAnalyticsTestSuite:
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

    def test_ai_health_check(self):
        """Test AI Health Check Endpoint"""
        print("🏥 Testing AI Health Check Endpoint...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/ai/health")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ["status", "ai_response", "timestamp"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "AI Health Check - Response Structure",
                        False,
                        f"Missing required fields: {missing_fields}",
                        response_time
                    )
                    return False
                
                # Check if AI service is healthy
                if data["status"] == "healthy":
                    self.log_test(
                        "AI Health Check - Service Status",
                        True,
                        f"AI service is healthy. Response: '{data['ai_response']}'",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "AI Health Check - Service Status",
                        False,
                        f"AI service unhealthy: {data.get('error', 'Unknown error')}",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "AI Health Check - HTTP Status",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "AI Health Check - Connection",
                False,
                f"Connection error: {str(e)}",
                0
            )
            return False

    def test_ai_analysis_new_user(self):
        """Test AI Analysis with empty flightbook entries (new user scenario)"""
        print("🆕 Testing AI Analysis - New User Scenario...")
        
        try:
            # Sample data for new user with no flightbook entries
            request_data = {
                "user_id": "test-new-user-001",
                "flightbook_entries": [],
                "task_progress": {
                    "leadership_supervision": {"completed": 0, "total": 4},
                    "financial_management": {"completed": 0, "total": 4},
                    "operational_management": {"completed": 0, "total": 4},
                    "cross_functional_collaboration": {"completed": 0, "total": 4},
                    "strategic_thinking": {"completed": 0, "total": 4}
                },
                "competencies": {
                    "leadership_supervision": {"progress": 0},
                    "financial_management": {"progress": 0},
                    "operational_management": {"progress": 0},
                    "cross_functional_collaboration": {"progress": 0},
                    "strategic_thinking": {"progress": 0}
                },
                "portfolio": []
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                success = self.validate_ai_response_structure(data)
                
                if success:
                    # Check specific new user recommendations
                    recommendations = data.get("recommendations", [])
                    has_beginner_recs = any(
                        "start" in rec.get("title", "").lower() or 
                        "begin" in rec.get("description", "").lower()
                        for rec in recommendations
                    )
                    
                    self.log_test(
                        "AI Analysis - New User Scenario",
                        True,
                        f"Valid response with {len(recommendations)} recommendations. "
                        f"Beginner-friendly: {has_beginner_recs}. "
                        f"Engagement level: {data['content_analysis']['engagement_level']}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "AI Analysis - New User Response Structure",
                        False,
                        "Invalid response structure for new user scenario",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "AI Analysis - New User HTTP Status",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "AI Analysis - New User Connection",
                False,
                f"Connection error: {str(e)}",
                0
            )
            return False

    def test_ai_analysis_experienced_user(self):
        """Test AI Analysis with sample flightbook entries and progress"""
        print("👨‍💼 Testing AI Analysis - Experienced User Scenario...")
        
        try:
            # Sample data for experienced user with flightbook entries
            request_data = {
                "user_id": "test-experienced-user-001",
                "flightbook_entries": [
                    {
                        "id": "entry-001",
                        "title": "Leadership Reflection: Team Motivation",
                        "content": "Today I had a challenging conversation with a team member who seemed disengaged. I tried to understand their perspective and found they were feeling overwhelmed with their workload. We worked together to prioritize tasks and I offered additional support. This taught me the importance of active listening and not making assumptions about performance issues.",
                        "competency_area": "leadership_supervision",
                        "created_at": "2025-01-07T10:00:00Z"
                    },
                    {
                        "id": "entry-002", 
                        "title": "Financial Management: Budget Analysis",
                        "content": "Completed my first quarterly budget review. I noticed we were over budget in maintenance costs but under in marketing. I analyzed the root causes and presented recommendations to reduce maintenance expenses through preventive measures. This experience helped me understand the interconnected nature of departmental budgets.",
                        "competency_area": "financial_management",
                        "created_at": "2025-01-06T14:30:00Z"
                    },
                    {
                        "id": "entry-003",
                        "title": "Cross-Functional Collaboration: Leasing & Maintenance Alignment", 
                        "content": "Facilitated a meeting between leasing and maintenance teams to improve resident move-in processes. We identified communication gaps and established a shared checklist. The collaboration resulted in 20% faster move-in times and improved resident satisfaction scores.",
                        "competency_area": "cross_functional_collaboration",
                        "created_at": "2025-01-05T16:15:00Z"
                    }
                ],
                "task_progress": {
                    "leadership_supervision": {"completed": 2, "total": 4},
                    "financial_management": {"completed": 1, "total": 4},
                    "operational_management": {"completed": 0, "total": 4},
                    "cross_functional_collaboration": {"completed": 1, "total": 4},
                    "strategic_thinking": {"completed": 0, "total": 4}
                },
                "competencies": {
                    "leadership_supervision": {"progress": 50},
                    "financial_management": {"progress": 25},
                    "operational_management": {"progress": 0},
                    "cross_functional_collaboration": {"progress": 25},
                    "strategic_thinking": {"progress": 0}
                },
                "portfolio": [
                    {
                        "id": "portfolio-001",
                        "title": "Team Motivation Strategy Document",
                        "competency_areas": ["leadership_supervision"],
                        "upload_date": "2025-01-07T12:00:00Z"
                    },
                    {
                        "id": "portfolio-002",
                        "title": "Budget Analysis Report Q1",
                        "competency_areas": ["financial_management"],
                        "upload_date": "2025-01-06T15:00:00Z"
                    }
                ]
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                success = self.validate_ai_response_structure(data)
                
                if success:
                    # Analyze the quality of insights for experienced user
                    content_analysis = data.get("content_analysis", {})
                    learning_patterns = data.get("learning_patterns", {})
                    recommendations = data.get("recommendations", [])
                    
                    # Check if AI recognized the user's experience level
                    engagement_level = content_analysis.get("engagement_level", "")
                    themes = content_analysis.get("themes", [])
                    consistency_score = learning_patterns.get("consistency_score", 0)
                    
                    self.log_test(
                        "AI Analysis - Experienced User Scenario",
                        True,
                        f"Valid response for experienced user. "
                        f"Engagement: {engagement_level}, "
                        f"Consistency: {consistency_score}, "
                        f"Themes identified: {len(themes)}, "
                        f"Recommendations: {len(recommendations)}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "AI Analysis - Experienced User Response Structure",
                        False,
                        "Invalid response structure for experienced user scenario",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "AI Analysis - Experienced User HTTP Status",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "AI Analysis - Experienced User Connection",
                False,
                f"Connection error: {str(e)}",
                0
            )
            return False

    def validate_ai_response_structure(self, data: Dict[str, Any]) -> bool:
        """Validate that AI response contains all required fields with correct structure"""
        
        # Check top-level structure
        required_sections = ["content_analysis", "learning_patterns", "recommendations", "predictive_analytics"]
        for section in required_sections:
            if section not in data:
                print(f"   Missing section: {section}")
                return False
        
        # Validate content_analysis structure
        content_analysis = data["content_analysis"]
        required_content_fields = ["sentiment", "engagement_level", "themes", "identified_strengths", "growth_opportunities", "key_insights"]
        for field in required_content_fields:
            if field not in content_analysis:
                print(f"   Missing content_analysis field: {field}")
                return False
        
        # Validate learning_patterns structure
        learning_patterns = data["learning_patterns"]
        required_pattern_fields = ["consistency_score", "reflection_depth", "preferred_competency", "learning_velocity", "engagement_trends"]
        for field in required_pattern_fields:
            if field not in learning_patterns:
                print(f"   Missing learning_patterns field: {field}")
                return False
        
        # Validate recommendations structure
        recommendations = data["recommendations"]
        if not isinstance(recommendations, list):
            print("   Recommendations should be a list")
            return False
        
        for i, rec in enumerate(recommendations):
            required_rec_fields = ["type", "priority", "title", "description", "action", "icon", "ai_reason"]
            for field in required_rec_fields:
                if field not in rec:
                    print(f"   Missing recommendation[{i}] field: {field}")
                    return False
        
        # Validate predictive_analytics structure
        predictive_analytics = data["predictive_analytics"]
        required_pred_fields = ["predicted_completion_weeks", "learning_momentum", "weekly_velocity", "confidence_score", "next_milestone"]
        for field in required_pred_fields:
            if field not in predictive_analytics:
                print(f"   Missing predictive_analytics field: {field}")
                return False
        
        return True

    def test_ai_error_handling(self):
        """Test AI service error handling and fallback system"""
        print("🛡️ Testing AI Error Handling...")
        
        try:
            # Test with invalid request data to trigger fallback
            invalid_request_data = {
                "user_id": "test-error-handling-001",
                "flightbook_entries": "invalid_data_type",  # Should be list
                "task_progress": None,  # Should be dict
                "competencies": [],  # Should be dict
                "portfolio": "invalid"  # Should be list
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze",
                json=invalid_request_data,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            # The service should either handle gracefully or return a proper error
            if response.status_code == 200:
                data = response.json()
                # If it returns 200, it should still have valid structure (fallback)
                success = self.validate_ai_response_structure(data)
                
                self.log_test(
                    "AI Error Handling - Fallback System",
                    success,
                    f"Service handled invalid input gracefully with fallback response" if success else "Fallback response has invalid structure",
                    response_time
                )
                return success
            elif response.status_code == 422:
                # Validation error is acceptable
                self.log_test(
                    "AI Error Handling - Input Validation",
                    True,
                    f"Service properly validated input and returned HTTP 422",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "AI Error Handling - Unexpected Response",
                    False,
                    f"Unexpected HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "AI Error Handling - Connection",
                False,
                f"Connection error: {str(e)}",
                0
            )
            return False

    def test_ai_response_quality(self):
        """Test the quality and relevance of AI responses"""
        print("🎯 Testing AI Response Quality...")
        
        try:
            # Test with rich data to evaluate AI analysis quality
            rich_request_data = {
                "user_id": "test-quality-assessment-001",
                "flightbook_entries": [
                    {
                        "id": "quality-entry-001",
                        "title": "Leadership Challenge: Conflict Resolution",
                        "content": "Had to mediate a conflict between two team members over project responsibilities. I used active listening techniques, helped them understand each other's perspectives, and facilitated a compromise. The experience taught me that most conflicts stem from miscommunication rather than actual disagreements. I plan to implement regular team check-ins to prevent similar issues.",
                        "competency_area": "leadership_supervision",
                        "created_at": "2025-01-07T09:00:00Z"
                    },
                    {
                        "id": "quality-entry-002",
                        "title": "Strategic Thinking: Market Analysis",
                        "content": "Completed comprehensive analysis of local rental market trends. Identified opportunity for premium amenity packages based on competitor gaps. Presented findings to management with ROI projections. This exercise enhanced my ability to think strategically about market positioning and resident value propositions.",
                        "competency_area": "strategic_thinking",
                        "created_at": "2025-01-06T11:30:00Z"
                    }
                ],
                "task_progress": {
                    "leadership_supervision": {"completed": 3, "total": 4},
                    "financial_management": {"completed": 2, "total": 4},
                    "operational_management": {"completed": 1, "total": 4},
                    "cross_functional_collaboration": {"completed": 2, "total": 4},
                    "strategic_thinking": {"completed": 1, "total": 4}
                },
                "competencies": {
                    "leadership_supervision": {"progress": 75},
                    "financial_management": {"progress": 50},
                    "operational_management": {"progress": 25},
                    "cross_functional_collaboration": {"progress": 50},
                    "strategic_thinking": {"progress": 25}
                },
                "portfolio": [
                    {
                        "id": "quality-portfolio-001",
                        "title": "Conflict Resolution Framework",
                        "competency_areas": ["leadership_supervision"],
                        "upload_date": "2025-01-07T10:00:00Z"
                    },
                    {
                        "id": "quality-portfolio-002",
                        "title": "Market Analysis Report",
                        "competency_areas": ["strategic_thinking"],
                        "upload_date": "2025-01-06T12:00:00Z"
                    }
                ]
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze",
                json=rich_request_data,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                success = self.validate_ai_response_structure(data)
                
                if success:
                    # Evaluate quality of AI insights
                    content_analysis = data["content_analysis"]
                    recommendations = data["recommendations"]
                    
                    # Check if AI identified relevant themes
                    themes = content_analysis.get("themes", [])
                    strengths = content_analysis.get("identified_strengths", [])
                    
                    # Check if recommendations are actionable and specific
                    actionable_recs = [rec for rec in recommendations if len(rec.get("action", "")) > 10]
                    high_priority_recs = [rec for rec in recommendations if rec.get("priority") == "high"]
                    
                    quality_score = (
                        len(themes) * 10 +  # Themes identified
                        len(strengths) * 10 +  # Strengths identified
                        len(actionable_recs) * 15 +  # Actionable recommendations
                        len(high_priority_recs) * 5  # High priority recommendations
                    )
                    
                    self.log_test(
                        "AI Response Quality Assessment",
                        quality_score >= 50,  # Minimum quality threshold
                        f"Quality score: {quality_score}/100. "
                        f"Themes: {len(themes)}, Strengths: {len(strengths)}, "
                        f"Actionable recs: {len(actionable_recs)}, High priority: {len(high_priority_recs)}",
                        response_time
                    )
                    return quality_score >= 50
                else:
                    self.log_test(
                        "AI Response Quality - Structure",
                        False,
                        "Invalid response structure affects quality assessment",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "AI Response Quality - HTTP Status",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "AI Response Quality - Connection",
                False,
                f"Connection error: {str(e)}",
                0
            )
            return False

    def run_comprehensive_test_suite(self):
        """Run all AI analytics tests"""
        print("🚀 Starting AI-Powered Learning Analytics Test Suite")
        print("=" * 60)
        
        test_methods = [
            self.test_ai_health_check,
            self.test_ai_analysis_new_user,
            self.test_ai_analysis_experienced_user,
            self.test_ai_error_handling,
            self.test_ai_response_quality
        ]
        
        passed_tests = 0
        total_tests = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_method.__name__}: {str(e)}")
        
        print("=" * 60)
        print(f"🎯 AI ANALYTICS TEST RESULTS: {passed_tests}/{total_tests} tests passed")
        print(f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("✅ ALL AI ANALYTICS TESTS PASSED - System ready for production!")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️ MOST TESTS PASSED - Minor issues need attention")
        else:
            print("❌ MULTIPLE TEST FAILURES - Significant issues require fixing")
        
        return passed_tests, total_tests

def main():
    """Main test execution"""
    print("AI-Powered Learning Analytics Backend Testing")
    print("Testing newly implemented AI integration endpoints")
    print()
    
    test_suite = AIAnalyticsTestSuite()
    passed, total = test_suite.run_comprehensive_test_suite()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)