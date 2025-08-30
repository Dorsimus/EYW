#!/usr/bin/env python3
"""
Comprehensive Leadership & Supervision Task Creation Script
Creates production-ready tasks for all 4 sub-competencies with proper database integration
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime
import uuid

# Add backend to path for imports
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

class LeadershipTaskCreator:
    def __init__(self):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        self.tasks_collection = self.db.tasks
        
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
    
    def create_task_dict(self, title, description, task_type, sub_competency, order, 
                        required=True, estimated_hours=None, external_link=None, 
                        instructions=None, metadata=None):
        """Create a standardized task dictionary"""
        return {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "task_type": task_type,
            "competency_area": "leadership_supervision",
            "sub_competency": sub_competency,
            "order": order,
            "required": required,
            "estimated_hours": estimated_hours,
            "external_link": external_link,
            "instructions": instructions,
            "metadata": metadata or {},
            "created_by": "system",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "active": True
        }
    
    def get_inspiring_team_motivation_tasks(self):
        """Create all tasks for inspiring_team_motivation sub-competency"""
        tasks = []
        
        # Foundation Course
        tasks.append(self.create_task_dict(
            title="Employee Motivation Foundation Course",
            description="Why people do what they do - foundational understanding of human motivation in the workplace",
            task_type="foundation_course",
            sub_competency="inspiring_team_motivation",
            order=1,
            required=True,
            estimated_hours=1.0,
            external_link="https://performancehq.com/employee-motivation",
            instructions="Complete the full course including all interactive modules. Take notes on key insights about what drives different personality types.",
            metadata={
                "platform": "PerformanceHQ",
                "course_duration": "1 hour",
                "core_learning_question": "What makes someone excited to come to work for me specifically?"
            }
        ))
        
        # Month 1 Activities
        tasks.append(self.create_task_dict(
            title="Leadership Style Discovery",
            description="During regular one-on-ones, discover what motivates each team member individually",
            task_type="reflection_activity",
            sub_competency="inspiring_team_motivation",
            order=2,
            required=True,
            estimated_hours=2.0,
            instructions="During your regular one-on-ones, ask each team member:\n• 'When do you feel most energized at work?'\n• 'What kind of support helps you do your best work?'\n• 'How do you like to receive feedback?'\n\nTake notes and then document what you learn.",
            metadata={
                "activity_type": "in_the_flow",
                "time_commitment": "10 minutes weekly",
                "month": 1,
                "documentation_required": "Simple Leadership Style Notes"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Leadership Style Pattern Recognition",
            description="Reflect on patterns discovered in team member motivations and leadership approach",
            task_type="journal_prompt",
            sub_competency="inspiring_team_motivation",
            order=3,
            required=True,
            estimated_hours=0.5,
            instructions="After completing your leadership style discovery conversations, spend 15-30 minutes reflecting on these questions and document your insights.",
            metadata={
                "reflection_prompt": "What patterns do I see in what motivates different people?",
                "journal_type": "weekly_reflection",
                "month": 1
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Individual Motivation Plan Creation",
            description="Create personalized motivation approaches for each team member based on discoveries",
            task_type="document_creation",
            sub_competency="inspiring_team_motivation",
            order=4,
            required=True,
            estimated_hours=3.0,
            instructions="Using your leadership style discovery notes, create a simple one-page motivation plan for each team member. Include their energy sources, preferred support style, and feedback preferences.",
            metadata={
                "document_type": "motivation_plan",
                "template_provided": True,
                "month": 1
            }
        ))
        
        # Month 2 Activities
        tasks.append(self.create_task_dict(
            title="Meeting Energy Assessment",
            description="Evaluate and improve team meeting engagement and energy levels",
            task_type="reflection_activity",
            sub_competency="inspiring_team_motivation",
            order=5,
            required=True,
            estimated_hours=1.5,
            instructions="For 2 weeks, observe team meeting energy levels. Rate engagement 1-10 at start and end of each meeting. Document what increases or decreases energy.",
            metadata={
                "activity_type": "observation_tracking",
                "duration": "2 weeks",
                "month": 2,
                "measurement_tool": "energy_rating_scale"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Meeting Innovation Implementation",
            description="Implement three meeting improvements based on energy assessment findings",
            task_type="integration_activity",
            sub_competency="inspiring_team_motivation",
            order=6,
            required=True,
            estimated_hours=2.0,
            instructions="Based on your meeting energy assessment, implement 3 specific improvements. Examples: start with wins, change meeting format, add interactive elements, adjust timing.",
            metadata={
                "implementation_type": "meeting_improvement",
                "required_improvements": 3,
                "month": 2,
                "cross_functional_connection": "operational_management"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Recognition System Design",
            description="Create a personalized recognition system that matches individual motivation styles",
            task_type="document_creation",
            sub_competency="inspiring_team_motivation",
            order=7,
            required=True,
            estimated_hours=2.5,
            instructions="Design a recognition system that incorporates different recognition styles (public, private, peer-to-peer, achievement-based, etc.) based on your team's individual preferences.",
            metadata={
                "document_type": "recognition_system",
                "customization_level": "individual",
                "month": 2
            }
        ))
        
        # Month 3 Activities
        tasks.append(self.create_task_dict(
            title="Motivation Challenge Response",
            description="Handle a real motivation challenge using learned techniques and document the approach",
            task_type="reflection_activity",
            sub_competency="inspiring_team_motivation",
            order=8,
            required=True,
            estimated_hours=3.0,
            instructions="When you encounter a team member motivation challenge, apply your learned techniques. Document the situation, approach used, results, and lessons learned.",
            metadata={
                "activity_type": "real_world_application",
                "documentation_required": "challenge_response_case_study",
                "month": 3
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Team Motivation Curiosity Journal",
            description="Weekly reflection on motivation insights and questions that arise",
            task_type="journal_prompt",
            sub_competency="inspiring_team_motivation",
            order=9,
            required=True,
            estimated_hours=1.0,
            instructions="Each week, spend 15 minutes reflecting: What did I notice about motivation this week? What questions do I have? What would I like to try next?",
            metadata={
                "journal_type": "curiosity_exploration",
                "frequency": "weekly",
                "month": 3,
                "reflection_prompts": ["What surprised me?", "What questions emerged?", "What do I want to experiment with?"]
            }
        ))
        
        # Competency Gate
        tasks.append(self.create_task_dict(
            title="Inspiring Team Motivation Competency Gate",
            description="Demonstrate mastery of team motivation through comprehensive portfolio review",
            task_type="assessment",
            sub_competency="inspiring_team_motivation",
            order=10,
            required=True,
            estimated_hours=2.0,
            instructions="Compile your motivation discovery notes, individual plans, meeting improvements, recognition system, and challenge response into a portfolio. Present to your manager showing growth in motivating your team.",
            metadata={
                "assessment_type": "competency_gate",
                "portfolio_required": True,
                "presentation_component": True,
                "mastery_criteria": ["Individual understanding", "System creation", "Real application", "Results demonstration"]
            }
        ))
        
        return tasks
    
    def get_mastering_difficult_conversations_tasks(self):
        """Create all tasks for mastering_difficult_conversations sub-competency"""
        tasks = []
        
        # Foundation Courses (2 courses)
        tasks.append(self.create_task_dict(
            title="Difficult Conversations Foundation Course",
            description="Core principles and frameworks for navigating challenging workplace conversations",
            task_type="foundation_course",
            sub_competency="mastering_difficult_conversations",
            order=1,
            required=True,
            estimated_hours=1.5,
            external_link="https://performancehq.com/difficult-conversations",
            instructions="Complete all modules focusing on preparation, delivery, and follow-up techniques. Practice the conversation frameworks provided.",
            metadata={
                "platform": "PerformanceHQ",
                "course_duration": "1.5 hours",
                "core_learning_question": "How do I have conversations that strengthen relationships while addressing real issues?"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Emotional Intelligence in Conversations Course",
            description="Understanding and managing emotions during difficult workplace discussions",
            task_type="foundation_course",
            sub_competency="mastering_difficult_conversations",
            order=2,
            required=True,
            estimated_hours=1.0,
            external_link="https://performancehq.com/emotional-intelligence-conversations",
            instructions="Focus on recognizing emotional triggers, managing your own reactions, and responding to others' emotions constructively.",
            metadata={
                "platform": "PerformanceHQ",
                "course_duration": "1 hour",
                "core_learning_question": "How do I stay centered and constructive when emotions run high?"
            }
        ))
        
        # Month 1 Activities
        tasks.append(self.create_task_dict(
            title="Conversation Preparation Framework Practice",
            description="Practice structured preparation for upcoming difficult conversations",
            task_type="reflection_activity",
            sub_competency="mastering_difficult_conversations",
            order=3,
            required=True,
            estimated_hours=2.0,
            instructions="For each difficult conversation you need to have, use the preparation framework: clarify your intention, anticipate reactions, plan your opening, identify desired outcomes. Document your preparation process.",
            metadata={
                "activity_type": "preparation_practice",
                "framework": "intention_reaction_opening_outcome",
                "month": 1,
                "documentation_required": "preparation_notes"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Conversation Outcome Reflection",
            description="Reflect on difficult conversation outcomes and improvement opportunities",
            task_type="journal_prompt",
            sub_competency="mastering_difficult_conversations",
            order=4,
            required=True,
            estimated_hours=1.0,
            instructions="After each difficult conversation, spend 10-15 minutes reflecting: What went well? What was challenging? What would I do differently? How did the relationship change?",
            metadata={
                "reflection_prompt": "What did I learn about having difficult conversations?",
                "journal_type": "post_conversation_reflection",
                "month": 1
            }
        ))
        
        # Month 2 Activities
        tasks.append(self.create_task_dict(
            title="Conflict De-escalation Practice",
            description="Practice de-escalation techniques in real workplace situations",
            task_type="reflection_activity",
            sub_competency="mastering_difficult_conversations",
            order=5,
            required=True,
            estimated_hours=2.5,
            instructions="When you encounter workplace tension or conflict, practice de-escalation techniques: active listening, acknowledging emotions, finding common ground, refocusing on solutions.",
            metadata={
                "activity_type": "skill_application",
                "techniques": ["active_listening", "emotion_acknowledgment", "common_ground", "solution_focus"],
                "month": 2
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Feedback Delivery Improvement",
            description="Enhance feedback delivery skills through structured practice and observation",
            task_type="integration_activity",
            sub_competency="mastering_difficult_conversations",
            order=6,
            required=True,
            estimated_hours=3.0,
            instructions="Practice giving both corrective and developmental feedback using the SBI model (Situation-Behavior-Impact). Focus on specific, observable behaviors and their effects.",
            metadata={
                "implementation_type": "feedback_improvement",
                "model": "SBI_situation_behavior_impact",
                "month": 2,
                "cross_functional_connection": "developing_others_success"
            }
        ))
        
        # Month 3 Activities
        tasks.append(self.create_task_dict(
            title="Crucial Conversation Case Study",
            description="Document and analyze a particularly challenging conversation you navigated successfully",
            task_type="document_creation",
            sub_competency="mastering_difficult_conversations",
            order=7,
            required=True,
            estimated_hours=2.0,
            instructions="Write a detailed case study of a difficult conversation including: context, preparation, approach, challenges encountered, how you adapted, outcomes, and lessons learned.",
            metadata={
                "document_type": "case_study",
                "components": ["context", "preparation", "execution", "adaptation", "outcomes", "lessons"],
                "month": 3
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Conversation Skills Curiosity Journal",
            description="Explore questions and insights about difficult conversation mastery",
            task_type="journal_prompt",
            sub_competency="mastering_difficult_conversations",
            order=8,
            required=True,
            estimated_hours=1.0,
            instructions="Weekly reflection: What patterns do I notice in difficult conversations? What questions am I curious about? How are my conversation skills evolving?",
            metadata={
                "journal_type": "curiosity_exploration",
                "frequency": "weekly",
                "month": 3,
                "reflection_prompts": ["What patterns emerge?", "What am I curious about?", "How am I growing?"]
            }
        ))
        
        # Competency Gate
        tasks.append(self.create_task_dict(
            title="Mastering Difficult Conversations Competency Gate",
            description="Demonstrate conversation mastery through portfolio and live conversation assessment",
            task_type="assessment",
            sub_competency="mastering_difficult_conversations",
            order=9,
            required=True,
            estimated_hours=2.5,
            instructions="Present your conversation preparation notes, reflection journals, case study, and demonstrate conversation skills in a role-play scenario with your manager.",
            metadata={
                "assessment_type": "competency_gate",
                "portfolio_required": True,
                "demonstration_component": True,
                "mastery_criteria": ["Preparation skills", "Emotional regulation", "Constructive delivery", "Relationship preservation"]
            }
        ))
        
        return tasks
    
    def get_building_collaborative_culture_tasks(self):
        """Create all tasks for building_collaborative_culture sub-competency"""
        tasks = []
        
        # Foundation Courses (2 courses)
        tasks.append(self.create_task_dict(
            title="Team Collaboration Fundamentals Course",
            description="Building high-performing collaborative teams through trust, communication, and shared purpose",
            task_type="foundation_course",
            sub_competency="building_collaborative_culture",
            order=1,
            required=True,
            estimated_hours=1.5,
            external_link="https://performancehq.com/team-collaboration",
            instructions="Complete all modules on trust-building, communication patterns, and creating psychological safety. Focus on practical team-building techniques.",
            metadata={
                "platform": "PerformanceHQ",
                "course_duration": "1.5 hours",
                "core_learning_question": "How do I create an environment where people naturally want to work together?"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Cross-Functional Partnership Course",
            description="Breaking down silos and building effective partnerships across departments",
            task_type="foundation_course",
            sub_competency="building_collaborative_culture",
            order=2,
            required=True,
            estimated_hours=1.0,
            external_link="https://performancehq.com/cross-functional-partnerships",
            instructions="Learn strategies for understanding other departments, building mutual respect, and creating win-win partnerships that benefit residents and the property.",
            metadata={
                "platform": "PerformanceHQ",
                "course_duration": "1 hour",
                "core_learning_question": "How do I build bridges that make the whole property stronger?"
            }
        ))
        
        # Month 1 Activities
        tasks.append(self.create_task_dict(
            title="Team Collaboration Assessment",
            description="Evaluate current team collaboration patterns and identify improvement opportunities",
            task_type="reflection_activity",
            sub_competency="building_collaborative_culture",
            order=3,
            required=True,
            estimated_hours=2.0,
            instructions="Observe team interactions for 2 weeks. Note: How do team members support each other? Where do silos exist? What encourages or discourages collaboration? Document patterns.",
            metadata={
                "activity_type": "collaboration_assessment",
                "observation_period": "2 weeks",
                "month": 1,
                "focus_areas": ["mutual_support", "information_sharing", "problem_solving", "conflict_resolution"]
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Collaboration Barrier Analysis",
            description="Identify and analyze barriers preventing effective team collaboration",
            task_type="journal_prompt",
            sub_competency="building_collaborative_culture",
            order=4,
            required=True,
            estimated_hours=1.0,
            instructions="Reflect on your collaboration assessment: What prevents people from working together effectively? Are barriers structural, cultural, or individual? What's within your influence to change?",
            metadata={
                "reflection_prompt": "What gets in the way of collaboration, and what can I influence?",
                "journal_type": "barrier_analysis",
                "month": 1
            }
        ))
        
        # Month 2 Activities
        tasks.append(self.create_task_dict(
            title="Cross-Department Partnership Building",
            description="Initiate and develop a meaningful partnership with another department",
            task_type="integration_activity",
            sub_competency="building_collaborative_culture",
            order=5,
            required=True,
            estimated_hours=4.0,
            instructions="Choose another department and build a specific partnership. Meet with their leader, understand their challenges, identify mutual benefits, and create a joint initiative that helps both departments.",
            metadata={
                "implementation_type": "partnership_building",
                "partnership_scope": "interdepartmental",
                "month": 2,
                "cross_functional_connection": "cross_functional_collaboration"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Team Collaboration Experiment",
            description="Implement one collaboration-enhancing change and measure its impact",
            task_type="reflection_activity",
            sub_competency="building_collaborative_culture",
            order=6,
            required=True,
            estimated_hours=3.0,
            instructions="Based on your barrier analysis, implement one change to improve collaboration (e.g., shared goals, regular check-ins, cross-training, joint problem-solving sessions). Track results for 4 weeks.",
            metadata={
                "activity_type": "collaboration_experiment",
                "duration": "4 weeks",
                "measurement_required": True,
                "month": 2
            }
        ))
        
        # Month 3 Activities
        tasks.append(self.create_task_dict(
            title="Collaborative Culture Documentation",
            description="Document the collaborative culture you're building and its impact on team performance",
            task_type="document_creation",
            sub_competency="building_collaborative_culture",
            order=7,
            required=True,
            estimated_hours=2.5,
            instructions="Create a document showing: current collaboration strengths, improvements implemented, partnership developed, results achieved, and vision for continued culture development.",
            metadata={
                "document_type": "culture_development_report",
                "components": ["current_state", "improvements", "partnerships", "results", "future_vision"],
                "month": 3
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Collaboration Curiosity Journal",
            description="Explore questions and insights about building collaborative culture",
            task_type="journal_prompt",
            sub_competency="building_collaborative_culture",
            order=8,
            required=True,
            estimated_hours=1.0,
            instructions="Weekly reflection: What am I learning about collaboration? What questions intrigue me? How is our team culture evolving? What do I want to try next?",
            metadata={
                "journal_type": "curiosity_exploration",
                "frequency": "weekly",
                "month": 3,
                "reflection_prompts": ["What am I discovering?", "What questions fascinate me?", "How are we evolving?"]
            }
        ))
        
        # Competency Gate
        tasks.append(self.create_task_dict(
            title="Building Collaborative Culture Competency Gate",
            description="Demonstrate culture-building mastery through portfolio and team collaboration showcase",
            task_type="assessment",
            sub_competency="building_collaborative_culture",
            order=9,
            required=True,
            estimated_hours=3.0,
            instructions="Present your collaboration assessment, partnership development, culture experiments, and results. Include team feedback on collaboration improvements and demonstrate ongoing culture-building strategies.",
            metadata={
                "assessment_type": "competency_gate",
                "portfolio_required": True,
                "team_feedback_component": True,
                "mastery_criteria": ["Assessment skills", "Partnership building", "Culture change", "Sustained improvement"]
            }
        ))
        
        return tasks
    
    def get_developing_others_success_tasks(self):
        """Create all tasks for developing_others_success sub-competency"""
        tasks = []
        
        # Foundation Course
        tasks.append(self.create_task_dict(
            title="Coaching and Development Foundation Course",
            description="Essential skills for developing others through coaching, mentoring, and growth opportunities",
            task_type="foundation_course",
            sub_competency="developing_others_success",
            order=1,
            required=True,
            estimated_hours=1.5,
            external_link="https://performancehq.com/coaching-development",
            instructions="Complete all modules on coaching techniques, development planning, and creating growth opportunities. Focus on shifting from managing to developing people.",
            metadata={
                "platform": "PerformanceHQ",
                "course_duration": "1.5 hours",
                "core_learning_question": "How do I help each person become the best version of themselves at work?"
            }
        ))
        
        # Month 1 Activities
        tasks.append(self.create_task_dict(
            title="Individual Development Planning",
            description="Create comprehensive development plans for each team member",
            task_type="document_creation",
            sub_competency="developing_others_success",
            order=2,
            required=True,
            estimated_hours=4.0,
            instructions="Work with each team member to create a development plan including: strengths assessment, growth goals, skill development opportunities, career aspirations, and specific action steps.",
            metadata={
                "document_type": "development_plan",
                "individualized": True,
                "components": ["strengths", "goals", "opportunities", "aspirations", "actions"],
                "month": 1
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Coaching Conversation Practice",
            description="Practice coaching conversations focused on development rather than direction",
            task_type="reflection_activity",
            sub_competency="developing_others_success",
            order=3,
            required=True,
            estimated_hours=3.0,
            instructions="In your regular one-on-ones, practice coaching techniques: ask powerful questions, listen for potential, help people find their own solutions, focus on growth and learning.",
            metadata={
                "activity_type": "coaching_practice",
                "techniques": ["powerful_questions", "active_listening", "solution_finding", "growth_focus"],
                "month": 1
            }
        ))
        
        # Month 2 Activities
        tasks.append(self.create_task_dict(
            title="Growth Opportunity Creation",
            description="Create specific growth opportunities for team members based on their development plans",
            task_type="integration_activity",
            sub_competency="developing_others_success",
            order=4,
            required=True,
            estimated_hours=3.5,
            instructions="For each team member, create at least one growth opportunity: stretch assignment, cross-training, project leadership, skill-building challenge, or mentoring opportunity.",
            metadata={
                "implementation_type": "opportunity_creation",
                "opportunity_types": ["stretch_assignments", "cross_training", "project_leadership", "skill_building", "mentoring"],
                "month": 2,
                "cross_functional_connection": "strategic_thinking"
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Development Progress Tracking",
            description="Track and support team member progress on development goals",
            task_type="reflection_activity",
            sub_competency="developing_others_success",
            order=5,
            required=True,
            estimated_hours=2.0,
            instructions="Weekly check-ins on development progress: What's working? What challenges are emerging? How can you provide better support? Adjust plans as needed.",
            metadata={
                "activity_type": "progress_tracking",
                "frequency": "weekly",
                "focus": "support_and_adjustment",
                "month": 2
            }
        ))
        
        # Month 3 Activities
        tasks.append(self.create_task_dict(
            title="Success Story Documentation",
            description="Document development success stories showing your impact on others' growth",
            task_type="document_creation",
            sub_competency="developing_others_success",
            order=6,
            required=True,
            estimated_hours=2.5,
            instructions="Write 2-3 success stories showing how your development efforts helped team members grow. Include: initial state, development approach, challenges overcome, results achieved, and ongoing growth.",
            metadata={
                "document_type": "success_stories",
                "story_count": "2-3",
                "components": ["initial_state", "approach", "challenges", "results", "ongoing_growth"],
                "month": 3
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Development Impact Reflection",
            description="Reflect on your growth as a developer of others and future development strategies",
            task_type="journal_prompt",
            sub_competency="developing_others_success",
            order=7,
            required=True,
            estimated_hours=1.0,
            instructions="Reflect: How has my approach to developing others evolved? What impact am I having on people's growth? What development strategies work best? What do I want to learn next?",
            metadata={
                "reflection_prompt": "How am I growing as a developer of others?",
                "journal_type": "development_impact_reflection",
                "month": 3
            }
        ))
        
        tasks.append(self.create_task_dict(
            title="Development Curiosity Journal",
            description="Explore questions and insights about developing others for success",
            task_type="journal_prompt",
            sub_competency="developing_others_success",
            order=8,
            required=True,
            estimated_hours=1.0,
            instructions="Weekly reflection: What am I learning about human development? What questions intrigue me about helping others grow? How can I become an even better developer of people?",
            metadata={
                "journal_type": "curiosity_exploration",
                "frequency": "weekly",
                "month": 3,
                "reflection_prompts": ["What am I learning?", "What questions intrigue me?", "How can I improve?"]
            }
        ))
        
        # Competency Gate
        tasks.append(self.create_task_dict(
            title="Developing Others Success Competency Gate",
            description="Demonstrate development mastery through portfolio and team member feedback",
            task_type="assessment",
            sub_competency="developing_others_success",
            order=9,
            required=True,
            estimated_hours=3.0,
            instructions="Present development plans, success stories, and growth opportunities created. Include feedback from team members on your development support and demonstrate ongoing development strategies.",
            metadata={
                "assessment_type": "competency_gate",
                "portfolio_required": True,
                "team_feedback_component": True,
                "mastery_criteria": ["Development planning", "Coaching skills", "Opportunity creation", "Growth impact"]
            }
        ))
        
        return tasks
    
    def get_culminating_project_tasks(self):
        """Create culminating project tasks that integrate all sub-competencies"""
        tasks = []
        
        tasks.append(self.create_task_dict(
            title="Leadership & Supervision Integration Project",
            description="Comprehensive project demonstrating mastery across all leadership sub-competencies",
            task_type="culminating_project",
            sub_competency="inspiring_team_motivation",  # Primary sub-competency
            order=11,
            required=True,
            estimated_hours=8.0,
            instructions="Design and implement a comprehensive leadership initiative that demonstrates: team motivation strategies, difficult conversation skills, collaborative culture building, and others' development. Document the project plan, implementation, results, and integration of all competencies.",
            metadata={
                "project_type": "integration_capstone",
                "competencies_integrated": ["inspiring_team_motivation", "mastering_difficult_conversations", "building_collaborative_culture", "developing_others_success"],
                "deliverables": ["project_plan", "implementation_documentation", "results_analysis", "competency_integration_reflection"],
                "presentation_required": True
            }
        ))
        
        return tasks
    
    async def create_all_leadership_tasks(self):
        """Create and insert all leadership & supervision tasks"""
        print("🚀 Creating comprehensive Leadership & Supervision tasks...")
        
        all_tasks = []
        
        # Get tasks for each sub-competency
        all_tasks.extend(self.get_inspiring_team_motivation_tasks())
        all_tasks.extend(self.get_mastering_difficult_conversations_tasks())
        all_tasks.extend(self.get_building_collaborative_culture_tasks())
        all_tasks.extend(self.get_developing_others_success_tasks())
        all_tasks.extend(self.get_culminating_project_tasks())
        
        print(f"📝 Created {len(all_tasks)} tasks across 4 sub-competencies")
        
        # Clear existing leadership_supervision tasks
        delete_result = await self.tasks_collection.delete_many({
            "competency_area": "leadership_supervision"
        })
        print(f"🗑️ Removed {delete_result.deleted_count} existing leadership tasks")
        
        # Insert new tasks
        if all_tasks:
            insert_result = await self.tasks_collection.insert_many(all_tasks)
            print(f"✅ Successfully inserted {len(insert_result.inserted_ids)} new tasks")
            
            # Verify insertion
            count = await self.tasks_collection.count_documents({
                "competency_area": "leadership_supervision",
                "active": True
            })
            print(f"📊 Database now contains {count} active leadership tasks")
            
            # Show breakdown by sub-competency
            pipeline = [
                {"$match": {"competency_area": "leadership_supervision", "active": True}},
                {"$group": {"_id": "$sub_competency", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            breakdown = await self.tasks_collection.aggregate(pipeline).to_list(None)
            print("\n📈 Task breakdown by sub-competency:")
            for item in breakdown:
                print(f"   • {item['_id']}: {item['count']} tasks")
            
            # Show task types distribution
            type_pipeline = [
                {"$match": {"competency_area": "leadership_supervision", "active": True}},
                {"$group": {"_id": "$task_type", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            type_breakdown = await self.tasks_collection.aggregate(type_pipeline).to_list(None)
            print("\n🎯 Task type distribution:")
            for item in type_breakdown:
                print(f"   • {item['_id']}: {item['count']} tasks")
            
            return True
        else:
            print("❌ No tasks were created")
            return False

async def main():
    """Main execution function"""
    creator = LeadershipTaskCreator()
    
    try:
        # Test database connection
        await creator.db.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        # Create all tasks
        success = await creator.create_all_leadership_tasks()
        
        if success:
            print("\n🎉 Leadership & Supervision task creation completed successfully!")
            print("\n📋 Summary:")
            print("   • 4 sub-competencies fully implemented")
            print("   • Foundation courses for each area")
            print("   • 3 months of progressive activities per sub-competency")
            print("   • Multiple task types: foundation_course, reflection_activity, journal_prompt, document_creation, integration_activity, assessment")
            print("   • Competency gates for mastery validation")
            print("   • Culminating integration project")
            print("   • Rich metadata for admin panel customization")
            print("   • Cross-functional connections to other competencies")
        else:
            print("❌ Task creation failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await creator.close()

if __name__ == "__main__":
    asyncio.run(main())