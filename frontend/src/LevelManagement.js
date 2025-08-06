import React, { useState } from 'react';

// =============================================================================
// LEVEL MANAGEMENT SYSTEM FOR 6-LEVEL EARN YOUR WINGS PROGRAM
// =============================================================================

const LevelManagement = ({ users, onUpdateUser, onApproveLevel }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLevel, setSelectedLevel] = useState(null);

  const levels = [
    { 
      id: 1, 
      name: 'Runway Ready', 
      description: 'Foundation building and basic property management skills',
      status: 'planned',
      competencies: 5,
      tasks: 60,
      estimatedHours: 120,
      icon: '🛫',
      color: 'red'
    },
    { 
      id: 2, 
      name: 'First Solo', 
      description: 'Independent execution of core property management functions',
      status: 'planned',
      competencies: 5,
      tasks: 70,
      estimatedHours: 140,
      icon: '✈️',
      color: 'orange'
    },
    { 
      id: 3, 
      name: 'Navigator', 
      description: 'Strategic thinking and advanced leadership capabilities',
      status: 'active',
      competencies: 5,
      tasks: 80,
      estimatedHours: 160,
      icon: '🧭',
      color: 'blue'
    },
    { 
      id: 4, 
      name: 'Aviator', 
      description: 'Complex project management and cross-functional leadership',
      status: 'planned',
      competencies: 5,
      tasks: 90,
      estimatedHours: 180,
      icon: '🚁',
      color: 'green'
    },
    { 
      id: 5, 
      name: 'Skymaster', 
      description: 'Strategic business leadership and organizational transformation',
      status: 'planned',
      competencies: 5,
      tasks: 100,
      estimatedHours: 200,
      icon: '🛩️',
      color: 'purple'
    },
    { 
      id: 6, 
      name: 'Apex Wing', 
      description: 'Executive-level strategic leadership and industry innovation',
      status: 'planned',
      competencies: 5,
      tasks: 120,
      estimatedHours: 240,
      icon: '🚀',
      color: 'indigo'
    }
  ];

  const getUsersByLevel = (levelId) => {
    return users.filter(user => user.level === levelId);
  };

  const getPendingApprovals = () => {
    return users.filter(user => user.overall_progress >= 90 && user.pending_level_approval);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎮 Level Management System</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the 6-level Earn Your Wings program structure and user progression
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-2xl font-bold text-orange-600">{getPendingApprovals().length}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Program Overview', icon: '🎯' },
            { key: 'progression', label: 'User Progression', icon: '📈' },
            { key: 'approvals', label: 'Level Approvals', icon: '✅' },
            { key: 'settings', label: 'Level Settings', icon: '⚙️' }
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
      {activeTab === 'overview' && (
        <ProgramOverview 
          levels={levels}
          users={users}
          getUsersByLevel={getUsersByLevel}
          onSelectLevel={setSelectedLevel}
        />
      )}

      {activeTab === 'progression' && (
        <UserProgression 
          levels={levels}
          users={users}
          getUsersByLevel={getUsersByLevel}
        />
      )}

      {activeTab === 'approvals' && (
        <LevelApprovals 
          levels={levels}
          pendingApprovals={getPendingApprovals()}
          onApproveLevel={onApproveLevel}
        />
      )}

      {activeTab === 'settings' && (
        <LevelSettings 
          levels={levels}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
        />
      )}
    </div>
  );
};

// Program Overview Component
const ProgramOverview = ({ levels, users, getUsersByLevel, onSelectLevel }) => {
  return (
    <div className="space-y-8">
      {/* Program Flow Visualization */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          🎯 Earn Your Wings Program Progression
        </h2>
        
        <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-6">
          {levels.map((level, index) => (
            <div key={level.id} className="flex items-center">
              <button
                onClick={() => onSelectLevel(level)}
                className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  level.status === 'active' 
                    ? 'border-blue-500 bg-blue-100 shadow-lg' 
                    : level.status === 'completed'
                    ? 'border-green-500 bg-green-100'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{level.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm">Level {level.id}</div>
                  <div className="text-xs text-gray-600 font-medium">{level.name}</div>
                  
                  {/* User count badge */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center ${
                    level.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {getUsersByLevel(level.id).length}
                  </div>
                  
                  {/* Status indicator */}
                  {level.status === 'active' && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </button>
              
              {index < levels.length - 1 && (
                <div className="hidden lg:block w-8 h-0.5 bg-gray-300 mx-2">
                  <div className="w-0 h-0.5 bg-blue-500 transition-all duration-1000"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Level Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map(level => {
          const userCount = getUsersByLevel(level.id).length;
          const avgProgress = userCount > 0 
            ? getUsersByLevel(level.id).reduce((sum, user) => sum + (user.overall_progress || 0), 0) / userCount
            : 0;

          return (
            <div
              key={level.id}
              className={`p-6 rounded-lg border-l-4 bg-white shadow-sm border-${level.color}-500`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{level.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Level {level.id}: {level.name}</h3>
                    <p className={`text-xs px-2 py-1 rounded-full bg-${level.color}-100 text-${level.color}-800 inline-block mt-1`}>
                      {level.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {level.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="font-medium text-gray-900">{userCount}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Progress:</span>
                  <span className="font-medium text-gray-900">{Math.round(avgProgress)}%</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium text-gray-900">{level.tasks}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Est. Hours:</span>
                  <span className="font-medium text-gray-900">{level.estimatedHours}h</span>
                </div>
              </div>

              <button
                onClick={() => onSelectLevel(level)}
                className={`mt-4 w-full px-4 py-2 text-sm font-medium rounded-md transition-colors bg-${level.color}-100 text-${level.color}-700 hover:bg-${level.color}-200`}
              >
                Manage Level
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// User Progression Component
const UserProgression = ({ levels, users, getUsersByLevel }) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');

  const filteredUsers = selectedLevelFilter === 'all' 
    ? users 
    : getUsersByLevel(parseInt(selectedLevelFilter));

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">📈 User Progression Tracking</h2>
        
        <select
          value={selectedLevelFilter}
          onChange={(e) => setSelectedLevelFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Levels</option>
          {levels.map(level => (
            <option key={level.id} value={level.id}>
              Level {level.id}: {level.name}
            </option>
          ))}
        </select>
      </div>

      {/* Progression Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
          <div className="text-sm text-blue-800">Total Users</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {filteredUsers.filter(u => u.overall_progress >= 90).length}
          </div>
          <div className="text-sm text-green-800">Ready for Next Level</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {filteredUsers.filter(u => u.overall_progress >= 50 && u.overall_progress < 90).length}
          </div>
          <div className="text-sm text-orange-800">In Progress</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">
            {filteredUsers.filter(u => u.overall_progress < 50).length}
          </div>
          <div className="text-sm text-gray-800">Just Started</div>
        </div>
      </div>

      {/* User Progression Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">User Progress Details</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const userLevel = levels.find(l => l.id === (user.level || 3));
                const progress = user.overall_progress || 0;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{userLevel?.icon}</span>
                        <span className="text-sm text-gray-900">
                          Level {user.level || 3}: {userLevel?.name}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${
                              progress >= 90 ? 'bg-green-500' :
                              progress >= 50 ? 'bg-blue-500' :
                              progress >= 25 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        progress >= 90 ? 'bg-green-100 text-green-800' :
                        progress >= 50 ? 'bg-blue-100 text-blue-800' :
                        progress >= 25 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {progress >= 90 ? 'Ready for Next Level' :
                         progress >= 50 ? 'Making Good Progress' :
                         progress >= 25 ? 'Getting Started' :
                         'Just Began'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_activity 
                        ? new Date(user.last_activity).toLocaleDateString()
                        : 'No recent activity'
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Level Approvals Component
const LevelApprovals = ({ levels, pendingApprovals, onApproveLevel }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">✅ Level Approvals</h2>
        <div className="text-sm text-gray-600">
          {pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}
        </div>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All users are at appropriate levels for their progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map(user => {
            const currentLevel = levels.find(l => l.id === (user.level || 3));
            const nextLevel = levels.find(l => l.id === (user.level || 3) + 1);
            
            return (
              <div key={user.id} className="bg-white border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center">
                          <span className="text-lg mr-1">{currentLevel?.icon}</span>
                          <span className="text-sm text-gray-700">
                            Current: Level {user.level || 3}
                          </span>
                        </div>
                        
                        <div className="text-gray-400">→</div>
                        
                        <div className="flex items-center">
                          <span className="text-lg mr-1">{nextLevel?.icon}</span>
                          <span className="text-sm text-gray-700">
                            Next: Level {(user.level || 3) + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {Math.round(user.overall_progress || 0)}%
                    </div>
                    <div className="text-sm text-gray-600 mb-4">Progress Complete</div>
                    
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          // Review user's work before approval
                          alert(`Reviewing ${user.name}'s work for level advancement...`);
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                      >
                        Review Work
                      </button>
                      
                      <button
                        onClick={() => onApproveLevel(user.id, (user.level || 3) + 1)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                      >
                        Approve Level Up
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Level Settings Component  
const LevelSettings = ({ levels, selectedLevel, setSelectedLevel }) => {
  const [editingLevel, setEditingLevel] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">⚙️ Level Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Selection */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Select Level to Configure</h3>
          {levels.map(level => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level)}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                selectedLevel?.id === level.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{level.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">Level {level.id}: {level.name}</div>
                  <div className="text-sm text-gray-600">{level.status}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Level Configuration */}
        <div className="lg:col-span-2">
          {selectedLevel ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedLevel.icon} Level {selectedLevel.id}: {selectedLevel.name}
                </h3>
                <button
                  onClick={() => setEditingLevel(selectedLevel)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  Edit Settings
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedLevel.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Tasks</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {selectedLevel.tasks} tasks
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {selectedLevel.estimatedHours} hours
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex space-x-2">
                    {['planned', 'active', 'completed'].map(status => (
                      <button
                        key={status}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedLevel.status === status
                            ? status === 'active' ? 'bg-blue-100 text-blue-800' :
                              status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competency Areas</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    <ul className="space-y-1">
                      <li>• Leadership & Supervision</li>
                      <li>• Financial Management & Business Acumen</li>
                      <li>• Operational Management</li>
                      <li>• Cross-Functional Collaboration</li>
                      <li>• Strategic Thinking & Planning</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Level</h3>
              <p className="text-gray-600">Choose a level from the left to configure its settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelManagement;