import React, { useState, useEffect } from 'react';

// =============================================================================
// ENHANCED CONTENT MANAGEMENT SYSTEM FOR EARN YOUR WINGS PLATFORM
// =============================================================================

// Enhanced Task Management Interface with Modern UX
const EnhancedTaskEditor = ({ task, onSave, onCancel, competencyAreas }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    instructions: task?.instructions || '',
    competency_area: task?.competency_area || 'leadership_supervision',
    sub_competency: task?.sub_competency || '',
    task_type: task?.task_type || 'document_upload',
    estimated_hours: task?.estimated_hours || 1,
    external_link: task?.external_link || '',
    required: task?.required !== undefined ? task.required : true,
    order: task?.order || 1,
    template_url: task?.template_url || '',
    success_criteria: task?.success_criteria || '',
    examples: task?.examples || '',
    tags: task?.tags || []
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');

  const taskTypes = [
    { value: 'course_link', label: '🎓 Course/Training', description: 'External course or training module' },
    { value: 'document_upload', label: '📄 Document Upload', description: 'File upload with template support' },
    { value: 'assessment', label: '📊 Assessment', description: 'Quiz, survey, or evaluation' },
    { value: 'project', label: '🎯 Project', description: 'Multi-step project or initiative' },
    { value: 'shadowing', label: '👥 Shadowing', description: 'Observation or mentoring activity' },
    { value: 'reading', label: '📚 Reading', description: 'Article, book, or research material' },
    { value: 'reflection', label: '💭 Reflection', description: 'Journal entry or thought exercise' }
  ];

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...task, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {task?.id ? '✏️ Edit Task' : '➕ Create New Task'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Design engaging learning experiences for Navigator participants
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewMode 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {previewMode ? '📝 Edit' : '👁️ Preview'}
            </button>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {previewMode ? (
            // Preview Mode
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">
                    {taskTypes.find(t => t.value === formData.task_type)?.label?.split(' ')[0] || '📋'}
                  </span>
                  <h3 className="text-xl font-bold text-blue-900">{formData.title}</h3>
                  {formData.required && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Required</span>
                  )}
                </div>
                <p className="text-blue-800 mb-3">{formData.description}</p>
                <div className="text-sm text-blue-700">
                  <strong>Estimated Time:</strong> {formData.estimated_hours} hour{formData.estimated_hours !== 1 ? 's' : ''}
                </div>
              </div>

              {formData.instructions && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">📋 Instructions</h4>
                  <div className="text-yellow-800 whitespace-pre-wrap">{formData.instructions}</div>
                </div>
              )}

              {formData.success_criteria && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Success Criteria</h4>
                  <div className="text-green-800 whitespace-pre-wrap">{formData.success_criteria}</div>
                </div>
              )}

              {formData.external_link && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2">🔗 External Resource</h4>
                  <a 
                    href={formData.external_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline"
                  >
                    {formData.external_link}
                  </a>
                </div>
              )}

              {formData.template_url && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">📄 Template</h4>
                  <a 
                    href={formData.template_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline"
                  >
                    Download Template
                  </a>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Task Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter engaging task title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📖 Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of what participants will accomplish..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📋 Detailed Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Step-by-step instructions for completing this task..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ✅ Success Criteria
                    </label>
                    <textarea
                      value={formData.success_criteria}
                      onChange={(e) => setFormData({ ...formData, success_criteria: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="How will participants know they've completed this successfully?"
                    />
                  </div>
                </div>

                {/* Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Competency Area *
                    </label>
                    <select
                      value={formData.competency_area}
                      onChange={(e) => setFormData({ ...formData, competency_area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {competencyAreas.map(area => (
                        <option key={area.key} value={area.key}>{area.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📚 Task Type *
                    </label>
                    <div className="space-y-2">
                      {taskTypes.map(type => (
                        <label key={type.value} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="task_type"
                            value={type.value}
                            checked={formData.task_type === type.value}
                            onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                            className="mr-3 text-blue-600"
                          />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-600">{type.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⏱️ Estimated Hours
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="40"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📊 Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.required}
                        onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Required Task</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Resources & Links */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">🔗 Resources & Links</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🌐 External Link/Course URL
                    </label>
                    <input
                      type="url"
                      value={formData.external_link}
                      onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/course"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📄 Template/Resource URL
                    </label>
                    <input
                      type="url"
                      value={formData.template_url}
                      onChange={(e) => setFormData({ ...formData, template_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/template.docx"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {task?.id ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Content Management with Modern Interface

const ContentManagement = ({ tasks, competencies, onUpdateTask, onCreateTask, onDeleteTask }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedCompetency, setSelectedCompetency] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'timeline'
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('order');

  const competencyAreas = [
    { key: 'all', name: 'All Competencies', count: tasks.length },
    { key: 'leadership_supervision', name: 'Leadership & Supervision', count: tasks.filter(t => t.competency_area === 'leadership_supervision').length },
    { key: 'financial_management', name: 'Financial Management', count: tasks.filter(t => t.competency_area === 'financial_management').length },
    { key: 'operational_management', name: 'Operational Management', count: tasks.filter(t => t.competency_area === 'operational_management').length },
    { key: 'cross_functional_collaboration', name: 'Cross-Functional Collaboration', count: tasks.filter(t => t.competency_area === 'cross_functional_collaboration').length },
    { key: 'strategic_thinking', name: 'Strategic Thinking & Planning', count: tasks.filter(t => t.competency_area === 'strategic_thinking').length }
  ];

  const taskTypes = [
    { value: 'course_link', label: '🎓 Course/Training', color: 'blue' },
    { value: 'document_upload', label: '📄 Document Upload', color: 'green' },
    { value: 'assessment', label: '📊 Assessment', color: 'purple' },
    { value: 'project', label: '🎯 Project', color: 'orange' },
    { value: 'shadowing', label: '👥 Shadowing', color: 'yellow' },
    { value: 'reading', label: '📚 Reading', color: 'indigo' },
    { value: 'reflection', label: '💭 Reflection', color: 'pink' }
  ];

  // Enhanced filtering and sorting
  const filteredTasks = tasks
    .filter(task => {
      const matchesCompetency = selectedCompetency === 'all' || task.competency_area === selectedCompetency;
      const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.instructions?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCompetency && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.task_type.localeCompare(b.task_type);
        case 'hours':
          return (b.estimated_hours || 0) - (a.estimated_hours || 0);
        case 'order':
        default:
          return (a.order || 999) - (b.order || 999);
      }
    });

  const handleTaskSelect = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkAction = async (action) => {
    const taskIds = Array.from(selectedTasks);
    switch (action) {
      case 'delete':
        if (confirm(`Delete ${taskIds.length} selected tasks?`)) {
          for (const taskId of taskIds) {
            await onDeleteTask(taskId);
          }
          setSelectedTasks(new Set());
          setShowBulkActions(false);
        }
        break;
      case 'duplicate':
        for (const taskId of taskIds) {
          const originalTask = tasks.find(t => t.id === taskId);
          if (originalTask) {
            await onCreateTask({ 
              ...originalTask, 
              id: undefined, 
              title: `${originalTask.title} (Copy)` 
            });
          }
        }
        setSelectedTasks(new Set());
        setShowBulkActions(false);
        break;
      case 'export':
        const selectedTasksData = tasks.filter(t => selectedTasks.has(t.id));
        const dataStr = JSON.stringify(selectedTasksData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'selected_tasks.json';
        link.click();
        break;
    }
  };

  const getTypeColor = (type) => {
    const typeConfig = taskTypes.find(t => t.value === type);
    return typeConfig?.color || 'gray';
  };

  const getTypeIcon = (type) => {
    const typeConfig = taskTypes.find(t => t.value === type);
    return typeConfig?.label.split(' ')[0] || '📋';
  };

  // Enhanced Task Card Component
  const TaskCard = ({ task, isSelected, onSelect }) => (
    <div className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(task.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className={`px-2 py-1 rounded text-xs font-medium bg-${getTypeColor(task.task_type)}-100 text-${getTypeColor(task.task_type)}-800`}>
              {getTypeIcon(task.task_type)} {taskTypes.find(t => t.value === task.task_type)?.label.split(' ').slice(1).join(' ') || task.task_type}
            </div>
            {task.required && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                Required
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setEditingTask(task)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit Task"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDeleteTask && onDeleteTask(task.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Task"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span>⏱️ {task.estimated_hours || 1}h</span>
            <span>📊 Order {task.order || '-'}</span>
          </div>
          <div className="flex items-center space-x-1">
            {task.external_link && (
              <span className="text-blue-500" title="Has external link">🔗</span>
            )}
            {task.template_url && (
              <span className="text-purple-500" title="Has template">📄</span>
            )}
            {task.instructions && (
              <span className="text-green-500" title="Has instructions">📋</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Content Management Hub</h1>
            <p className="text-gray-600 mb-4">
              Create engaging learning experiences with modern tools and intuitive design
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📚</span>
                <span className="text-gray-700">
                  <strong>{tasks.length}</strong> Total Tasks
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📄</span>
                <span className="text-gray-700">
                  <strong>{tasks.filter(t => t.task_type === 'document_upload').length}</strong> Upload Tasks
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎓</span>
                <span className="text-gray-700">
                  <strong>{tasks.filter(t => t.task_type === 'course_link').length}</strong> Course Links
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setEditingTask({ 
              id: null,
              title: '',
              description: '',
              task_type: 'document_upload',
              competency_area: 'leadership_supervision',
              estimated_hours: 1,
              order: tasks.length + 1,
              required: true
            })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            ➕ Create New Task
          </button>
        </div>
      </div>

      {/* Enhanced Controls Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks, descriptions, instructions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Competency Filter */}
            <select
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {competencyAreas.map(area => (
                <option key={area.key} value={area.key}>
                  {area.name} ({area.count})
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="order">Sort by Order</option>
              <option value="title">Sort by Title</option>
              <option value="type">Sort by Type</option>
              <option value="hours">Sort by Hours</option>
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔲 Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Table
              </button>
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
              <div className="flex items-center space-x-2 pl-4 border-l">
                <span className="text-sm text-gray-600">{selectedTasks.size} selected</span>
                <button
                  onClick={() => handleBulkAction('duplicate')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCompetency !== 'all' || searchTerm) && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedCompetency !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {competencyAreas.find(a => a.key === selectedCompetency)?.name}
                <button onClick={() => setSelectedCompetency('all')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Task Display */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCompetency !== 'all' 
                ? 'Try adjusting your search criteria or filters.' 
                : 'Create your first task to get started.'}
            </p>
            {!searchTerm && selectedCompetency === 'all' && (
              <button
                onClick={() => setEditingTask({ 
                  id: null,
                  title: '',
                  description: '',
                  task_type: 'document_upload',
                  competency_area: 'leadership_supervision',
                  estimated_hours: 1,
                  order: 1,
                  required: true
                })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="p-4">
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isSelected={selectedTasks.has(task.id)}
                    onSelect={handleTaskSelect}
                  />
                ))}
              </div>
            ) : (
              // Table view would go here
              <div className="text-center py-8 text-gray-500">
                Table view coming soon! 🚧
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Editor Modal */}
      {editingTask && (
        <EnhancedTaskEditor
          task={editingTask}
          competencyAreas={competencyAreas.filter(a => a.key !== 'all')}
          onSave={(updatedTask) => {
            if (updatedTask.id) {
              onUpdateTask && onUpdateTask(updatedTask);
            } else {
              onCreateTask && onCreateTask({ ...updatedTask, id: `task-${Date.now()}` });
            }
            setEditingTask(null);
          }}
          onCancel={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

export default ContentManagement;