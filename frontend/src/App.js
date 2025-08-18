import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import './App.css';

// Environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const USE_API_COMPETENCIES = process.env.REACT_APP_USE_API_COMPETENCIES === 'true';

// Authentication prompt for signed-out users
const AuthenticationPrompt = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-12 max-w-lg w-full border border-red-100">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-800 mb-4">Earn Your Wings</h1>
          <h2 className="text-2xl font-bold text-red-600 mb-6">Leadership Development Platform</h2>
          <p className="text-gray-600 mb-8">Sign in to access your leadership development journey</p>
          <div className="space-y-4">
            <button className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main authenticated application
const AuthenticatedApp = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  // State management
  const [competencies, setCompetencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);

  // Load competencies from API (fully API-driven, no hardcoded data)
  const loadCompetenciesFromAPI = async () => {
    console.log('🔧 Loading competencies from API - 100% API-driven architecture');
    
    try {
      const response = await axios.get(`${API}/competencies`, {
        timeout: 15000,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200 && response.data) {
        console.log('✅ Successfully loaded competencies from API');
        console.log('📊 API Response contains:', Object.keys(response.data).length, 'competency areas');
        
        setCompetencies(response.data);
        return response.data;
      } else {
        throw new Error('Invalid API response');
      }
      
    } catch (error) {
      console.error('❌ Failed to load competencies from API:', error.message);
      setError('Failed to load competencies. Please try refreshing the page.');
      return null;
    }
  };

  // Initialize user and load data
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing Earn Your Wings Platform');
      
      if (USE_API_COMPETENCIES) {
        console.log('🔄 Using API-driven competencies (no hardcoded data)');
        await loadCompetenciesFromAPI();
      } else {
        console.log('⚠️ API competencies disabled - check REACT_APP_USE_API_COMPETENCIES');
        setError('API competencies not enabled. Please contact administrator.');
      }
      
      // Check admin status
      if (user?.publicMetadata?.role === 'admin') {
        setIsAdmin(true);
        console.log('👑 Admin user detected');
      }
      
      setLoading(false);
    };

    initializeApp();
  }, [user]);

  // Competency area color mapping
  const getCompetencyColor = (areaKey) => {
    const colorMap = {
      leadership_supervision: 'bg-red-50 border-red-200 text-red-800',
      financial_management: 'bg-green-50 border-green-200 text-green-800',
      operational_management: 'bg-blue-50 border-blue-200 text-blue-800',
      cross_functional_collaboration: 'bg-purple-50 border-purple-200 text-purple-800',
      strategic_thinking: 'bg-orange-50 border-orange-200 text-orange-800',
      client_confidence_connection: 'bg-teal-50 border-teal-200 text-teal-800'
    };
    return colorMap[areaKey] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  // Format competency area names
  const formatCompetencyName = (key) => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your leadership development platform...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Platform</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Panel View
  const AdminPanel = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-3">👑</span>
        Admin Panel
      </h2>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Backend API Status</h3>
          <p className="text-blue-700">✅ All competencies loaded from API</p>
          <p className="text-blue-700">✅ {Object.keys(competencies).length} competency areas active</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Data Source</h3>
          <p className="text-green-700">✅ 100% API-driven (no hardcoded data)</p>
          <p className="text-green-700">✅ Admin changes sync to users immediately</p>
        </div>
      </div>
    </div>
  );

  // Competency Detail View
  const CompetencyDetail = ({ areaKey, areaData }) => (
    <div className={`rounded-lg border-2 p-6 ${getCompetencyColor(areaKey)}`}>
      <h3 className="text-xl font-bold mb-4">{formatCompetencyName(areaKey)}</h3>
      
      {areaData.sub_competencies && (
        <div className="space-y-4">
          {Object.entries(areaData.sub_competencies).map(([subKey, subData]) => (
            <div key={subKey} className="bg-white bg-opacity-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">
                {typeof subData === 'object' ? subData.name : subData}
              </h4>
              
              {/* Display API-driven data */}
              {typeof subData === 'object' && (
                <div className="space-y-2 text-sm">
                  {subData.foundation_courses && (
                    <div>
                      <span className="font-medium">Foundation Courses:</span> 
                      <span className="ml-2">{subData.foundation_courses.length} available</span>
                    </div>
                  )}
                  {subData.dive_deeper_resources && (
                    <div>
                      <span className="font-medium">Dive Deeper Resources:</span>
                      <span className="ml-2">{subData.dive_deeper_resources.length} available</span>
                    </div>
                  )}
                  {subData.monthly_activities && (
                    <div>
                      <span className="font-medium">Monthly Activities:</span>
                      <span className="ml-2">{subData.monthly_activities.length} activities</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Dashboard View
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Leadership Development Dashboard</h2>
        <p className="text-gray-600">Track your progress across all competency areas</p>
      </div>

      {/* API Status Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 text-2xl mr-3">✅</span>
          <div>
            <h3 className="font-semibold text-green-800">API-Driven Platform</h3>
            <p className="text-green-700">All data loaded from backend API - no hardcoded content</p>
          </div>
        </div>
      </div>

      {/* Competency Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(competencies).map(([areaKey, areaData]) => (
          <CompetencyDetail key={areaKey} areaKey={areaKey} areaData={areaData} />
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Platform Information</h3>
        <div className="text-blue-700 text-sm space-y-1">
          <p>• Backend API: {BACKEND_URL}</p>
          <p>• API Competencies: {USE_API_COMPETENCIES ? 'Enabled' : 'Disabled'}</p>
          <p>• Competency Areas: {Object.keys(competencies).length}</p>
          <p>• User: {user?.firstName} {user?.lastName}</p>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Earn Your Wings</h1>
              <p className="text-gray-600">Leadership Development Platform</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={() => setCurrentView(currentView === 'admin' ? 'dashboard' : 'admin')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentView === 'admin' ? '📊 Dashboard' : '👑 Admin'}
                </button>
              )}
              
              <div className="text-right">
                <p className="font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-600">{isAdmin ? 'Administrator' : 'Navigator Level'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'admin' && isAdmin ? <AdminPanel /> : <Dashboard />}
      </main>
    </div>
  );
};

// Main App component
const App = () => {
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

// Export AuthenticatedApp for use in ClerkApp.js
export { AuthenticatedApp };

export default App;