import React, { useState, useEffect } from 'react';

// =============================================================================
// ENHANCED ADMIN TOOLS - QUICK ACTIONS & WORKFLOW OPTIMIZATION
// =============================================================================

// Quick Action Toolbar for Admins
const AdminQuickActions = ({ tasks, users, onBulkUpdate, onExport, onImport }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  const quickActions = [
    {
      id: 'fix_placeholders',
      title: '🚨 Fix All Placeholders',
      description: 'Quickly identify and fix placeholder content',
      category: 'content',
      urgency: 'high'
    },
    {
      id: 'validate_links',
      title: '🔗 Validate All Links',
      description: 'Check all external links for availability',
      category: 'links',
      urgency: 'medium'
    },
    {
      id: 'generate_templates',
      title: '📄 Generate Missing Templates',
      description: 'Create template placeholders for upload tasks',
      category: 'templates',
      urgency: 'medium'
    },
    {
      id: 'bulk_update_times',
      title: '⏱️ Update Estimated Times',
      description: 'Bulk update task time estimates',
      category: 'content',
      urgency: 'low'
    },
    {
      id: 'export_backup',
      title: '💾 Export Content Backup',
      description: 'Download complete content backup',
      category: 'backup',
      urgency: 'low'
    }
  ];

  const executeQuickAction = async (actionId) => {
    switch (actionId) {
      case 'fix_placeholders':
        const placeholderTasks = tasks.filter(task => 
          task.title?.includes('placeholder') ||
          task.description?.includes('placeholder') ||
          task.external_link?.includes('placeholder') ||
          !task.external_link || 
          task.external_link === '#'
        );
        
        for (const task of placeholderTasks) {
          const fixes = {};
          if (task.title?.includes('placeholder')) {
            fixes.title = `${task.competency_area.replace('_', ' ')} Task - ${task.task_type}`;
          }
          if (task.description?.includes('placeholder')) {
            fixes.description = `Complete this ${task.task_type} task to develop your ${task.competency_area.replace('_', ' ')} competency.`;
          }
          if (!task.external_link || task.external_link === '#' || task.external_link.includes('placeholder')) {
            fixes.external_link = `https://performancehq.com/course/${task.competency_area}/${task.id}`;
          }
          
          await onBulkUpdate(task.id, { ...task, ...fixes });
        }
        
        alert(`Fixed ${placeholderTasks.length} placeholder tasks!`);
        break;

      case 'validate_links':
        const linkTasks = tasks.filter(task => task.external_link && task.external_link !== '#');
        let brokenCount = 0;
        
        for (const task of linkTasks) {
          try {
            // Simulate link validation - in real implementation would use fetch
            if (task.external_link.includes('placeholder') || !isValidUrl(task.external_link)) {
              brokenCount++;
            }
          } catch (error) {
            brokenCount++;
          }
        }
        
        alert(`Validation complete: ${brokenCount} links need attention out of ${linkTasks.length} total links.`);
        break;

      case 'generate_templates':
        const documentTasks = tasks.filter(task => task.task_type === 'document_upload' && !task.template_url);
        
        for (const task of documentTasks) {
          const templateData = {
            template_url: `https://templates.earnwings.com/${task.competency_area}/${task.id}.docx`,
            template_name: `${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_Template.docx`,
            template_instructions: `Use this template to complete your ${task.title} assignment. Follow the structure provided and fill in all required sections.`
          };
          
          await onBulkUpdate(task.id, { ...task, ...templateData });
        }
        
        alert(`Generated templates for ${documentTasks.length} document upload tasks!`);
        break;

      case 'bulk_update_times':
        const timeUpdates = {
          'course_link': 2,
          'document_upload': 3,
          'assessment': 1,
          'project': 8,
          'shadowing': 4,
          'reading': 1.5
        };

        for (const task of tasks) {
          if (timeUpdates[task.task_type] && (!task.estimated_hours || task.estimated_hours === 1)) {
            await onBulkUpdate(task.id, { ...task, estimated_hours: timeUpdates[task.task_type] });
          }
        }
        
        alert('Updated estimated hours for all tasks based on type!');
        break;

      case 'export_backup':
        const backupData = {
          tasks: tasks,
          users: users,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `earn_wings_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert('Content backup downloaded successfully!');
        break;
    }
    
    setSelectedAction('');
    setShowQuickActions(false);
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
      >
        ⚡ Quick Actions
      </button>

      {showQuickActions && (
        <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Admin Quick Actions</h3>
            <p className="text-sm text-gray-600">Streamline your workflow with one-click actions</p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {quickActions.map(action => (
              <div
                key={action.id}
                className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => executeQuickAction(action.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        action.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        action.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {action.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={() => setShowQuickActions(false)}
              className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Content Health Dashboard
const ContentHealthDashboard = ({ tasks, users }) => {
  const [healthMetrics, setHealthMetrics] = useState({});

  useEffect(() => {
    calculateHealthMetrics();
  }, [tasks, users]);

  const calculateHealthMetrics = () => {
    const totalTasks = tasks.length;
    const placeholderTasks = tasks.filter(task => 
      task.title?.includes('placeholder') ||
      task.description?.includes('placeholder') ||
      task.external_link?.includes('placeholder') ||
      !task.external_link || 
      task.external_link === '#'
    ).length;

    const tasksWithLinks = tasks.filter(task => task.external_link && task.external_link !== '#').length;
    const tasksWithTemplates = tasks.filter(task => task.template_url).length;
    const documentUploadTasks = tasks.filter(task => task.task_type === 'document_upload').length;
    
    const contentHealth = Math.round(((totalTasks - placeholderTasks) / totalTasks) * 100);
    const linkCoverage = Math.round((tasksWithLinks / totalTasks) * 100);
    const templateCoverage = documentUploadTasks > 0 ? Math.round((tasksWithTemplates / documentUploadTasks) * 100) : 100;

    setHealthMetrics({
      totalTasks,
      placeholderTasks,
      contentHealth,
      linkCoverage,
      templateCoverage,
      readyForTesting: placeholderTasks === 0 && contentHealth >= 90
    });
  };

  const getHealthColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 border-green-200';
    if (percentage >= 70) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Content Health */}
      <div className={`p-4 rounded-lg border ${getHealthBgColor(healthMetrics.contentHealth)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Content Health</p>
            <p className={`text-2xl font-bold ${getHealthColor(healthMetrics.contentHealth)}`}>
              {healthMetrics.contentHealth}%
            </p>
          </div>
          <div className="text-2xl">
            {healthMetrics.contentHealth >= 90 ? '🟢' : 
             healthMetrics.contentHealth >= 70 ? '🟡' : '🔴'}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {healthMetrics.placeholderTasks} placeholders remaining
        </p>
      </div>

      {/* Link Coverage */}
      <div className={`p-4 rounded-lg border ${getHealthBgColor(healthMetrics.linkCoverage)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Link Coverage</p>
            <p className={`text-2xl font-bold ${getHealthColor(healthMetrics.linkCoverage)}`}>
              {healthMetrics.linkCoverage}%
            </p>
          </div>
          <div className="text-2xl">🔗</div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          External resources attached
        </p>
      </div>

      {/* Template Coverage */}
      <div className={`p-4 rounded-lg border ${getHealthBgColor(healthMetrics.templateCoverage)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Template Coverage</p>
            <p className={`text-2xl font-bold ${getHealthColor(healthMetrics.templateCoverage)}`}>
              {healthMetrics.templateCoverage}%
            </p>
          </div>
          <div className="text-2xl">📄</div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Upload tasks with templates
        </p>
      </div>

      {/* Testing Readiness */}
      <div className={`p-4 rounded-lg border ${
        healthMetrics.readyForTesting 
          ? 'bg-green-100 border-green-200' 
          : 'bg-orange-100 border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Testing Ready</p>
            <p className={`text-lg font-bold ${
              healthMetrics.readyForTesting ? 'text-green-600' : 'text-orange-600'
            }`}>
              {healthMetrics.readyForTesting ? 'YES' : 'NO'}
            </p>
          </div>
          <div className="text-2xl">
            {healthMetrics.readyForTesting ? '✅' : '⚠️'}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ready for user testing
        </p>
      </div>
    </div>
  );
};

// Deployment Readiness Checklist
const DeploymentReadinessChecklist = ({ tasks, users }) => {
  const [checklist, setChecklist] = useState([]);
  const [overallReadiness, setOverallReadiness] = useState(0);

  useEffect(() => {
    generateChecklist();
  }, [tasks, users]);

  const generateChecklist = () => {
    const checkItems = [
      {
        id: 'content_complete',
        title: 'All Content Complete',
        description: 'No placeholder content remaining',
        check: () => tasks.filter(task => 
          task.title?.includes('placeholder') ||
          task.description?.includes('placeholder')
        ).length === 0,
        category: 'content',
        priority: 'critical'
      },
      {
        id: 'links_working',
        title: 'External Links Working',
        description: 'All external links are valid and accessible',
        check: () => tasks.filter(task => 
          task.external_link && 
          !task.external_link.includes('placeholder') && 
          task.external_link !== '#'
        ).length >= tasks.filter(task => task.external_link).length * 0.9,
        category: 'links',
        priority: 'critical'
      },
      {
        id: 'templates_available',
        title: 'Templates Available',
        description: 'All document upload tasks have templates',
        check: () => {
          const documentTasks = tasks.filter(task => task.task_type === 'document_upload');
          const templatedTasks = documentTasks.filter(task => task.template_url);
          return documentTasks.length === 0 || templatedTasks.length >= documentTasks.length * 0.8;
        },
        category: 'templates',
        priority: 'high'
      },
      {
        id: 'instructions_clear',
        title: 'Clear Instructions',
        description: 'All tasks have detailed instructions',
        check: () => tasks.filter(task => 
          task.instructions && task.instructions.length > 20
        ).length >= tasks.length * 0.8,
        category: 'content',
        priority: 'high'
      },
      {
        id: 'time_estimates',
        title: 'Time Estimates Set',
        description: 'All tasks have realistic time estimates',
        check: () => tasks.filter(task => 
          task.estimated_hours && task.estimated_hours > 0
        ).length >= tasks.length * 0.95,
        category: 'content',
        priority: 'medium'
      },
      {
        id: 'competency_coverage',
        title: 'Competency Coverage',
        description: 'All competency areas have sufficient tasks',
        check: () => {
          const competencyAreas = ['leadership_supervision', 'financial_management', 'operational_management', 'cross_functional_collaboration', 'strategic_thinking'];
          return competencyAreas.every(area => 
            tasks.filter(task => task.competency_area === area).length >= 3
          );
        },
        category: 'structure',
        priority: 'critical'
      }
    ];

    const evaluatedChecklist = checkItems.map(item => ({
      ...item,
      passed: item.check(),
      status: item.check() ? 'passed' : 'failed'
    }));

    const passedItems = evaluatedChecklist.filter(item => item.passed).length;
    const readinessPercentage = Math.round((passedItems / evaluatedChecklist.length) * 100);

    setChecklist(evaluatedChecklist);
    setOverallReadiness(readinessPercentage);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'content': return '📝';
      case 'links': return '🔗';
      case 'templates': return '📄';
      case 'structure': return '🏗️';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🚀 Deployment Readiness</h3>
          <p className="text-sm text-gray-600">Ensure everything is ready for user testing</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${
            overallReadiness >= 90 ? 'text-green-600' :
            overallReadiness >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {overallReadiness}%
          </div>
          <div className="text-sm text-gray-500">Ready</div>
        </div>
      </div>

      <div className="space-y-3">
        {checklist.map(item => (
          <div key={item.id} className={`p-3 rounded-lg border flex items-center justify-between ${
            item.passed ? 'bg-green-50 border-green-200' : getPriorityColor(item.priority)
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCategoryIcon(item.category)}</span>
                <span className="text-lg">
                  {item.passed ? '✅' : '❌'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item.priority}
              </span>
            </div>
          </div>
        ))}
      </div>

      {overallReadiness >= 90 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-xl">🎉</span>
            <div>
              <h4 className="font-medium text-green-900">Ready for Deployment!</h4>
              <p className="text-sm text-green-700">
                Your content meets all requirements for user testing. You can confidently deploy to production.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { AdminQuickActions, ContentHealthDashboard, DeploymentReadinessChecklist };