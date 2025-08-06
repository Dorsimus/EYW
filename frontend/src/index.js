import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ClerkApp from "./ClerkApp";
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
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
  </React.StrictMode>
);
