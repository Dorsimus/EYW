import React from 'react';
import './App.css';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton
} from '@clerk/clerk-react';

// Import the full authenticated app component from App.js
import { AuthenticatedApp } from './App';

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-12 max-w-lg w-full border border-red-100">
        {/* Welcome Text at Top */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium mb-2 text-gray-600">Welcome to</h2>
          <h1 className="text-4xl font-bold mb-4" style={{color: '#d21217', textShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            Earn Your Wings
          </h1>
        </div>

        {/* EYW Logo - Centered and Large */}
        <div className="text-center mb-6">
          <img
            src="https://customer-assets.emergentagent.com/job_earnyourwings/artifacts/ybtb01sj_20250723_1404_Winged%20Emblem_remix_01k0we1tpnettvcv336sfsv4p1.png"
            alt="Earn Your Wings"
            className="w-80 mx-auto"
            style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' }}
          />
        </div>
        
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg leading-relaxed">
            Sign in to access your leadership development journey and track your progress.
          </p>
        </div>
        
        {/* Sign In Button */}
        <div className="text-center mb-6">
          <SignInButton mode="modal">
            <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In to Continue
              </span>
            </button>
          </SignInButton>
        </div>
        
        {/* Footer */}
        <div className="text-center">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 font-medium">Redstone Employee Development</p>
            <p className="text-xs text-gray-400 mt-1">Empowering leaders at every level</p>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-100 rounded-full opacity-30"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-yellow-100 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default ClerkApp;