#!/usr/bin/env python3
"""
RICH COMPETENCY DATA EXTRACTOR AND IMPORTER
===========================================

This script extracts the comprehensive competency framework data from App.js
and imports it into MongoDB database as requested in the review.

Extracts:
1. Foundation Courses (course_link tasks)
2. Monthly Activities (document_upload/assessment tasks)  
3. Dive Deeper Resources (external_link tasks)
4. Culminating Project data (project tasks)

Imports to MongoDB collections:
- tasks (with proper competency mapping)
- competency_progress (framework structure)
"""

import asyncio
import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

class RichCompetencyDataExtractor:
    def __init__(self):
        # MongoDB connection
        self.mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        self.db_name = os.environ.get('DB_NAME', 'earn_your_wings')
        self.client = AsyncIOMotorClient(self.mongo_url)
        self.db = self.client[self.db_name]
        
        # Data storage
        self.extracted_data = {
            'competency_areas': {},
            'foundation_courses': [],
            'monthly_activities': [],
            'dive_deeper_resources': [],
            'culminating_projects': [],
            'total_tasks': 0
        }
        
        print(f"🚀 Rich Competency Data Extractor Initialized")
        print(f"📍 MongoDB: {self.mongo_url}/{self.db_name}")

    async def extract_from_app_js(self):
        """Extract rich competency data from App.js file"""
        print("\n📖 Extracting competency data from App.js...")
        
        app_js_path = '/app/frontend/src/App.js'
        if not os.path.exists(app_js_path):
            raise FileNotFoundError(f"App.js not found at {app_js_path}")
        
        with open(app_js_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Extract competency areas structure
        await self._extract_competency_areas(content)
        
        # Extract foundation courses
        await self._extract_foundation_courses(content)
        
        # Extract monthly activities
        await self._extract_monthly_activities(content)
        
        # Extract dive deeper resources
        await self._extract_dive_deeper_resources(content)
        
        # Extract culminating project data
        await self._extract_culminating_projects(content)
        
        self.extracted_data['total_tasks'] = (
            len(self.extracted_data['foundation_courses']) +
            len(self.extracted_data['monthly_activities']) +
            len(self.extracted_data['dive_deeper_resources']) +
            len(self.extracted_data['culminating_projects'])
        )
        
        print(f"✅ Extraction Complete:")
        print(f"   📚 Foundation Courses: {len(self.extracted_data['foundation_courses'])}")
        print(f"   📝 Monthly Activities: {len(self.extracted_data['monthly_activities'])}")
        print(f"   🔗 Dive Deeper Resources: {len(self.extracted_data['dive_deeper_resources'])}")
        print(f"   🎯 Culminating Projects: {len(self.extracted_data['culminating_projects'])}")
        print(f"   📊 Total Tasks: {self.extracted_data['total_tasks']}")

    async def _extract_competency_areas(self, content: str):
        """Extract competency area structure"""
        # Find competency area definitions
        competency_pattern = r'(\w+):\s*{\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)"'
        matches = re.findall(competency_pattern, content)
        
        for area_key, name, description in matches:
            if '_' in area_key and area_key not in ['curiosity_ignition', 'integration_activities']:
                self.extracted_data['competency_areas'][area_key] = {
                    'name': name,
                    'description': description,
                    'sub_competencies': {}
                }
        
        print(f"📋 Found {len(self.extracted_data['competency_areas'])} competency areas")

    async def _extract_foundation_courses(self, content: str):
        """Extract foundation courses data"""
        # Pattern to find foundation courses
        course_pattern = r'foundation_courses:\s*\[(.*?)\]'
        course_matches = re.findall(course_pattern, content, re.DOTALL)
        
        for course_block in course_matches:
            # Extract individual courses
            individual_course_pattern = r'{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*duration:\s*"([^"]+)",\s*platform:\s*"([^"]+)",\s*description:\s*"([^"]+)"(?:,\s*url:\s*"([^"]*)")?\s*}'
            courses = re.findall(individual_course_pattern, course_block)
            
            for course_id, title, duration, platform, description, url in courses:
                # Determine competency area from course ID
                competency_area, sub_competency = self._parse_course_id(course_id)
                
                task_data = {
                    'id': str(uuid.uuid4()),
                    'original_id': course_id,
                    'title': title,
                    'description': description,
                    'task_type': 'course_link',
                    'competency_area': competency_area,
                    'sub_competency': sub_competency,
                    'order': 1,
                    'required': True,
                    'estimated_hours': self._parse_duration(duration),
                    'external_link': url if url else f"https://performancehq.com/{course_id}",
                    'instructions': f"Complete {title} on {platform}. Duration: {duration}",
                    'created_by': 'system',
                    'created_at': datetime.utcnow(),
                    'active': True,
                    'source': 'app_js_foundation_course'
                }
                
                self.extracted_data['foundation_courses'].append(task_data)

    async def _extract_monthly_activities(self, content: str):
        """Extract monthly activities data"""
        # Pattern to find monthly activities
        activity_pattern = r'monthly_activities:\s*\[(.*?)\]'
        activity_matches = re.findall(activity_pattern, content, re.DOTALL)
        
        for activity_block in activity_matches:
            # Extract individual monthly activities
            individual_activity_pattern = r'{\s*month:\s*(\d+),\s*title:\s*"([^"]+)",\s*in_the_flow_activity:\s*"([^"]+)",\s*document:\s*"([^"]+)"(?:,\s*integrations:\s*\[([^\]]*)\])?(?:,\s*reflection:\s*"([^"]*)")?(?:,\s*journal_prompt:\s*"([^"]*)")?(?:,\s*curiosity_question:\s*"([^"]*)")?\s*}'
            activities = re.findall(individual_activity_pattern, activity_block, re.DOTALL)
            
            # Find the parent competency area for this activity block
            competency_area = self._find_parent_competency(content, activity_block)
            
            for month, title, activity, document, integrations, reflection, journal_prompt, curiosity_question in activities:
                # Generate sub-competency from context
                sub_competency = self._generate_sub_competency_from_context(content, title)
                
                task_data = {
                    'id': str(uuid.uuid4()),
                    'title': f"Month {month}: {title}",
                    'description': activity,
                    'task_type': 'document_upload',
                    'competency_area': competency_area,
                    'sub_competency': sub_competency,
                    'order': int(month),
                    'required': True,
                    'estimated_hours': 2.0,  # Default for monthly activities
                    'instructions': f"Activity: {activity}\nDocument: {document}",
                    'created_by': 'system',
                    'created_at': datetime.utcnow(),
                    'active': True,
                    'source': 'app_js_monthly_activity',
                    'metadata': {
                        'month': int(month),
                        'document_requirement': document,
                        'integrations': integrations.split(',') if integrations else [],
                        'reflection': reflection,
                        'journal_prompt': journal_prompt,
                        'curiosity_question': curiosity_question
                    }
                }
                
                self.extracted_data['monthly_activities'].append(task_data)

    async def _extract_dive_deeper_resources(self, content: str):
        """Extract dive deeper resources data"""
        # Pattern to find dive deeper resources
        resource_pattern = r'dive_deeper_resources:\s*\[(.*?)\]'
        resource_matches = re.findall(resource_pattern, content, re.DOTALL)
        
        for resource_block in resource_matches:
            # Extract individual resources
            individual_resource_pattern = r'{\s*title:\s*"([^"]+)",\s*type:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*url:\s*"([^"]*)"?\s*}'
            resources = re.findall(individual_resource_pattern, resource_block)
            
            # Find the parent competency area for this resource block
            competency_area = self._find_parent_competency(content, resource_block)
            
            for title, resource_type, description, url in resources:
                # Generate sub-competency from context
                sub_competency = self._generate_sub_competency_from_context(content, title)
                
                task_data = {
                    'id': str(uuid.uuid4()),
                    'title': f"Resource: {title}",
                    'description': description,
                    'task_type': 'external_resource',
                    'competency_area': competency_area,
                    'sub_competency': sub_competency,
                    'order': 10,  # Lower priority than core activities
                    'required': False,  # Resources are typically optional
                    'estimated_hours': 1.0,  # Default for resources
                    'external_link': url if url and url != '#' else None,
                    'instructions': f"Review {resource_type}: {title}",
                    'created_by': 'system',
                    'created_at': datetime.utcnow(),
                    'active': True,
                    'source': 'app_js_dive_deeper_resource',
                    'metadata': {
                        'resource_type': resource_type,
                        'original_url': url
                    }
                }
                
                self.extracted_data['dive_deeper_resources'].append(task_data)

    async def _extract_culminating_projects(self, content: str):
        """Extract culminating project data"""
        # Pattern to find culminating project definitions
        project_pattern = r'culminating_project:\s*{(.*?)}'
        project_matches = re.findall(project_pattern, content, re.DOTALL)
        
        for project_block in project_matches:
            # Extract project title and description
            title_match = re.search(r'title:\s*"([^"]+)"', project_block)
            challenge_match = re.search(r'challenge:\s*"([^"]+)"', project_block)
            
            if title_match and challenge_match:
                # Find the parent competency area
                competency_area = self._find_parent_competency(content, project_block)
                
                task_data = {
                    'id': str(uuid.uuid4()),
                    'title': title_match.group(1),
                    'description': challenge_match.group(1),
                    'task_type': 'project',
                    'competency_area': competency_area,
                    'sub_competency': 'culminating_project',
                    'order': 100,  # High order for culminating projects
                    'required': True,
                    'estimated_hours': 40.0,  # Substantial time for culminating projects
                    'instructions': "Complete the culminating project as defined in the competency framework",
                    'created_by': 'system',
                    'created_at': datetime.utcnow(),
                    'active': True,
                    'source': 'app_js_culminating_project'
                }
                
                self.extracted_data['culminating_projects'].append(task_data)

    def _parse_course_id(self, course_id: str) -> tuple:
        """Parse course ID to determine competency area and sub-competency"""
        # Pattern: ls-new-fc-01 -> leadership_supervision
        if course_id.startswith('ls-'):
            return 'leadership_supervision', 'inspiring_team_motivation'
        elif course_id.startswith('fm-'):
            return 'financial_management', 'property_pl_understanding'
        elif course_id.startswith('om-'):
            return 'operational_management', 'process_improvement_efficiency'
        elif course_id.startswith('cf-'):
            return 'cross_functional_collaboration', 'understanding_other_department'
        elif course_id.startswith('st-'):
            return 'strategic_thinking', 'seeing_patterns_anticipating_trends'
        elif course_id.startswith('cc-'):
            return 'client_confidence_connection', 'understanding_client_impact'
        else:
            return 'leadership_supervision', 'inspiring_team_motivation'  # Default

    def _parse_duration(self, duration: str) -> float:
        """Parse duration string to hours"""
        # Extract numbers from duration string
        numbers = re.findall(r'\d+', duration)
        if numbers:
            hours = float(numbers[0])
            if 'minute' in duration.lower():
                return hours / 60.0
            return hours
        return 1.0  # Default

    def _find_parent_competency(self, content: str, block: str) -> str:
        """Find the parent competency area for a given block"""
        # Find the position of the block in content
        block_pos = content.find(block[:50])  # Use first 50 chars to find position
        
        # Look backwards for competency area definition
        before_block = content[:block_pos]
        
        # Find the last competency area before this block
        competency_areas = [
            'leadership_supervision',
            'financial_management', 
            'operational_management',
            'cross_functional_collaboration',
            'strategic_thinking',
            'client_confidence_connection'
        ]
        
        for area in reversed(competency_areas):
            if area in before_block:
                last_pos = before_block.rfind(area)
                # Make sure this is a competency definition, not just a reference
                area_context = before_block[max(0, last_pos-100):last_pos+100]
                if 'name:' in area_context and 'description:' in area_context:
                    return area
        
        return 'leadership_supervision'  # Default

    def _generate_sub_competency_from_context(self, content: str, title: str) -> str:
        """Generate sub-competency based on context and title"""
        # Simple mapping based on keywords in title
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['motivation', 'engagement', 'team']):
            return 'inspiring_team_motivation'
        elif any(word in title_lower for word in ['conversation', 'feedback', 'performance']):
            return 'mastering_difficult_conversations'
        elif any(word in title_lower for word in ['culture', 'collaboration']):
            return 'building_collaborative_culture'
        elif any(word in title_lower for word in ['development', 'coaching', 'mentoring']):
            return 'developing_others_success'
        elif any(word in title_lower for word in ['budget', 'financial', 'cost']):
            return 'departmental_budget_management'
        elif any(word in title_lower for word in ['process', 'improvement', 'efficiency']):
            return 'process_improvement_efficiency'
        elif any(word in title_lower for word in ['strategic', 'planning', 'future']):
            return 'planning_goal_achievement'
        else:
            return 'inspiring_team_motivation'  # Default

    async def import_to_database(self):
        """Import extracted data to MongoDB"""
        print(f"\n💾 Importing {self.extracted_data['total_tasks']} tasks to MongoDB...")
        
        try:
            # Clear existing tasks (optional - comment out to preserve existing data)
            # await self.db.tasks.delete_many({'source': {'$regex': 'app_js_'}})
            
            # Import all task types
            all_tasks = (
                self.extracted_data['foundation_courses'] +
                self.extracted_data['monthly_activities'] +
                self.extracted_data['dive_deeper_resources'] +
                self.extracted_data['culminating_projects']
            )
            
            if all_tasks:
                result = await self.db.tasks.insert_many(all_tasks)
                print(f"✅ Imported {len(result.inserted_ids)} tasks successfully")
                
                # Update task counts by type
                foundation_count = len(self.extracted_data['foundation_courses'])
                activity_count = len(self.extracted_data['monthly_activities'])
                resource_count = len(self.extracted_data['dive_deeper_resources'])
                project_count = len(self.extracted_data['culminating_projects'])
                
                print(f"   📚 Foundation Courses: {foundation_count}")
                print(f"   📝 Monthly Activities: {activity_count}")
                print(f"   🔗 Dive Deeper Resources: {resource_count}")
                print(f"   🎯 Culminating Projects: {project_count}")
                
                return True
            else:
                print("❌ No tasks to import")
                return False
                
        except Exception as e:
            print(f"❌ Import failed: {e}")
            return False

    async def verify_import(self):
        """Verify the imported data"""
        print(f"\n🔍 Verifying imported data...")
        
        try:
            # Count total tasks
            total_tasks = await self.db.tasks.count_documents({'active': True})
            
            # Count by source
            foundation_count = await self.db.tasks.count_documents({'source': 'app_js_foundation_course'})
            activity_count = await self.db.tasks.count_documents({'source': 'app_js_monthly_activity'})
            resource_count = await self.db.tasks.count_documents({'source': 'app_js_dive_deeper_resource'})
            project_count = await self.db.tasks.count_documents({'source': 'app_js_culminating_project'})
            
            # Count by competency area
            competency_counts = {}
            for area in self.extracted_data['competency_areas'].keys():
                count = await self.db.tasks.count_documents({'competency_area': area})
                competency_counts[area] = count
            
            print(f"✅ Verification Results:")
            print(f"   📊 Total Active Tasks: {total_tasks}")
            print(f"   📚 Foundation Courses: {foundation_count}")
            print(f"   📝 Monthly Activities: {activity_count}")
            print(f"   🔗 Dive Deeper Resources: {resource_count}")
            print(f"   🎯 Culminating Projects: {project_count}")
            print(f"   🏗️ Tasks by Competency Area:")
            
            for area, count in competency_counts.items():
                area_name = self.extracted_data['competency_areas'].get(area, {}).get('name', area)
                print(f"      - {area_name}: {count} tasks")
            
            return {
                'total_tasks': total_tasks,
                'foundation_courses': foundation_count,
                'monthly_activities': activity_count,
                'dive_deeper_resources': resource_count,
                'culminating_projects': project_count,
                'competency_distribution': competency_counts
            }
            
        except Exception as e:
            print(f"❌ Verification failed: {e}")
            return None

    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("🔌 Database connection closed")

async def main():
    """Main execution function"""
    extractor = RichCompetencyDataExtractor()
    
    try:
        print("🚀 Starting Rich Competency Data Extraction and Import Process")
        print("="*80)
        
        # Step 1: Extract data from App.js
        await extractor.extract_from_app_js()
        
        # Step 2: Import to database
        import_success = await extractor.import_to_database()
        
        if import_success:
            # Step 3: Verify import
            verification_results = await extractor.verify_import()
            
            if verification_results:
                print(f"\n🎉 SUCCESS: Rich competency data extraction and import completed!")
                print(f"📈 Imported {verification_results['total_tasks']} total tasks")
                print(f"🎯 Ready for comprehensive competency framework usage")
            else:
                print(f"\n⚠️ Import completed but verification failed")
        else:
            print(f"\n❌ Import process failed")
        
    except Exception as e:
        print(f"❌ Process failed: {e}")
    
    finally:
        await extractor.close()

if __name__ == "__main__":
    asyncio.run(main())