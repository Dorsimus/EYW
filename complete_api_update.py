#!/usr/bin/env python3
"""
Script to add the remaining foundation_courses and dive_deeper_resources
to complete the API-driven competency system.
"""

import re

def add_missing_components():
    """Add missing foundation_courses and dive_deeper_resources to remaining sub-competencies"""
    
    # Read the current server.py file
    with open('/app/backend/server.py', 'r') as file:
        content = file.read()
    
    # Operational Management components to add
    operational_updates = [
        # process_improvement_efficiency
        {
            'pattern': r'("process_improvement_efficiency": \{\s*"name": "Process Improvement & Efficiency",\s*"monthly_activities":)',
            'replacement': r'"process_improvement_efficiency": {\n                "name": "Process Improvement & Efficiency",\n                "foundation_courses": [\n                    {\n                        "id": "om-fc-01",\n                        "title": "Lean Six Sigma Fundamentals",\n                        "duration": "2.5 hours",\n                        "platform": "PerformanceHQ",\n                        "description": "Process improvement methodologies",\n                        "url": "https://www.performancehq.com/course/lean-six-sigma"\n                    },\n                    {\n                        "id": "om-fc-02",\n                        "title": "Workflow Optimization",\n                        "duration": "1.5 hours",\n                        "platform": "PerformanceHQ",\n                        "description": "Streamlining business processes",\n                        "url": "https://www.performancehq.com/course/workflow-optimization"\n                    }\n                ],\n                "dive_deeper_resources": [\n                    {\n                        "title": "The Lean Startup",\n                        "type": "Book",\n                        "description": "Eric Ries\' methodology for continuous improvement",\n                        "url": "https://theleanstartup.com/"\n                    },\n                    {\n                        "title": "Process Mining in Action",\n                        "type": "Guide/Tool",\n                        "description": "Data-driven process analysis and improvement",\n                        "url": "https://www.celonis.com/process-mining/"\n                    }\n                ],\n                "monthly_activities":'
        }
    ]
    
    # Apply updates - we'll do this manually for better control
    print("Component definitions ready for manual application")
    print("Total operational management updates:", len(operational_updates))

if __name__ == "__main__":
    add_missing_components()