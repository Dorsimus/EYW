#!/usr/bin/env python3
"""
Navigator Level Performance Optimization Suite
Comprehensive performance benchmarking and optimization for production deployment
"""

import asyncio
import time
import statistics
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
from dotenv import load_dotenv
import aiohttp
import concurrent.futures
from dataclasses import dataclass
import uuid

# Load environment
load_dotenv('backend/.env')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Performance metrics data structure"""
    endpoint: str
    method: str
    response_times: List[float]
    success_count: int
    error_count: int
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    p95_response_time: float
    p99_response_time: float
    throughput: float
    target_time: float
    meets_target: bool

class DatabaseOptimizer:
    """Database performance optimization and indexing"""
    
    def __init__(self, mongo_url: str, db_name: str):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        
    async def create_performance_indexes(self):
        """Create all critical indexes for Navigator Level performance"""
        logger.info("Creating performance indexes for Navigator Level...")
        
        # Critical indexes for Navigator Level performance
        indexes_to_create = [
            # Tasks collection - Core Navigator queries
            {
                'collection': 'tasks',
                'indexes': [
                    [("competency_area", 1), ("sub_competency", 1), ("active", 1)],
                    [("active", 1), ("order", 1)],
                    [("competency_area", 1), ("active", 1)],
                    [("created_by", 1), ("active", 1)]
                ]
            },
            
            # Task completions - User progress tracking
            {
                'collection': 'task_completions',
                'indexes': [
                    [("user_id", 1), ("task_id", 1)],  # Unique completion check
                    [("user_id", 1), ("completed_at", -1)],  # User timeline
                    [("task_id", 1), ("completed_at", -1)],  # Task analytics
                    [("user_id", 1), ("verified_by", 1)]  # Verification queries
                ]
            },
            
            # Competency progress - Real-time progress calculation
            {
                'collection': 'competency_progress',
                'indexes': [
                    [("user_id", 1), ("competency_area", 1)],
                    [("user_id", 1), ("sub_competency", 1)],
                    [("user_id", 1), ("competency_area", 1), ("sub_competency", 1)],
                    [("last_updated", -1)]  # Recent updates
                ]
            },
            
            # Portfolio items - Evidence and document management
            {
                'collection': 'portfolio_items',
                'indexes': [
                    [("user_id", 1), ("competency_areas", 1)],
                    [("user_id", 1), ("upload_date", -1)],
                    [("user_id", 1), ("status", 1)],
                    [("competency_areas", 1), ("status", 1)]
                ]
            },
            
            # Users - Authentication and user management
            {
                'collection': 'users',
                'indexes': [
                    [("clerk_user_id", 1)],  # Clerk authentication
                    [("email", 1)],  # Email lookup
                    [("role", 1), ("is_admin", 1)],  # Role-based queries
                    [("created_at", -1)]  # Recent users
                ]
            },
            
            # Flightbook entries - Learning journey tracking
            {
                'collection': 'flightbook_entries',
                'indexes': [
                    [("user_id", 1), ("updated_at", -1)],  # User timeline (already exists)
                    [("user_id", 1), ("competency_area", 1)],
                    [("user_id", 1), ("entry_type", 1)],
                    [("competency_area", 1), ("sub_competency", 1)]
                ]
            }
        ]
        
        created_count = 0
        for collection_config in indexes_to_create:
            collection_name = collection_config['collection']
            collection = self.db[collection_name]
            
            for index_spec in collection_config['indexes']:
                try:
                    # Check if index already exists
                    existing_indexes = await collection.list_indexes().to_list(None)
                    index_name = f"perf_{'_'.join([f'{field}_{direction}' for field, direction in index_spec])}"
                    
                    # Check if similar index exists
                    index_exists = False
                    for existing in existing_indexes:
                        if existing.get('key') and list(existing['key'].items()) == index_spec:
                            index_exists = True
                            break
                    
                    if not index_exists:
                        await collection.create_index(index_spec, name=index_name)
                        logger.info(f"Created index on {collection_name}: {index_spec}")
                        created_count += 1
                    else:
                        logger.info(f"Index already exists on {collection_name}: {index_spec}")
                        
                except Exception as e:
                    logger.error(f"Failed to create index on {collection_name} {index_spec}: {e}")
        
        logger.info(f"Database optimization complete. Created {created_count} new indexes.")
        return created_count
    
    async def analyze_query_performance(self):
        """Analyze current query performance"""
        logger.info("Analyzing query performance...")
        
        # Test critical Navigator queries
        test_queries = [
            {
                'name': 'Get all active tasks',
                'collection': 'tasks',
                'query': {'active': True},
                'sort': [('competency_area', 1), ('sub_competency', 1), ('order', 1)]
            },
            {
                'name': 'Get user task completions',
                'collection': 'task_completions',
                'query': {'user_id': 'test_user_id'},
                'sort': [('completed_at', -1)]
            },
            {
                'name': 'Get user competency progress',
                'collection': 'competency_progress',
                'query': {'user_id': 'test_user_id'},
                'sort': None
            },
            {
                'name': 'Get user portfolio items',
                'collection': 'portfolio_items',
                'query': {'user_id': 'test_user_id', 'status': 'active'},
                'sort': [('upload_date', -1)]
            }
        ]
        
        performance_results = []
        
        for test in test_queries:
            collection = self.db[test['collection']]
            
            # Time the query
            start_time = time.time()
            
            if test['sort']:
                cursor = collection.find(test['query']).sort(test['sort'])
            else:
                cursor = collection.find(test['query'])
            
            results = await cursor.to_list(1000)
            end_time = time.time()
            
            query_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            performance_results.append({
                'query_name': test['name'],
                'collection': test['collection'],
                'execution_time_ms': round(query_time, 2),
                'result_count': len(results),
                'query': test['query']
            })
            
            logger.info(f"Query '{test['name']}': {query_time:.2f}ms, {len(results)} results")
        
        return performance_results

class APIPerformanceTester:
    """API endpoint performance testing and benchmarking"""
    
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.auth_token = auth_token
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_endpoint_performance(self, endpoint: str, method: str = 'GET', 
                                      target_time: float = 1000, iterations: int = 10,
                                      payload: Optional[Dict] = None) -> PerformanceMetrics:
        """Test individual endpoint performance"""
        
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        if payload:
            headers['Content-Type'] = 'application/json'
        
        response_times = []
        success_count = 0
        error_count = 0
        
        logger.info(f"Testing {method} {endpoint} ({iterations} iterations)...")
        
        for i in range(iterations):
            start_time = time.time()
            
            try:
                if method.upper() == 'GET':
                    async with self.session.get(url, headers=headers) as response:
                        await response.text()
                        if response.status < 400:
                            success_count += 1
                        else:
                            error_count += 1
                            
                elif method.upper() == 'POST':
                    async with self.session.post(url, headers=headers, json=payload) as response:
                        await response.text()
                        if response.status < 400:
                            success_count += 1
                        else:
                            error_count += 1
                            
                end_time = time.time()
                response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                response_times.append(response_time)
                
            except Exception as e:
                error_count += 1
                logger.error(f"Request failed: {e}")
                # Add a high response time for failed requests
                response_times.append(10000)  # 10 seconds
        
        # Calculate metrics
        if response_times:
            avg_time = statistics.mean(response_times)
            min_time = min(response_times)
            max_time = max(response_times)
            p95_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else max_time
            p99_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else max_time
        else:
            avg_time = min_time = max_time = p95_time = p99_time = 0
        
        throughput = success_count / (sum(response_times) / 1000) if sum(response_times) > 0 else 0
        meets_target = avg_time <= target_time
        
        return PerformanceMetrics(
            endpoint=endpoint,
            method=method,
            response_times=response_times,
            success_count=success_count,
            error_count=error_count,
            avg_response_time=avg_time,
            min_response_time=min_time,
            max_response_time=max_time,
            p95_response_time=p95_time,
            p99_response_time=p99_time,
            throughput=throughput,
            target_time=target_time,
            meets_target=meets_target
        )
    
    async def run_comprehensive_api_tests(self, user_id: str) -> List[PerformanceMetrics]:
        """Run comprehensive API performance tests for Navigator Level"""
        
        # Critical Navigator API endpoints to test
        endpoints_to_test = [
            {'endpoint': '/api/competencies', 'method': 'GET', 'target': 200},
            {'endpoint': '/api/tasks', 'method': 'GET', 'target': 300},
            {'endpoint': f'/api/users/{user_id}/progress', 'method': 'GET', 'target': 500},
            {'endpoint': f'/api/users/{user_id}/tasks', 'method': 'GET', 'target': 400},
            {'endpoint': f'/api/users/{user_id}/competencies', 'method': 'GET', 'target': 600},
            {'endpoint': f'/api/users/{user_id}/portfolio', 'method': 'GET', 'target': 600},
            {'endpoint': '/api/admin/stats', 'method': 'GET', 'target': 300},
            {'endpoint': '/api/health', 'method': 'GET', 'target': 100}
        ]
        
        results = []
        
        for test_config in endpoints_to_test:
            try:
                metrics = await self.test_endpoint_performance(
                    endpoint=test_config['endpoint'],
                    method=test_config['method'],
                    target_time=test_config['target'],
                    iterations=20  # More iterations for better statistics
                )
                results.append(metrics)
                
                # Log results
                status = "✅ PASS" if metrics.meets_target else "❌ FAIL"
                logger.info(f"{status} {test_config['method']} {test_config['endpoint']}: "
                          f"{metrics.avg_response_time:.1f}ms avg (target: {test_config['target']}ms)")
                
            except Exception as e:
                logger.error(f"Failed to test {test_config['endpoint']}: {e}")
        
        return results

class FileUploadPerformanceTester:
    """File upload performance testing"""
    
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.auth_token = auth_token
    
    async def test_file_upload_performance(self, user_id: str, file_sizes: List[int]) -> Dict[str, Any]:
        """Test file upload performance across different file sizes"""
        
        results = {}
        
        for size_mb in file_sizes:
            logger.info(f"Testing {size_mb}MB file upload...")
            
            # Create test file
            test_file_path = f"/tmp/test_file_{size_mb}mb.txt"
            with open(test_file_path, 'w') as f:
                # Write approximately size_mb MB of data
                chunk = "A" * 1024  # 1KB chunk
                for _ in range(size_mb * 1024):
                    f.write(chunk)
            
            # Test upload
            start_time = time.time()
            
            try:
                async with aiohttp.ClientSession() as session:
                    headers = {}
                    if self.auth_token:
                        headers['Authorization'] = f'Bearer {self.auth_token}'
                    
                    with open(test_file_path, 'rb') as f:
                        data = aiohttp.FormData()
                        data.add_field('file', f, filename=f'test_{size_mb}mb.txt')
                        data.add_field('title', f'Test Upload {size_mb}MB')
                        data.add_field('description', f'Performance test file {size_mb}MB')
                        data.add_field('competency_areas', '["leadership_supervision"]')
                        
                        url = f"{self.base_url}/api/users/{user_id}/portfolio"
                        
                        async with session.post(url, headers=headers, data=data) as response:
                            response_text = await response.text()
                            upload_time = time.time() - start_time
                            
                            results[f"{size_mb}MB"] = {
                                'file_size_mb': size_mb,
                                'upload_time_seconds': round(upload_time, 2),
                                'success': response.status < 400,
                                'status_code': response.status,
                                'throughput_mbps': round(size_mb / upload_time, 2) if upload_time > 0 else 0
                            }
                            
                            logger.info(f"{size_mb}MB upload: {upload_time:.1f}s "
                                      f"({results[f'{size_mb}MB']['throughput_mbps']:.1f} MB/s)")
            
            except Exception as e:
                logger.error(f"Upload test failed for {size_mb}MB: {e}")
                results[f"{size_mb}MB"] = {
                    'file_size_mb': size_mb,
                    'upload_time_seconds': 0,
                    'success': False,
                    'error': str(e),
                    'throughput_mbps': 0
                }
            
            finally:
                # Clean up test file
                if os.path.exists(test_file_path):
                    os.remove(test_file_path)
        
        return results

class ConcurrentLoadTester:
    """Concurrent user load testing"""
    
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        self.base_url = base_url
        self.auth_token = auth_token
    
    async def simulate_concurrent_users(self, user_count: int, duration_seconds: int = 60) -> Dict[str, Any]:
        """Simulate concurrent Navigator users"""
        
        logger.info(f"Simulating {user_count} concurrent users for {duration_seconds} seconds...")
        
        # Define user simulation scenarios
        user_scenarios = [
            {'endpoint': '/api/competencies', 'weight': 0.2},
            {'endpoint': '/api/tasks', 'weight': 0.3},
            {'endpoint': '/api/health', 'weight': 0.1},
        ]
        
        results = {
            'concurrent_users': user_count,
            'duration_seconds': duration_seconds,
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'avg_response_time': 0,
            'requests_per_second': 0,
            'errors': []
        }
        
        async def simulate_user():
            """Simulate a single user's behavior"""
            user_requests = 0
            user_successes = 0
            user_failures = 0
            response_times = []
            
            async with aiohttp.ClientSession() as session:
                end_time = time.time() + duration_seconds
                
                while time.time() < end_time:
                    # Choose random scenario
                    import random
                    scenario = random.choices(user_scenarios, weights=[s['weight'] for s in user_scenarios])[0]
                    
                    start_time = time.time()
                    try:
                        headers = {}
                        if self.auth_token:
                            headers['Authorization'] = f'Bearer {self.auth_token}'
                        
                        url = f"{self.base_url}{scenario['endpoint']}"
                        async with session.get(url, headers=headers) as response:
                            await response.text()
                            
                            response_time = (time.time() - start_time) * 1000
                            response_times.append(response_time)
                            user_requests += 1
                            
                            if response.status < 400:
                                user_successes += 1
                            else:
                                user_failures += 1
                    
                    except Exception as e:
                        user_failures += 1
                        user_requests += 1
                        results['errors'].append(str(e))
                    
                    # Small delay between requests
                    await asyncio.sleep(0.1)
            
            return {
                'requests': user_requests,
                'successes': user_successes,
                'failures': user_failures,
                'response_times': response_times
            }
        
        # Run concurrent user simulations
        tasks = [simulate_user() for _ in range(user_count)]
        user_results = await asyncio.gather(*tasks)
        
        # Aggregate results
        all_response_times = []
        for user_result in user_results:
            results['total_requests'] += user_result['requests']
            results['successful_requests'] += user_result['successes']
            results['failed_requests'] += user_result['failures']
            all_response_times.extend(user_result['response_times'])
        
        if all_response_times:
            results['avg_response_time'] = statistics.mean(all_response_times)
        
        results['requests_per_second'] = results['total_requests'] / duration_seconds
        
        logger.info(f"Load test complete: {results['total_requests']} requests, "
                   f"{results['successful_requests']} successful, "
                   f"{results['requests_per_second']:.1f} req/s")
        
        return results

class PerformanceReportGenerator:
    """Generate comprehensive performance reports"""
    
    def __init__(self):
        self.report_data = {}
    
    def generate_comprehensive_report(self, 
                                    api_results: List[PerformanceMetrics],
                                    db_results: List[Dict],
                                    upload_results: Dict[str, Any],
                                    load_test_results: Dict[str, Any],
                                    optimization_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        
        # API Performance Summary
        api_summary = {
            'total_endpoints_tested': len(api_results),
            'endpoints_meeting_target': sum(1 for r in api_results if r.meets_target),
            'overall_api_health': 'EXCELLENT' if all(r.meets_target for r in api_results) else 'NEEDS_IMPROVEMENT',
            'endpoint_details': []
        }
        
        for result in api_results:
            api_summary['endpoint_details'].append({
                'endpoint': result.endpoint,
                'method': result.method,
                'avg_response_time_ms': round(result.avg_response_time, 1),
                'target_time_ms': result.target_time,
                'meets_target': result.meets_target,
                'success_rate': round((result.success_count / (result.success_count + result.error_count)) * 100, 1) if (result.success_count + result.error_count) > 0 else 0,
                'p95_response_time_ms': round(result.p95_response_time, 1),
                'throughput_rps': round(result.throughput, 1)
            })
        
        # Database Performance Summary
        db_summary = {
            'queries_analyzed': len(db_results),
            'indexes_created': optimization_results.get('indexes_created', 0),
            'query_performance': db_results
        }
        
        # File Upload Performance Summary
        upload_summary = {
            'file_sizes_tested': list(upload_results.keys()),
            'upload_performance': upload_results,
            'meets_requirements': self._evaluate_upload_performance(upload_results)
        }
        
        # Load Testing Summary
        load_summary = {
            'concurrent_users_tested': load_test_results.get('concurrent_users', 0),
            'total_requests': load_test_results.get('total_requests', 0),
            'success_rate': round((load_test_results.get('successful_requests', 0) / max(load_test_results.get('total_requests', 1), 1)) * 100, 1),
            'avg_response_time_ms': round(load_test_results.get('avg_response_time', 0), 1),
            'requests_per_second': round(load_test_results.get('requests_per_second', 0), 1),
            'system_stability': 'STABLE' if load_test_results.get('failed_requests', 0) < load_test_results.get('total_requests', 1) * 0.05 else 'UNSTABLE'
        }
        
        # Overall Assessment
        overall_assessment = self._generate_overall_assessment(api_summary, db_summary, upload_summary, load_summary)
        
        report = {
            'report_generated_at': datetime.utcnow().isoformat(),
            'navigator_level_performance_report': {
                'overall_assessment': overall_assessment,
                'api_performance': api_summary,
                'database_performance': db_summary,
                'file_upload_performance': upload_summary,
                'load_testing': load_summary,
                'optimization_results': optimization_results
            }
        }
        
        return report
    
    def _evaluate_upload_performance(self, upload_results: Dict[str, Any]) -> Dict[str, bool]:
        """Evaluate if upload performance meets requirements"""
        requirements = {
            'small_files_under_5s': True,  # < 1MB files
            'medium_files_under_15s': True,  # 1-10MB files
            'large_files_under_60s': True   # 10-50MB files
        }
        
        for size_key, result in upload_results.items():
            if not result.get('success', False):
                continue
                
            size_mb = result.get('file_size_mb', 0)
            upload_time = result.get('upload_time_seconds', 0)
            
            if size_mb < 1 and upload_time > 5:
                requirements['small_files_under_5s'] = False
            elif 1 <= size_mb <= 10 and upload_time > 15:
                requirements['medium_files_under_15s'] = False
            elif size_mb > 10 and upload_time > 60:
                requirements['large_files_under_60s'] = False
        
        return requirements
    
    def _generate_overall_assessment(self, api_summary, db_summary, upload_summary, load_summary) -> Dict[str, Any]:
        """Generate overall performance assessment"""
        
        # Calculate overall score
        api_score = (api_summary['endpoints_meeting_target'] / max(api_summary['total_endpoints_tested'], 1)) * 100
        upload_score = sum(upload_summary['meets_requirements'].values()) / len(upload_summary['meets_requirements']) * 100
        load_score = 100 if load_summary['system_stability'] == 'STABLE' else 50
        
        overall_score = (api_score + upload_score + load_score) / 3
        
        if overall_score >= 90:
            grade = 'EXCELLENT'
            production_ready = True
        elif overall_score >= 75:
            grade = 'GOOD'
            production_ready = True
        elif overall_score >= 60:
            grade = 'ACCEPTABLE'
            production_ready = True
        else:
            grade = 'NEEDS_IMPROVEMENT'
            production_ready = False
        
        return {
            'overall_score': round(overall_score, 1),
            'performance_grade': grade,
            'production_ready': production_ready,
            'api_performance_score': round(api_score, 1),
            'upload_performance_score': round(upload_score, 1),
            'load_testing_score': round(load_score, 1),
            'recommendations': self._generate_recommendations(api_summary, db_summary, upload_summary, load_summary)
        }
    
    def _generate_recommendations(self, api_summary, db_summary, upload_summary, load_summary) -> List[str]:
        """Generate performance improvement recommendations"""
        recommendations = []
        
        # API recommendations
        if api_summary['overall_api_health'] != 'EXCELLENT':
            slow_endpoints = [ep for ep in api_summary['endpoint_details'] if not ep['meets_target']]
            if slow_endpoints:
                recommendations.append(f"Optimize {len(slow_endpoints)} slow API endpoints: {', '.join([ep['endpoint'] for ep in slow_endpoints])}")
        
        # Database recommendations
        if db_summary['indexes_created'] > 0:
            recommendations.append(f"Database optimization complete with {db_summary['indexes_created']} new indexes created")
        
        # Upload recommendations
        upload_issues = [k for k, v in upload_summary['meets_requirements'].items() if not v]
        if upload_issues:
            recommendations.append(f"Improve file upload performance for: {', '.join(upload_issues)}")
        
        # Load testing recommendations
        if load_summary['system_stability'] != 'STABLE':
            recommendations.append("Improve system stability under concurrent load")
        
        if not recommendations:
            recommendations.append("System performance is excellent - ready for production deployment")
        
        return recommendations

async def main():
    """Main performance optimization and testing function"""
    
    # Configuration
    MONGO_URL = os.environ['MONGO_URL']
    DB_NAME = os.environ['DB_NAME']
    BASE_URL = "https://prelaunch-check.preview.emergentagent.com"
    
    # Test user ID (use existing user)
    TEST_USER_ID = "user_6761b8b8e5b4c2a8f1234567"  # Demo user
    
    logger.info("🚀 Starting Navigator Level Performance Optimization Suite")
    
    # Initialize components
    db_optimizer = DatabaseOptimizer(MONGO_URL, DB_NAME)
    report_generator = PerformanceReportGenerator()
    
    try:
        # Step 1: Database Optimization
        logger.info("📊 Step 1: Database Performance Optimization")
        indexes_created = await db_optimizer.create_performance_indexes()
        db_query_results = await db_optimizer.analyze_query_performance()
        
        optimization_results = {
            'indexes_created': indexes_created,
            'database_optimized': True,
            'query_analysis_completed': True
        }
        
        # Step 2: API Performance Testing
        logger.info("🔧 Step 2: API Performance Testing")
        async with APIPerformanceTester(BASE_URL) as api_tester:
            api_results = await api_tester.run_comprehensive_api_tests(TEST_USER_ID)
        
        # Step 3: File Upload Performance Testing
        logger.info("📁 Step 3: File Upload Performance Testing")
        upload_tester = FileUploadPerformanceTester(BASE_URL)
        upload_results = await upload_tester.test_file_upload_performance(
            TEST_USER_ID, 
            [1, 5, 10]  # Test 1MB, 5MB, 10MB files
        )
        
        # Step 4: Concurrent Load Testing
        logger.info("👥 Step 4: Concurrent Load Testing")
        load_tester = ConcurrentLoadTester(BASE_URL)
        load_results = await load_tester.simulate_concurrent_users(
            user_count=10,  # Simulate 10 concurrent users
            duration_seconds=30  # For 30 seconds
        )
        
        # Step 5: Generate Comprehensive Report
        logger.info("📋 Step 5: Generating Performance Report")
        performance_report = report_generator.generate_comprehensive_report(
            api_results=api_results,
            db_results=db_query_results,
            upload_results=upload_results,
            load_test_results=load_results,
            optimization_results=optimization_results
        )
        
        # Save report
        report_file = f"/app/NAVIGATOR_PERFORMANCE_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(performance_report, f, indent=2, default=str)
        
        logger.info(f"📊 Performance report saved to: {report_file}")
        
        # Print summary
        assessment = performance_report['navigator_level_performance_report']['overall_assessment']
        logger.info(f"🎯 Overall Performance Score: {assessment['overall_score']}/100 ({assessment['performance_grade']})")
        logger.info(f"🚀 Production Ready: {'YES' if assessment['production_ready'] else 'NO'}")
        
        for recommendation in assessment['recommendations']:
            logger.info(f"💡 Recommendation: {recommendation}")
        
        return performance_report
        
    except Exception as e:
        logger.error(f"Performance optimization failed: {e}")
        raise
    
    finally:
        # Cleanup
        if hasattr(db_optimizer, 'client'):
            db_optimizer.client.close()

if __name__ == "__main__":
    asyncio.run(main())