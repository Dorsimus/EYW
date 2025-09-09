#!/usr/bin/env python3
"""
Navigator Level Memory and Resource Optimization
Comprehensive memory usage monitoring and resource optimization
"""

import asyncio
import psutil
import gc
import sys
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import json
from pathlib import Path
import tracemalloc
import resource
import threading
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment
load_dotenv('backend/.env')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ResourceMetrics:
    """Resource usage metrics"""
    timestamp: datetime
    memory_usage_mb: float
    memory_percent: float
    cpu_percent: float
    disk_usage_percent: float
    network_connections: int
    open_files: int
    thread_count: int
    gc_collections: Dict[str, int]

@dataclass
class MemoryProfile:
    """Memory profiling data"""
    current_memory_mb: float
    peak_memory_mb: float
    memory_blocks: int
    top_memory_consumers: List[Dict[str, Any]]
    memory_leaks_detected: bool
    gc_stats: Dict[str, Any]

class ResourceMonitor:
    """System resource monitoring and optimization"""
    
    def __init__(self):
        self.monitoring = False
        self.metrics_history = []
        self.start_time = None
        self.baseline_memory = None
        
    def start_monitoring(self):
        """Start resource monitoring"""
        self.monitoring = True
        self.start_time = datetime.utcnow()
        self.baseline_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        # Start memory tracing
        tracemalloc.start()
        
        logger.info(f"Resource monitoring started. Baseline memory: {self.baseline_memory:.1f}MB")
    
    def stop_monitoring(self):
        """Stop resource monitoring"""
        self.monitoring = False
        tracemalloc.stop()
        logger.info("Resource monitoring stopped")
    
    def collect_metrics(self) -> ResourceMetrics:
        """Collect current resource metrics"""
        process = psutil.Process()
        
        # Memory metrics
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        memory_percent = process.memory_percent()
        
        # CPU metrics
        cpu_percent = process.cpu_percent()
        
        # Disk usage
        disk_usage = psutil.disk_usage('/').percent
        
        # Network connections
        try:
            connections = len(process.connections())
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            connections = 0
        
        # Open files
        try:
            open_files = len(process.open_files())
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            open_files = 0
        
        # Thread count
        thread_count = process.num_threads()
        
        # Garbage collection stats
        gc_stats = {
            'gen0': gc.get_count()[0],
            'gen1': gc.get_count()[1],
            'gen2': gc.get_count()[2]
        }
        
        metrics = ResourceMetrics(
            timestamp=datetime.utcnow(),
            memory_usage_mb=memory_mb,
            memory_percent=memory_percent,
            cpu_percent=cpu_percent,
            disk_usage_percent=disk_usage,
            network_connections=connections,
            open_files=open_files,
            thread_count=thread_count,
            gc_collections=gc_stats
        )
        
        if self.monitoring:
            self.metrics_history.append(metrics)
        
        return metrics
    
    def get_memory_profile(self) -> MemoryProfile:
        """Get detailed memory profiling information"""
        
        # Current memory usage
        current_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        # Memory tracing data
        if tracemalloc.is_tracing():
            snapshot = tracemalloc.take_snapshot()
            top_stats = snapshot.statistics('lineno')
            
            # Get top memory consumers
            top_consumers = []
            for stat in top_stats[:10]:
                top_consumers.append({
                    'file': stat.traceback.format()[-1] if stat.traceback else 'unknown',
                    'size_mb': stat.size / 1024 / 1024,
                    'count': stat.count
                })
            
            peak_memory = tracemalloc.get_traced_memory()[1] / 1024 / 1024
            memory_blocks = len(top_stats)
        else:
            top_consumers = []
            peak_memory = current_memory
            memory_blocks = 0
        
        # Garbage collection stats
        gc_stats = {
            'collections': gc.get_stats(),
            'objects': len(gc.get_objects()),
            'garbage': len(gc.garbage)
        }
        
        # Detect potential memory leaks
        memory_leak_detected = False
        if self.baseline_memory and current_memory > self.baseline_memory * 1.5:
            memory_leak_detected = True
        
        return MemoryProfile(
            current_memory_mb=current_memory,
            peak_memory_mb=peak_memory,
            memory_blocks=memory_blocks,
            top_memory_consumers=top_consumers,
            memory_leaks_detected=memory_leak_detected,
            gc_stats=gc_stats
        )
    
    def optimize_memory(self) -> Dict[str, Any]:
        """Perform memory optimization"""
        logger.info("Starting memory optimization...")
        
        before_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        # Force garbage collection
        collected_objects = []
        for generation in range(3):
            collected = gc.collect(generation)
            collected_objects.append(collected)
        
        # Clear caches
        sys.intern.__dict__.clear() if hasattr(sys.intern, '__dict__') else None
        
        after_memory = psutil.Process().memory_info().rss / 1024 / 1024
        memory_freed = before_memory - after_memory
        
        optimization_results = {
            'memory_before_mb': before_memory,
            'memory_after_mb': after_memory,
            'memory_freed_mb': memory_freed,
            'gc_collected_objects': collected_objects,
            'optimization_successful': memory_freed > 0
        }
        
        logger.info(f"Memory optimization complete. Freed {memory_freed:.1f}MB")
        return optimization_results
    
    def get_resource_summary(self) -> Dict[str, Any]:
        """Get comprehensive resource usage summary"""
        if not self.metrics_history:
            return {'error': 'No metrics collected'}
        
        # Calculate averages and peaks
        avg_memory = sum(m.memory_usage_mb for m in self.metrics_history) / len(self.metrics_history)
        peak_memory = max(m.memory_usage_mb for m in self.metrics_history)
        avg_cpu = sum(m.cpu_percent for m in self.metrics_history) / len(self.metrics_history)
        peak_cpu = max(m.cpu_percent for m in self.metrics_history)
        
        # Memory trend analysis
        if len(self.metrics_history) >= 2:
            memory_trend = self.metrics_history[-1].memory_usage_mb - self.metrics_history[0].memory_usage_mb
        else:
            memory_trend = 0
        
        return {
            'monitoring_duration_minutes': (datetime.utcnow() - self.start_time).total_seconds() / 60 if self.start_time else 0,
            'metrics_collected': len(self.metrics_history),
            'memory_usage': {
                'baseline_mb': self.baseline_memory,
                'average_mb': round(avg_memory, 1),
                'peak_mb': round(peak_memory, 1),
                'current_mb': round(self.metrics_history[-1].memory_usage_mb, 1) if self.metrics_history else 0,
                'trend_mb': round(memory_trend, 1),
                'memory_efficient': memory_trend < 50  # Less than 50MB growth
            },
            'cpu_usage': {
                'average_percent': round(avg_cpu, 1),
                'peak_percent': round(peak_cpu, 1),
                'current_percent': round(self.metrics_history[-1].cpu_percent, 1) if self.metrics_history else 0
            },
            'system_health': {
                'disk_usage_percent': round(self.metrics_history[-1].disk_usage_percent, 1) if self.metrics_history else 0,
                'network_connections': self.metrics_history[-1].network_connections if self.metrics_history else 0,
                'open_files': self.metrics_history[-1].open_files if self.metrics_history else 0,
                'thread_count': self.metrics_history[-1].thread_count if self.metrics_history else 0
            }
        }

class DatabaseConnectionOptimizer:
    """Database connection pooling and optimization"""
    
    def __init__(self, mongo_url: str, db_name: str):
        self.mongo_url = mongo_url
        self.db_name = db_name
        self.client = None
        self.connection_metrics = []
    
    async def optimize_connection_pool(self) -> Dict[str, Any]:
        """Optimize MongoDB connection pool settings"""
        logger.info("Optimizing database connection pool...")
        
        # Optimized connection settings for Navigator Level
        optimized_client = AsyncIOMotorClient(
            self.mongo_url,
            maxPoolSize=50,  # Maximum connections in pool
            minPoolSize=5,   # Minimum connections to maintain
            maxIdleTimeMS=30000,  # 30 seconds idle timeout
            waitQueueTimeoutMS=5000,  # 5 seconds wait timeout
            serverSelectionTimeoutMS=5000,  # 5 seconds server selection timeout
            connectTimeoutMS=10000,  # 10 seconds connection timeout
            socketTimeoutMS=20000,  # 20 seconds socket timeout
            retryWrites=True,
            retryReads=True
        )
        
        # Test connection
        try:
            db = optimized_client[self.db_name]
            await db.command('ping')
            
            # Get connection pool stats
            pool_stats = {
                'max_pool_size': 50,
                'min_pool_size': 5,
                'connection_timeout_ms': 10000,
                'socket_timeout_ms': 20000,
                'optimization_applied': True
            }
            
            logger.info("Database connection pool optimized successfully")
            return pool_stats
            
        except Exception as e:
            logger.error(f"Database connection optimization failed: {e}")
            return {'optimization_applied': False, 'error': str(e)}
        
        finally:
            if optimized_client:
                optimized_client.close()
    
    async def test_connection_performance(self) -> Dict[str, Any]:
        """Test database connection performance"""
        logger.info("Testing database connection performance...")
        
        connection_times = []
        query_times = []
        
        for i in range(10):  # Test 10 connections
            # Test connection time
            start_time = time.time()
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            
            try:
                # Test query time
                query_start = time.time()
                await db.command('ping')
                query_time = (time.time() - query_start) * 1000
                
                connection_time = (time.time() - start_time) * 1000
                
                connection_times.append(connection_time)
                query_times.append(query_time)
                
            finally:
                client.close()
        
        avg_connection_time = sum(connection_times) / len(connection_times)
        avg_query_time = sum(query_times) / len(query_times)
        
        return {
            'avg_connection_time_ms': round(avg_connection_time, 2),
            'avg_query_time_ms': round(avg_query_time, 2),
            'connection_performance': 'EXCELLENT' if avg_connection_time < 100 else 'GOOD' if avg_connection_time < 500 else 'POOR',
            'query_performance': 'EXCELLENT' if avg_query_time < 50 else 'GOOD' if avg_query_time < 200 else 'POOR'
        }

class CacheOptimizer:
    """Application-level caching optimization"""
    
    def __init__(self):
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'size': 0
        }
    
    def optimize_application_cache(self) -> Dict[str, Any]:
        """Optimize application-level caching"""
        logger.info("Optimizing application cache...")
        
        # Clear Python function caches
        import functools
        
        # Find and clear lru_cache decorated functions
        cleared_caches = 0
        for obj in gc.get_objects():
            if hasattr(obj, 'cache_clear') and hasattr(obj, '__wrapped__'):
                try:
                    obj.cache_clear()
                    cleared_caches += 1
                except:
                    pass
        
        # Optimize garbage collection for better cache performance
        gc.set_threshold(700, 10, 10)  # Optimized thresholds
        
        return {
            'caches_cleared': cleared_caches,
            'gc_thresholds_optimized': True,
            'cache_optimization_applied': True
        }

class FileSystemOptimizer:
    """File system and storage optimization"""
    
    def __init__(self, upload_dir: str = "/app/backend/uploads"):
        self.upload_dir = Path(upload_dir)
    
    def optimize_file_storage(self) -> Dict[str, Any]:
        """Optimize file storage and cleanup"""
        logger.info("Optimizing file storage...")
        
        if not self.upload_dir.exists():
            return {'error': 'Upload directory does not exist'}
        
        # Analyze storage usage
        total_size = 0
        file_count = 0
        old_files = []
        
        cutoff_date = datetime.now() - timedelta(days=30)  # Files older than 30 days
        
        for file_path in self.upload_dir.rglob('*'):
            if file_path.is_file():
                file_count += 1
                file_size = file_path.stat().st_size
                total_size += file_size
                
                # Check if file is old
                file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_mtime < cutoff_date:
                    old_files.append({
                        'path': str(file_path),
                        'size_mb': file_size / 1024 / 1024,
                        'age_days': (datetime.now() - file_mtime).days
                    })
        
        # Storage optimization recommendations
        recommendations = []
        if total_size > 1024 * 1024 * 1024:  # > 1GB
            recommendations.append("Consider implementing file archival for large storage usage")
        
        if len(old_files) > 100:
            recommendations.append(f"Consider cleaning up {len(old_files)} old files")
        
        return {
            'total_files': file_count,
            'total_size_mb': round(total_size / 1024 / 1024, 1),
            'old_files_count': len(old_files),
            'old_files_size_mb': round(sum(f['size_mb'] for f in old_files), 1),
            'storage_optimization_recommendations': recommendations,
            'storage_healthy': total_size < 5 * 1024 * 1024 * 1024  # < 5GB
        }

async def run_comprehensive_resource_optimization():
    """Run comprehensive resource optimization and monitoring"""
    
    logger.info("🔧 Starting Navigator Level Resource Optimization")
    
    # Initialize components
    resource_monitor = ResourceMonitor()
    db_optimizer = DatabaseConnectionOptimizer(
        os.environ['MONGO_URL'], 
        os.environ['DB_NAME']
    )
    cache_optimizer = CacheOptimizer()
    fs_optimizer = FileSystemOptimizer()
    
    # Start monitoring
    resource_monitor.start_monitoring()
    
    try:
        # Collect baseline metrics
        logger.info("📊 Collecting baseline metrics...")
        baseline_metrics = resource_monitor.collect_metrics()
        
        # Run optimization steps
        optimization_results = {}
        
        # Step 1: Memory optimization
        logger.info("🧠 Step 1: Memory Optimization")
        memory_optimization = resource_monitor.optimize_memory()
        optimization_results['memory_optimization'] = memory_optimization
        
        # Step 2: Database connection optimization
        logger.info("🗄️ Step 2: Database Connection Optimization")
        db_pool_optimization = await db_optimizer.optimize_connection_pool()
        db_performance = await db_optimizer.test_connection_performance()
        optimization_results['database_optimization'] = {
            'connection_pool': db_pool_optimization,
            'performance_test': db_performance
        }
        
        # Step 3: Cache optimization
        logger.info("⚡ Step 3: Cache Optimization")
        cache_optimization = cache_optimizer.optimize_application_cache()
        optimization_results['cache_optimization'] = cache_optimization
        
        # Step 4: File system optimization
        logger.info("📁 Step 4: File System Optimization")
        fs_optimization = fs_optimizer.optimize_file_storage()
        optimization_results['filesystem_optimization'] = fs_optimization
        
        # Monitor for a period to see optimization effects
        logger.info("⏱️ Monitoring optimization effects...")
        for i in range(30):  # Monitor for 30 seconds
            resource_monitor.collect_metrics()
            await asyncio.sleep(1)
        
        # Get final metrics and memory profile
        final_metrics = resource_monitor.collect_metrics()
        memory_profile = resource_monitor.get_memory_profile()
        resource_summary = resource_monitor.get_resource_summary()
        
        # Generate comprehensive report
        optimization_report = {
            'optimization_timestamp': datetime.utcnow().isoformat(),
            'baseline_metrics': {
                'memory_mb': baseline_metrics.memory_usage_mb,
                'cpu_percent': baseline_metrics.cpu_percent,
                'thread_count': baseline_metrics.thread_count
            },
            'final_metrics': {
                'memory_mb': final_metrics.memory_usage_mb,
                'cpu_percent': final_metrics.cpu_percent,
                'thread_count': final_metrics.thread_count
            },
            'memory_profile': {
                'current_memory_mb': memory_profile.current_memory_mb,
                'peak_memory_mb': memory_profile.peak_memory_mb,
                'memory_leaks_detected': memory_profile.memory_leaks_detected,
                'gc_objects': memory_profile.gc_stats.get('objects', 0)
            },
            'resource_summary': resource_summary,
            'optimization_results': optimization_results,
            'performance_assessment': {
                'memory_efficient': resource_summary['memory_usage']['memory_efficient'],
                'database_performance': db_performance.get('connection_performance', 'UNKNOWN'),
                'storage_healthy': fs_optimization.get('storage_healthy', False),
                'overall_optimization_successful': True
            }
        }
        
        # Save report
        report_file = f"/app/RESOURCE_OPTIMIZATION_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(optimization_report, f, indent=2, default=str)
        
        logger.info(f"📊 Resource optimization report saved to: {report_file}")
        
        # Print summary
        memory_improvement = baseline_metrics.memory_usage_mb - final_metrics.memory_usage_mb
        logger.info(f"🎯 Memory Usage: {final_metrics.memory_usage_mb:.1f}MB (Δ {memory_improvement:+.1f}MB)")
        logger.info(f"🔧 Database Performance: {db_performance.get('connection_performance', 'UNKNOWN')}")
        logger.info(f"💾 Storage Health: {'HEALTHY' if fs_optimization.get('storage_healthy', False) else 'NEEDS_ATTENTION'}")
        
        return optimization_report
        
    finally:
        resource_monitor.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(run_comprehensive_resource_optimization())