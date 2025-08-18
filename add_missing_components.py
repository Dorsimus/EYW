#!/usr/bin/env python3
"""
Script to add missing foundation_courses and dive_deeper_resources to all sub-competencies
to achieve the target of ~72 total components for the /api/competencies endpoint.
"""

# Additional components to add to the remaining sub-competencies
ADDITIONAL_COMPONENTS = {
    "financial_management": {
        "property_pl_understanding": {
            "foundation_courses": [
                {
                    "id": "fm-fc-05",
                    "title": "Property P&L Analysis",
                    "duration": "2 hours",
                    "platform": "PerformanceHQ",
                    "description": "Understanding property profit and loss statements",
                    "url": "https://www.performancehq.com/course/property-pl-analysis"
                },
                {
                    "id": "fm-fc-06",
                    "title": "Real Estate Financial Metrics",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Key performance indicators for property management",
                    "url": "https://www.performancehq.com/course/real-estate-metrics"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "Real Estate Finance and Investments",
                    "type": "Book",
                    "description": "Comprehensive guide to property financial analysis",
                    "url": "https://www.mheducation.com/highered/product/real-estate-finance-investments-brueggeman-fisher/M9781259919688.html"
                },
                {
                    "title": "NARPM Financial Management Guide",
                    "type": "Industry Guide",
                    "description": "Property management financial best practices",
                    "url": "https://www.narpm.org/education/financial-management"
                }
            ]
        },
        "financial_performance_analysis": {
            "foundation_courses": [
                {
                    "id": "fm-fc-07",
                    "title": "Variance Analysis Techniques",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Analyzing budget vs actual performance",
                    "url": "https://www.performancehq.com/course/variance-analysis"
                },
                {
                    "id": "fm-fc-08",
                    "title": "Financial Forecasting",
                    "duration": "2 hours",
                    "platform": "PerformanceHQ",
                    "description": "Predicting financial performance and trends",
                    "url": "https://www.performancehq.com/course/financial-forecasting"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "Financial Statement Analysis & Valuation",
                    "type": "Book",
                    "description": "Advanced financial analysis techniques",
                    "url": "https://www.cengage.com/c/financial-statement-analysis-valuation-5e-easton"
                },
                {
                    "title": "Business Intelligence for Finance",
                    "type": "Course/Tool",
                    "description": "Using data analytics for financial insights",
                    "url": "https://www.tableau.com/learn/articles/financial-analysis"
                }
            ]
        }
    },
    "operational_management": {
        "process_improvement_efficiency": {
            "foundation_courses": [
                {
                    "id": "om-fc-01",
                    "title": "Lean Six Sigma Fundamentals",
                    "duration": "2.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Process improvement methodologies",
                    "url": "https://www.performancehq.com/course/lean-six-sigma"
                },
                {
                    "id": "om-fc-02",
                    "title": "Workflow Optimization",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Streamlining business processes",
                    "url": "https://www.performancehq.com/course/workflow-optimization"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "The Lean Startup",
                    "type": "Book",
                    "description": "Eric Ries' methodology for continuous improvement",
                    "url": "https://theleanstartup.com/"
                },
                {
                    "title": "Process Mining in Action",
                    "type": "Guide/Tool",
                    "description": "Data-driven process analysis and improvement",
                    "url": "https://www.celonis.com/process-mining/"
                }
            ]
        },
        "quality_control_standards": {
            "foundation_courses": [
                {
                    "id": "om-fc-03",
                    "title": "Quality Management Systems",
                    "duration": "2 hours",
                    "platform": "PerformanceHQ",
                    "description": "Implementing quality control processes",
                    "url": "https://www.performancehq.com/course/quality-management"
                },
                {
                    "id": "om-fc-04",
                    "title": "Customer Service Excellence",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Maintaining service quality standards",
                    "url": "https://www.performancehq.com/course/service-excellence"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "Total Quality Management",
                    "type": "Book",
                    "description": "Comprehensive approach to quality improvement",
                    "url": "https://www.pearson.com/us/higher-education/program/Evans-Managing-for-Quality-and-Performance-Excellence-11th-Edition/PGM2956992.html"
                },
                {
                    "title": "ISO 9001 Quality Standards",
                    "type": "Certification/Guide",
                    "description": "International quality management standards",
                    "url": "https://www.iso.org/iso-9001-quality-management.html"
                }
            ]
        },
        "safety_leadership_risk_awareness": {
            "foundation_courses": [
                {
                    "id": "om-fc-05",
                    "title": "Workplace Safety Management",
                    "duration": "2 hours",
                    "platform": "PerformanceHQ",
                    "description": "Creating safe work environments",
                    "url": "https://www.performancehq.com/course/workplace-safety"
                },
                {
                    "id": "om-fc-06",
                    "title": "Risk Assessment Methods",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Identifying and mitigating workplace risks",
                    "url": "https://www.performancehq.com/course/risk-assessment"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "Safety Leadership: A Practical Guide",
                    "type": "Book",
                    "description": "Building a culture of safety excellence",
                    "url": "https://www.nsc.org/safety-training/safety-leadership"
                },
                {
                    "title": "OSHA Compliance Guidelines",
                    "type": "Regulatory Guide",
                    "description": "Federal safety regulations and compliance",
                    "url": "https://www.osha.gov/compliance-assistance"
                }
            ]
        },
        "technology_system_optimization": {
            "foundation_courses": [
                {
                    "id": "om-fc-07",
                    "title": "Property Management Technology",
                    "duration": "2 hours",
                    "platform": "PerformanceHQ",
                    "description": "Leveraging technology for operational efficiency",
                    "url": "https://www.performancehq.com/course/proptech"
                },
                {
                    "id": "om-fc-08",
                    "title": "System Integration Best Practices",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Connecting and optimizing business systems",
                    "url": "https://www.performancehq.com/course/system-integration"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "Digital Transformation in Real Estate",
                    "type": "Industry Report",
                    "description": "Technology trends in property management",
                    "url": "https://www.pwc.com/us/en/industries/real-estate/library/real-estate-digital-transformation.html"
                },
                {
                    "title": "Automation and AI in Property Management",
                    "type": "Guide/Webinar",
                    "description": "Implementing intelligent automation solutions",
                    "url": "https://www.appfolio.com/resources/articles/property-management-automation/"
                }
            ]
        },
        "compliance_risk_management": {
            "foundation_courses": [
                {
                    "id": "om-fc-09",
                    "title": "Regulatory Compliance Fundamentals",
                    "duration": "2 hours",
                    "platform": "PerformanceHQ",
                    "description": "Understanding property management regulations",
                    "url": "https://www.performancehq.com/course/regulatory-compliance"
                },
                {
                    "id": "om-fc-10",
                    "title": "Risk Management Strategies",
                    "duration": "1.5 hours",
                    "platform": "PerformanceHQ",
                    "description": "Identifying and mitigating business risks",
                    "url": "https://www.performancehq.com/course/risk-management"
                }
            ],
            "dive_deeper_resources": [
                {
                    "title": "Fair Housing Act Compliance Guide",
                    "type": "Legal Guide",
                    "description": "Understanding and implementing fair housing practices",
                    "url": "https://www.hud.gov/program_offices/fair_housing_equal_opp"
                },
                {
                    "title": "Enterprise Risk Management Framework",
                    "type": "Methodology",
                    "description": "Comprehensive approach to organizational risk management",
                    "url": "https://www.coso.org/guidance-erm"
                }
            ]
        }
    }
}

print("This script contains additional component definitions.")
print("Components will be added manually to server.py for better control.")
print(f"Total additional components to add: {sum(len(sub_data.get('foundation_courses', [])) + len(sub_data.get('dive_deeper_resources', [])) for area_data in ADDITIONAL_COMPONENTS.values() for sub_data in area_data.values())}")