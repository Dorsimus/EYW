import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton, 
  useAuth, 
  useUser 
} from '@clerk/clerk-react';

// AI Service imports
import { EnhancedAdminDashboard, EnhancedUserManagement } from './AdminPanel';
import ContentManagement from './ContentManagement';
import LevelManagement from './LevelManagement';
import TestingTools from './TestingTools';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClerkApp = () => {
  return (
    <div className="App">
      <SignedOut>
        <AuthenticationPrompt />
      </SignedOut>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </div>
  );
};

// Authentication prompt for signed-out users
const AuthenticationPrompt = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* EYW Logo */}
        <div className="text-center mb-6">
          <img
            src="https://customer-assets.emergentagent.com/job_wings-platform-3/artifacts/3u2q2zfr_EYW%20Winged%20Emblem.png"
            alt="Earn Your Wings"
            className="w-32 h-32 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold" style={{color: '#d21217'}}>
            Earn Your Wings
          </h1>
          <p className="text-gray-600 mt-2">
            Leadership Development Platform
          </p>
        </div>
        
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome Navigator!</h2>
          <p className="text-gray-600">
            Sign in to access your leadership development journey and track your progress through the Navigator level.
          </p>
        </div>
        
        {/* Sign In Button */}
        <div className="text-center">
          <SignInButton mode="modal">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Redstone Development • Navigator Level</p>
        </div>
      </div>
    </div>
  );
};

// Main authenticated application
const AuthenticatedApp = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [competencies, setCompetencies] = useState({});
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is admin based on Clerk metadata
  const isAdmin = user?.publicMetadata?.roles?.includes('admin') || false;
  const isModerator = user?.publicMetadata?.roles?.includes('moderator') || false;
  const hasAdminAccess = isAdmin || isModerator;

  useEffect(() => {
    initializeApp();
  }, [user]);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Initialize competencies and user data
      await setupRefinedCompetencies();
      
      console.log('Clerk user initialized:', {
        userId: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        roles: user?.publicMetadata?.roles || [],
        hasAdminAccess
      });
      
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRefinedCompetencies = async () => {
    // Simplified competency structure for testing
    const sampleCompetencies = {
      leadership_supervision: {
        name: 'Leadership & Supervision',
        description: 'Leading People with Purpose',
        tasks_completed: 0,
        total_tasks: 16,
        progress_percentage: 0
      },
      financial_management: {
        name: 'Financial Management',
        description: 'Managing Resources Wisely',
        tasks_completed: 0,
        total_tasks: 16,
        progress_percentage: 0
      },
      operational_management: {
        name: 'Operational Management',
        description: 'Optimizing Daily Operations',
        tasks_completed: 0,
        total_tasks: 16,
        progress_percentage: 0
      },
      cross_functional_collaboration: {
        name: 'Cross-Functional Collaboration',
        description: 'Breaking Down Silos & Building Unified Teams',
        tasks_completed: 0,
        total_tasks: 16,
        progress_percentage: 0
      },
      strategic_thinking: {
        name: 'Strategic Thinking & Planning',
        description: 'Think Beyond Today - Lead for Tomorrow',
        tasks_completed: 0,
        total_tasks: 16,
        progress_percentage: 0
      }
    };

    setCompetencies(sampleCompetencies);
  };

  const testAdminAccess = async () => {
    if (!hasAdminAccess) {
      alert('You need admin access to view this section.');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.get(`${API}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Admin access successful:', response.data);
      setCurrentView('admin-dashboard');
    } catch (error) {
      console.error('Admin access failed:', error.response?.data || error.message);
      alert('Admin access failed. Please check your permissions.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Authentication */}
      <header className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <img
                src="https://customer-assets.emergentagent.com/job_wings-platform-3/artifacts/3u2q2zfr_EYW%20Winged%20Emblem.png"
                alt="Earn Your Wings"
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#d21217'}}>
                  Earn Your Wings
                </h1>
                <p className="text-sm text-gray-600">Navigator Level</p>
              </div>
            </div>

            {/* User Info and Controls */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </p>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>

            {hasAdminAccess && (
              <button
                onClick={testAdminAccess}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  currentView === 'admin-dashboard'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Welcome to Your Navigator Dashboard
            </h2>
            
            {/* User Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Account Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Authentication</p>
                    <p className="text-2xl font-bold text-blue-900">✓ Clerk</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Level</p>
                    <p className="text-2xl font-bold text-green-900">Navigator</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Role</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {hasAdminAccess ? 'Admin' : 'User'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Competencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(competencies).map(([key, competency]) => (
                <div key={key} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {competency.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {competency.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {competency.tasks_completed} / {competency.total_tasks} completed
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {competency.progress_percentage}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${competency.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'admin-dashboard' && hasAdminAccess && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Admin Dashboard
            </h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-lg text-green-600 font-medium mb-2">
                ✅ Admin Access Verified!
              </p>
              <p className="text-gray-600 mb-4">
                You have successfully authenticated with Clerk and accessed the admin panel.
              </p>
              <div className="space-y-2">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress}</p>
                <p><strong>Roles:</strong> {JSON.stringify(user?.publicMetadata?.roles || [])}</p>
                <p><strong>Admin Access:</strong> {hasAdminAccess ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClerkApp;