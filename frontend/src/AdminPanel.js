import React, { useState, useEffect } from 'react';

// =============================================================================
// COMPREHENSIVE ADMIN PANEL FOR EARN YOUR WINGS PLATFORM
// =============================================================================

// Enhanced Admin Dashboard with Comprehensive Analytics
const EnhancedAdminDashboard = ({ stats, onNavigate, users, tasks }) => {
  const [timeframe, setTimeframe] = useState('7days');
  const [activeUsers, setActiveUsers] = useState([]);
  
  useEffect(() => {
    // Calculate active users (users with activity in selected timeframe)
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90) * 24 * 60 * 60 * 1000);
    
    const active = users.filter(user => {
      const lastActivity = new Date(user.last_activity || user.created_at);
      return lastActivity > cutoffDate;
    });
    setActiveUsers(active);
  }, [users, timeframe]);

  const analyticsData = {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    totalTasks: tasks.length,
    completedTasks: stats?.total_completions || 0,
    completionRate: users.length > 0 ? ((stats?.total_completions || 0) / (users.length * tasks.length)) * 100 : 0,
    avgProgressPerUser: users.length > 0 ? users.reduce((sum, user) => sum + (user.overall_progress || 0), 0) / users.length : 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Admin Command Center</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive management for Earn Your Wings Navigator Level
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{analyticsData.totalUsers}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {analyticsData.activeUsers} active in {timeframe.replace('days', ' days')}
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-900">{analyticsData.completionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            {analyticsData.completedTasks} total completions
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Avg Progress</p>
              <p className="text-2xl font-bold text-purple-900">{analyticsData.avgProgressPerUser.toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600">
            Per user completion
          </div>
        </div>

        {/* Content Health */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Total Tasks</p>
              <p className="text-2xl font-bold text-orange-900">{analyticsData.totalTasks}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-orange-600">
            Across 5 competency areas
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('admin-users-enhanced')}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
        >
          <div className="text-2xl mb-2">👤</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">User Management</h3>
          <p className="text-sm text-gray-600">Manage users & approvals</p>
        </button>

        <button
          onClick={() => onNavigate('admin-content-management')}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all group"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Content Management</h3>
          <p className="text-sm text-gray-600">Edit tasks, links & courses</p>
        </button>

        <button
          onClick={() => onNavigate('admin-level-management')}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all group"
        >
          <div className="text-2xl mb-2">🎮</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">Level Management</h3>
          <p className="text-sm text-gray-600">Manage 6-level program</p>
        </button>

        <button
          onClick={() => onNavigate('admin-testing-tools')}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-red-500 hover:shadow-lg transition-all group"
        >
          <div className="text-2xl mb-2">🧪</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-red-600">Testing Tools</h3>
          <p className="text-sm text-gray-600">User testing & simulation</p>
        </button>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Recent Activity</h3>
        <div className="space-y-3">
          {activeUsers.slice(0, 5).map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{Math.round(user.overall_progress || 0)}%</p>
                <p className="text-xs text-gray-600">Progress</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced User Management with Individual Progress and Approvals
const EnhancedUserManagement = ({ users, onUpdateUser, onApproveLevel }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState('progress');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    level: 3,
    overall_progress: 0
  });

  const levels = [
    { id: 1, name: 'Runway Ready', status: 'locked' },
    { id: 2, name: 'First Solo', status: 'locked' },
    { id: 3, name: 'Navigator', status: 'current' },
    { id: 4, name: 'Aviator', status: 'locked' },
    { id: 5, name: 'Skymaster', status: 'locked' },
    { id: 6, name: 'Apex Wing', status: 'locked' }
  ];

  const filteredUsers = users
    .filter(user => filterLevel === 'all' || user.level === filterLevel)
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return (b.overall_progress || 0) - (a.overall_progress || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'level':
          return (a.level || 0) - (b.level || 0);
        default:
          return 0;
      }
    });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Please fill in name and email');
      return;
    }

    const userData = {
      ...newUser,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      role: 'participant'
    };

    // Call the parent's create user function (this would be passed as a prop)
    // For now, we'll simulate adding to the users array
    console.log('Creating user:', userData);
    
    // Close modal and reset form
    setShowAddUserModal(false);
    setNewUser({
      name: '',
      email: '',
      level: 3,
      overall_progress: 0
    });
    
    // In a real implementation, this would call onCreateUser(userData)
    alert(`User ${userData.name} would be created successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">👥 Enhanced User Management</h1>
        <div className="flex space-x-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>Level {level.id}: {level.name}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="progress">Sort by Progress</option>
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level</option>
          </select>
          
          {/* ADD USER BUTTON */}
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-2">➕</span>
            Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedUser?.id === user.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Level {user.level || 3}: {levels.find(l => l.id === (user.level || 3))?.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{Math.round(user.overall_progress || 0)}%</div>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(user.overall_progress || 0, 100)}%` }}
                    />
                  </div>
                  
                  {/* Level Approval Status */}
                  {user.overall_progress >= 90 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveLevel(user.id, (user.level || 3) + 1);
                      }}
                      className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                      🎓 Approve Next Level
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Detail Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {selectedUser ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {selectedUser.name?.charAt(0) || 'U'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              {/* Progress Overview */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Progress Overview</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-medium">{Math.round(selectedUser.overall_progress || 0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(selectedUser.overall_progress || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Level Management */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Level Management</h4>
                <div className="space-y-2">
                  {levels.map(level => (
                    <div
                      key={level.id}
                      className={`p-2 rounded-lg border ${
                        level.id === (selectedUser.level || 3)
                          ? 'border-blue-500 bg-blue-50'
                          : level.id < (selectedUser.level || 3)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Level {level.id}: {level.name}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full">
                          {level.id === (selectedUser.level || 3) ? '🎯 Current' :
                           level.id < (selectedUser.level || 3) ? '✅ Complete' : '🔒 Locked'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    // Reset user progress
                    onUpdateUser(selectedUser.id, { overall_progress: 0 });
                  }}
                  className="w-full px-4 py-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-colors"
                >
                  🔄 Reset Progress
                </button>
                
                <button
                  onClick={() => {
                    // Simulate progress for testing
                    onUpdateUser(selectedUser.id, { overall_progress: Math.min((selectedUser.overall_progress || 0) + 25, 100) });
                  }}
                  className="w-full px-4 py-2 text-sm text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors"
                >
                  ⚡ Add 25% Progress (Test)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-2">👤</div>
              <p>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">➕ Add New User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Starting Level</label>
                <select
                  value={newUser.level}
                  onChange={(e) => setNewUser({...newUser, level: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.id}: {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newUser.overall_progress}
                  onChange={(e) => setNewUser({...newUser, overall_progress: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export {
  EnhancedAdminDashboard,
  EnhancedUserManagement
};