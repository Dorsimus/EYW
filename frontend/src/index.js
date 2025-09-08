import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ClerkApp from "./ClerkApp";
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Demo mode check at root level - BEFORE ClerkProvider initialization
const urlParams = new URLSearchParams(window.location.search);
const isDemoParam = urlParams.get('demo') === 'true';
const isHashDemo = window.location.hash.includes('demo=true');
const isStoredDemo = localStorage.getItem('demo_mode') === 'true';
const isHrefDemo = window.location.href.includes('demo=true');

// PRODUCTION MODE: Only enable demo mode with explicit ?demo=true parameter
// Remove automatic demo mode for preview environments
const isPathDemo = window.location.pathname.includes('demo');

// REMOVED: isHostDemo check that was auto-enabling demo mode on preview domains
// For production readiness, only enable demo mode with explicit parameter

// Enable demo mode ONLY with explicit parameter (not automatic hostname detection)
const isDemoMode = isDemoParam || isHashDemo || isStoredDemo || isHrefDemo;

console.log('🔍 ROOT LEVEL Demo mode check:', {
  urlSearch: window.location.search,
  fullURL: window.location.href,
  hostname: window.location.hostname,
  isDemoParam: isDemoParam,
  isHashDemo: isHashDemo,
  isStoredDemo: isStoredDemo,
  isHrefDemo: isHrefDemo,
  isPathDemo: isPathDemo,
  isHostDemo: isHostDemo,
  finalDemoMode: isDemoMode
});

// Set demo mode in localStorage for persistence
if (isDemoParam || isHrefDemo || isHostDemo) {
  localStorage.setItem('demo_mode', 'true');
  console.log('🎮 DEMO MODE ACTIVATED at root level');
}

// Conditional Root Component
const Root = () => {
  if (isDemoMode) {
    console.log('🎮 DEMO MODE DETECTED - Bypassing ClerkProvider entirely');
    return <ClerkApp />;
  }

  console.log('🔒 Production mode - Using ClerkProvider wrapper');
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        elements: {
          card: "shadow-lg",
          headerTitle: "text-2xl font-bold text-red-600",
          headerSubtitle: "text-gray-600",
          socialButtonsBlockButton: "border border-gray-300 hover:border-gray-400",
          formButtonPrimary: "bg-red-600 hover:bg-red-700 text-white",
          footerActionLink: "text-red-600 hover:text-red-700",
          logoBox: "mx-auto mb-6",
          logoImage: "w-16 h-16"
        },
        layout: {
          logoImageUrl: "https://customer-assets.emergentagent.com/job_earnyourwings/artifacts/ybtb01sj_20250723_1404_Winged%20Emblem_remix_01k0we1tpnettvcv336sfsv4p1.png"
        },
        variables: {
          colorPrimary: "#d21217",
          colorText: "#374151",
          colorTextSecondary: "#6b7280"
        }
      }}
    >
      <ClerkApp />
    </ClerkProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
