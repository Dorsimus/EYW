#!/usr/bin/env python3
"""
Sub-Competency Reference Analysis
=================================

This script analyzes the critical issue of invalid sub-competency references
found in the previous analysis.
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

async def analyze_sub_competency_issues():
    base_url = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    api_base = f"{base_url}/api"
    
    print("🔍 Analyzing Sub-Competency Reference Issues")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        # Get competency framework
        async with session.get(f"{api_base}/competencies") as comp_response:
            competencies = await comp_response.json()
            
        # Get all tasks
        async with session.get(f"{api_base}/tasks") as task_response:
            tasks = await task_response.json()
        
        print(f"📊 Found {len(tasks)} tasks and {len(competencies)} competency areas")
        
        # Analyze sub-competency mismatches
        issues = []
        valid_mappings = {}
        
        for comp_area, comp_data in competencies.items():
            valid_sub_comps = list(comp_data.get('sub_competencies', {}).keys())
            valid_mappings[comp_area] = valid_sub_comps
            print(f"\n📋 {comp_area}: {len(valid_sub_comps)} valid sub-competencies")
            for sub_comp in valid_sub_comps:
                print(f"   - {sub_comp}")
        
        print(f"\n🔍 Checking task sub-competency references...")
        
        for i, task in enumerate(tasks):
            task_title = task.get('title', f'Task {i+1}')
            comp_area = task.get('competency_area', '')
            sub_comp = task.get('sub_competency', '')
            
            if comp_area in valid_mappings:
                if sub_comp and sub_comp not in valid_mappings[comp_area]:
                    issues.append({
                        'task_title': task_title,
                        'task_id': task.get('id', 'No ID'),
                        'competency_area': comp_area,
                        'invalid_sub_competency': sub_comp,
                        'valid_options': valid_mappings[comp_area]
                    })
        
        print(f"\n🚨 Found {len(issues)} sub-competency reference issues:")
        
        # Group issues by competency area
        issues_by_area = {}
        for issue in issues:
            area = issue['competency_area']
            if area not in issues_by_area:
                issues_by_area[area] = []
            issues_by_area[area].append(issue)
        
        for area, area_issues in issues_by_area.items():
            print(f"\n📍 {area} ({len(area_issues)} issues):")
            for issue in area_issues[:5]:  # Show first 5 issues per area
                print(f"   ❌ Task: '{issue['task_title'][:50]}...'")
                print(f"      Invalid sub-competency: '{issue['invalid_sub_competency']}'")
                print(f"      Valid options: {issue['valid_options']}")
            
            if len(area_issues) > 5:
                print(f"   ... and {len(area_issues) - 5} more issues in this area")
        
        # Check for specific patterns
        print(f"\n🔍 Pattern Analysis:")
        
        # Common invalid sub-competencies
        invalid_sub_comps = {}
        for issue in issues:
            invalid = issue['invalid_sub_competency']
            invalid_sub_comps[invalid] = invalid_sub_comps.get(invalid, 0) + 1
        
        print(f"📊 Most common invalid sub-competencies:")
        for invalid, count in sorted(invalid_sub_comps.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   - '{invalid}': {count} tasks")
        
        # Check if these might be legacy/old sub-competency names
        print(f"\n💡 Potential Solutions:")
        print(f"   1. Update task sub-competency references to match current framework")
        print(f"   2. Check if invalid sub-competencies are legacy names that need mapping")
        print(f"   3. Verify if competency framework is missing some sub-competencies")
        
        return len(issues)

if __name__ == "__main__":
    asyncio.run(analyze_sub_competency_issues())