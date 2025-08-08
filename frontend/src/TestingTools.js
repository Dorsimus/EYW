import React, { useState } from 'react';

// =============================================================================
// TESTING TOOLS FOR NAVIGATOR LEVEL USER TESTING PREPARATION
// =============================================================================

const TestingTools = ({ users, tasks, onCreateUser, onUpdateUser, onDeleteUser, showSuccessMessage, showErrorMessage }) => {
  const [activeTab, setActiveTab] = useState('user-simulation');
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);

  const testUserTemplates = [
    {
      name: 'Property Manager - Alex Johnson',
      email: 'alex.johnson@test-pm.com',
      role: 'participant',
      level: 3,
      profile: 'Experienced property manager transitioning to leadership role',
      simulatedProgress: 25
    },
    {
      name: 'Assistant Manager - Sarah Chen',
      email: 'sarah.chen@test-pm.com',
      role: 'participant', 
      level: 3,
      profile: 'Rising star ready for advanced development',
      simulatedProgress: 60
    },
    {
      name: 'Regional Supervisor - Mike Rodriguez',
      email: 'mike.rodriguez@test-pm.com',
      role: 'participant',
      level: 3,
      profile: 'Senior professional seeking strategic skills',
      simulatedProgress: 85
    },
    {
      name: 'New Manager - Taylor Kim',
      email: 'taylor.kim@test-pm.com',
      role: 'participant',
      level: 3,
      profile: 'Fresh to management, eager to learn',
      simulatedProgress: 5
    },
    {
      name: 'Veteran Leader - Jordan Smith',
      email: 'jordan.smith@test-pm.com',
      role: 'participant',
      level: 3,
      profile: 'Experienced leader looking to formalize skills',
      simulatedProgress: 95
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧪 Testing Tools & Simulation</h1>
          <p className="mt-1 text-sm text-gray-600">
            Prepare Navigator level for comprehensive user testing with realistic scenarios
          </p>
        </div>
        
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            Ready for Testing in 4 weeks
          </span>
          {bulkOperationInProgress && (
            <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'user-simulation', label: 'User Simulation', icon: '👥' },
            { key: 'content-testing', label: 'Content Testing', icon: '📋' },
            { key: 'data-export', label: 'Data Export', icon: '📊' },
            { key: 'reset-tools', label: 'Reset Tools', icon: '🔄' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'user-simulation' && (
        <UserSimulation 
          users={users}
          testUserTemplates={testUserTemplates}
          onCreateUser={onCreateUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
          showSuccessMessage={showSuccessMessage}
          showErrorMessage={showErrorMessage}
          bulkOperationInProgress={bulkOperationInProgress}
          setBulkOperationInProgress={setBulkOperationInProgress}
        />
      )}

      {activeTab === 'content-testing' && (
        <ContentTesting 
          tasks={tasks}
          showSuccessMessage={showSuccessMessage}
          showErrorMessage={showErrorMessage}
        />
      )}

      {activeTab === 'data-export' && (
        <DataExport 
          users={users}
          tasks={tasks}
          showSuccessMessage={showSuccessMessage}
          showErrorMessage={showErrorMessage}
        />
      )}

      {activeTab === 'reset-tools' && (
        <ResetTools 
          users={users}
          onUpdateUser={onUpdateUser}
          showSuccessMessage={showSuccessMessage}
          showErrorMessage={showErrorMessage}
          setBulkOperationInProgress={setBulkOperationInProgress}
        />
      )}
    </div>
  );
};

// User Simulation Component
const UserSimulation = ({ users, testUserTemplates, onCreateUser, onUpdateUser, onDeleteUser, showSuccessMessage, showErrorMessage, setBulkOperationInProgress }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customUser, setCustomUser] = useState({
    name: '',
    email: '',
    role: 'participant',
    level: 3,
    simulatedProgress: 0
  });

  const createTestUser = async (template) => {
    try {
      setBulkOperationInProgress(true);
      
      // Create user with simulated data
      const userData = {
        ...template,
        id: `test-user-${Date.now()}`,
        created_at: new Date().toISOString(),
        overall_progress: template.simulatedProgress,
        last_activity: new Date().toISOString(),
        test_user: true
      };

      await onCreateUser(userData);
      showSuccessMessage(`Created test user: ${template.name}`);
      
    } catch (error) {
      showErrorMessage(`Failed to create test user: ${error.message}`);
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const createAllTestUsers = async () => {
    try {
      setBulkOperationInProgress(true);
      
      for (const template of testUserTemplates) {
        await createTestUser(template);
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      showSuccessMessage(`Created ${testUserTemplates.length} test users successfully`);
      
    } catch (error) {
      showErrorMessage(`Failed to create all test users: ${error.message}`);
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const simulateUserProgress = async (userId, targetProgress) => {
    try {
      setBulkOperationInProgress(true);
      
      // Simulate realistic progression over time
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      // Add realistic activity timestamps and progress markers
      const updatedUser = {
        ...user,
        overall_progress: targetProgress,
        last_activity: new Date().toISOString(),
        progress_history: [
          ...(user.progress_history || []),
          {
            date: new Date().toISOString(),
            progress: targetProgress,
            note: 'Simulated progress update'
          }
        ]
      };

      await onUpdateUser(userId, updatedUser);
      showSuccessMessage(`Updated ${user.name} to ${targetProgress}% progress`);
      
    } catch (error) {
      showErrorMessage(`Failed to simulate progress: ${error.message}`);
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={createAllTestUsers}
          disabled={bulkOperationInProgress}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-blue-900">Create All Test Users</h3>
          <p className="text-sm text-blue-700">Generate {testUserTemplates.length} realistic test users</p>
        </button>

        <button
          onClick={() => {
            // Clean up test users
            const testUsers = users.filter(u => u.test_user);
            testUsers.forEach(user => onDeleteUser(user.id));
            showSuccessMessage(`Cleaned up ${testUsers.length} test users`);
          }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
        >
          <div className="text-2xl mb-2">🗑️</div>
          <h3 className="font-semibold text-red-900">Clean Test Users</h3>
          <p className="text-sm text-red-700">Remove all test users</p>
        </button>

        <button
          onClick={() => {
            // Export test scenarios
            const testScenarios = testUserTemplates.map(template => ({
              ...template,
              tasks_to_complete: Math.floor((template.simulatedProgress / 100) * 80),
              estimated_time_spent: template.simulatedProgress * 1.6 // hours
            }));
            
            const dataStr = JSON.stringify(testScenarios, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'test-scenarios.json';
            link.click();
            
            showSuccessMessage('Test scenarios exported');
          }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
        >
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold text-green-900">Export Scenarios</h3>
          <p className="text-sm text-green-700">Download test user scenarios</p>
        </button>
      </div>

      {/* Test User Templates */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">👤 Test User Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testUserTemplates.map((template, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{template.simulatedProgress}%</div>
                  <div className="text-xs text-gray-500">Target Progress</div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                {template.profile}
              </p>

              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${template.simulatedProgress}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Level {template.level}</span>
                  <button
                    onClick={() => createTestUser(template)}
                    disabled={bulkOperationInProgress}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom User Creation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ Custom Test User Creation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={customUser.name}
              onChange={(e) => setCustomUser({...customUser, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Test User Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={customUser.email}
              onChange={(e) => setCustomUser({...customUser, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Simulated Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={customUser.simulatedProgress}
              onChange={(e) => setCustomUser({...customUser, simulatedProgress: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                if (customUser.name && customUser.email) {
                  createTestUser({
                    ...customUser,
                    profile: 'Custom test user'
                  });
                  setCustomUser({
                    name: '',
                    email: '',
                    role: 'participant',
                    level: 3,
                    simulatedProgress: 0
                  });
                } else {
                  showErrorMessage('Please fill in name and email');
                }
              }}
              disabled={bulkOperationInProgress}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create Custom User
            </button>
          </div>
        </div>
      </div>

      {/* Existing Test Users Management */}
      {users.filter(u => u.test_user).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">🎮 Existing Test Users</h3>
          
          <div className="space-y-2">
            {users.filter(u => u.test_user).map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0) || 'T'}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.overall_progress || 0}% complete</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => simulateUserProgress(user.id, Math.min((user.overall_progress || 0) + 25, 100))}
                    disabled={bulkOperationInProgress}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50"
                  >
                    +25% Progress
                  </button>
                  
                  <button
                    onClick={() => onDeleteUser(user.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Content Testing Component
const ContentTesting = ({ tasks, showSuccessMessage, showErrorMessage }) => {
  const [testResults, setTestResults] = useState({});

  const runContentTests = async () => {
    const results = {};
    
    for (const task of tasks) {
      const issues = [];
      
      // Test for placeholder content
      if (!task.title || task.title.includes('placeholder')) {
        issues.push('Missing or placeholder title');
      }
      
      if (!task.description || task.description.includes('placeholder')) {
        issues.push('Missing or placeholder description');
      }
      
      // Test external links
      if (task.external_link) {
        if (task.external_link === '#' || task.external_link.includes('placeholder')) {
          issues.push('Placeholder or invalid link');
        }
      } else if (task.task_type === 'course_link') {
        issues.push('Missing external link for course task');
      }
      
      // Test instructions
      if (!task.instructions) {
        issues.push('Missing instructions');
      }
      
      results[task.id] = {
        passed: issues.length === 0,
        issues: issues
      };
    }
    
    setTestResults(results);
    
    const totalTasks = Object.keys(results).length;
    const passedTasks = Object.values(results).filter(r => r.passed).length;
    
    if (passedTasks === totalTasks) {
      showSuccessMessage(`All ${totalTasks} tasks passed content validation!`);
    } else {
      showErrorMessage(`${totalTasks - passedTasks} of ${totalTasks} tasks need attention`);
    }
  };

  const passedTasks = Object.values(testResults).filter(r => r.passed).length;
  const totalTasks = Object.keys(testResults).length;

  return (
    <div className="space-y-6">
      {/* Content Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
          <div className="text-sm text-blue-800">Total Tasks</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{passedTasks}</div>
          <div className="text-sm text-green-800">Passing Tests</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{totalTasks - passedTasks}</div>
          <div className="text-sm text-red-800">Need Attention</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {totalTasks > 0 ? Math.round((passedTasks / totalTasks) * 100) : 0}%
          </div>
          <div className="text-sm text-purple-800">Ready for Testing</div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="flex space-x-4">
        <button
          onClick={runContentTests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🧪 Run Content Tests
        </button>
        
        <button
          onClick={() => {
            // Export test results
            const dataStr = JSON.stringify(testResults, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'content-test-results.json';
            link.click();
            
            showSuccessMessage('Test results exported');
          }}
          disabled={Object.keys(testResults).length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          📊 Export Results
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Content Test Results</h3>
          
          <div className="space-y-2">
            {Object.entries(testResults).map(([taskId, result]) => {
              const task = tasks.find(t => t.id === taskId);
              if (!task) return null;
              
              return (
                <div
                  key={taskId}
                  className={`p-4 rounded-lg border ${
                    result.passed
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {result.passed ? '✅' : '❌'} {task.title || 'Untitled Task'}
                      </h4>
                      
                      {!result.passed && (
                        <div className="text-sm text-red-700">
                          <div className="font-medium mb-1">Issues found:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {result.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {task.competency_area} • {task.task_type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Data Export Component
const DataExport = ({ users, tasks, showSuccessMessage, showErrorMessage }) => {
  const exportUserProgress = () => {
    const progressData = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level || 3,
      overall_progress: user.overall_progress || 0,
      created_at: user.created_at,
      last_activity: user.last_activity,
      is_test_user: user.test_user || false
    }));
    
    const dataStr = JSON.stringify(progressData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showSuccessMessage('User progress data exported');
  };

  const exportContentAudit = () => {
    const auditData = tasks.map(task => ({
      id: task.id,
      title: task.title,
      competency_area: task.competency_area,
      task_type: task.task_type,
      has_external_link: !!task.external_link && task.external_link !== '#',
      has_description: !!task.description,
      has_instructions: !!task.instructions,
      is_placeholder: (task.title?.includes('placeholder') || 
                     task.description?.includes('placeholder') ||
                     task.external_link?.includes('placeholder')),
      estimated_hours: task.estimated_hours,
      required: task.required || false
    }));
    
    const dataStr = JSON.stringify(auditData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-audit-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showSuccessMessage('Content audit exported');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 User Progress Export</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export all user progress data including completion rates, timestamps, and testing flags.
          </p>
          
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium">Total Users:</span> {users.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Test Users:</span> {users.filter(u => u.test_user).length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Avg Progress:</span> {
                users.length > 0 
                  ? Math.round(users.reduce((sum, u) => sum + (u.overall_progress || 0), 0) / users.length)
                  : 0
              }%
            </div>
          </div>
          
          <button
            onClick={exportUserProgress}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export User Data
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Content Audit Export</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export content validation data including placeholders, missing links, and completion status.
          </p>
          
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium">Total Tasks:</span> {tasks.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">With Links:</span> {tasks.filter(t => t.external_link && t.external_link !== '#').length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Placeholders:</span> {
                tasks.filter(t => 
                  t.title?.includes('placeholder') || 
                  t.description?.includes('placeholder') ||
                  !t.external_link || 
                  t.external_link === '#'
                ).length
              }
            </div>
          </div>
          
          <button
            onClick={exportContentAudit}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export Content Audit
          </button>
        </div>
      </div>
    </div>
  );
};

// Reset Tools Component
const ResetTools = ({ users, onUpdateUser, showSuccessMessage, showErrorMessage, setBulkOperationInProgress }) => {
  const resetAllProgress = async () => {
    if (!confirm('Are you sure you want to reset ALL user progress? This cannot be undone.')) {
      return;
    }
    
    try {
      setBulkOperationInProgress(true);
      
      for (const user of users) {
        await onUpdateUser(user.id, {
          ...user,
          overall_progress: 0,
          last_activity: new Date().toISOString(),
          progress_history: []
        });
      }
      
      showSuccessMessage(`Reset progress for ${users.length} users`);
      
    } catch (error) {
      showErrorMessage(`Failed to reset progress: ${error.message}`);
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const resetTestUsers = async () => {
    const testUsers = users.filter(u => u.test_user);
    
    if (testUsers.length === 0) {
      showErrorMessage('No test users found');
      return;
    }
    
    try {
      setBulkOperationInProgress(true);
      
      for (const user of testUsers) {
        await onUpdateUser(user.id, {
          ...user,
          overall_progress: 0,
          last_activity: new Date().toISOString(),
          progress_history: []
        });
      }
      
      showSuccessMessage(`Reset progress for ${testUsers.length} test users`);
      
    } catch (error) {
      showErrorMessage(`Failed to reset test users: ${error.message}`);
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-yellow-400 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Caution: Reset Operations</h3>
            <p className="text-sm text-yellow-700 mt-1">
              These operations will permanently modify user data. Use with caution, especially in production.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">🔄 Reset All User Progress</h3>
          <p className="text-sm text-gray-600 mb-4">
            Reset progress for all {users.length} users back to 0%. This will clear all completion data and progress history.
          </p>
          
          <div className="bg-red-50 p-3 rounded-md mb-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ This action cannot be undone
            </p>
          </div>
          
          <button
            onClick={resetAllProgress}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reset All Progress
          </button>
        </div>

        <div className="bg-white border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">🧪 Reset Test Users Only</h3>
          <p className="text-sm text-gray-600 mb-4">
            Reset progress only for test users ({users.filter(u => u.test_user).length} users). 
            Regular users will remain unchanged.
          </p>
          
          <div className="bg-orange-50 p-3 rounded-md mb-4">
            <p className="text-sm text-orange-800">
              Safer option for testing environments
            </p>
          </div>
          
          <button
            onClick={resetTestUsers}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            disabled={users.filter(u => u.test_user).length === 0}
          >
            Reset Test Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestingTools;