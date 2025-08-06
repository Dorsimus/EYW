# Test Credentials for Earn Your Wings Platform

## How to Access the System

Since we're using Clerk.com for authentication, you can sign in using any of these methods:

### Option 1: Create Your Own Account
1. Go to the login page
2. Click "Sign In to Continue"
3. Click "Sign up" to create a new account
4. Use your email and create a password
5. You'll have regular user access to test the platform

### Option 2: Demo User Account (If Set Up)
**Email:** demo@earnwings.com
**Password:** EarnWings2024!

*Note: This account needs to be created in the Clerk dashboard*

### Option 3: Admin Access
For admin access, you need to:
1. Create a regular account first
2. Have the admin add your user ID to the admin role in Clerk's dashboard
3. Or use the demo admin credentials if set up

## What You Can Test

### Regular User Features:
- View competency areas
- Complete tasks and activities 
- Track progress through levels
- Add portfolio items
- Use the Leadership Flightbook
- View culminating project phases

### Admin Features (if you have admin access):
- User management
- Task creation and editing
- Content management
- System statistics
- Admin dashboard

## Setting Up Admin Access

To set up admin access for a user:
1. Go to Clerk Dashboard (https://dashboard.clerk.com/)
2. Find the user in Users section
3. Edit their metadata to add: `{"roles": ["admin"]}`
4. Save the changes
5. User will have admin access on next login

## Current Configuration

- **Platform:** All EYW levels (not just Navigator)
- **Branding:** "Redstone Employee Development"  
- **Logo:** EYW Winged Emblem displayed on login
- **Authentication:** Clerk.com with custom styling
- **Features:** Full competency tracking, portfolio management, admin panel

## Technical Details

- Frontend running on port 3000
- Backend API on port 8001 (routed via /api)
- MongoDB for data storage
- Clerk.com for authentication
- All environment variables properly secured