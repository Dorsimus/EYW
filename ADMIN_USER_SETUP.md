# Creating an Admin User for EYW Platform

## 🎯 **Quick Setup Guide**

You need admin access to build out tasks and manage content. Here's exactly how to create an admin user:

## **Step 1: Sign Up for a Regular Account**

1. Go to your EYW platform: `https://your-domain.preview.emergentagent.com`
2. Click **"Sign In to Continue"**
3. Click **"Sign up"** to create a new account
4. Use your email and create a password
5. Complete the signup process
6. **Note your exact email address** - you'll need it for Step 2

## **Step 2: Access Clerk Dashboard**

1. Go to **[Clerk Dashboard](https://dashboard.clerk.com/)**
2. Sign in with your Clerk account (the one used to set up this project)
3. Select your **EYW project/application**
4. Navigate to **"Users"** in the left sidebar

## **Step 3: Find Your User Account**

1. In the Users list, find the account you just created
2. Look for the email address you registered with
3. Click on that user to open their profile
4. You should see user details and a **"Metadata"** section

## **Step 4: Add Admin Role**

1. Look for the **"Public metadata"** section (or just "Metadata")
2. Click **"Edit"** or the edit button
3. Add this exact JSON:
   ```json
   {
     "roles": ["admin"]
   }
   ```
4. Click **"Save"** or **"Update"**

## **Step 5: Activate Admin Access**

1. Go back to your EYW platform
2. **Sign out** (click your profile picture → Sign out)
3. **Sign back in** with the same account
4. The page should now show **admin navigation tabs** at the top:
   - 🎛️ Admin Dashboard
   - 👥 Users  
   - 📚 Content
   - 🎮 Levels
   - 🧪 Testing

## **Step 6: Test Admin Access**

1. Click **"Admin Dashboard"** - you should see admin overview
2. Click **"Content"** - this is where you'll build out tasks
3. Click **"Users"** - manage user accounts here
4. All admin tools should now be accessible!

---

## 🚨 **Alternative: Quick Admin Setup**

If you have trouble with Clerk Dashboard, here's an alternative approach:

### **Method 2: Direct Database/Environment Setup**
1. For testing purposes, you can temporarily modify the code to grant admin access
2. In the AuthenticatedApp component, temporarily change:
   ```javascript
   const isAdmin = user?.publicMetadata?.roles?.includes('admin') || false;
   ```
   to:
   ```javascript
   const isAdmin = true; // TEMPORARY - for testing only
   ```
3. This gives immediate admin access for testing
4. **Remember to change it back** once you've set up proper admin roles in Clerk

---

## 🎯 **What You Can Do as Admin**

Once you have admin access, you can:

### **Content Management (Build Out Tasks)**
- Create new learning tasks across all 5 competency areas
- Edit existing courses, activities, and resources
- Organize content by competency and sub-competency
- Set task requirements and completion criteria

### **User Management**
- Create demo user accounts for testing
- Track user progress and completions
- Approve level advancements
- Manage user roles and permissions

### **System Configuration**
- Configure level requirements and progressions
- Set up assessment workflows
- Monitor platform performance
- Test functionality and integrations

---

## 🏆 **Success Indicators**

You'll know admin access is working when:
- ✅ Admin navigation tabs appear at top of page
- ✅ "Admin Dashboard" shows system statistics  
- ✅ "Content" tab allows task creation/editing
- ✅ "Users" tab shows user management interface
- ✅ Footer no longer shows "Admin Tools" button (since you have access)

## 🛠️ **Ready to Build!**

Once admin access is confirmed, you can start building out tasks using the Content Management tools. The admin interface provides full CRUD operations for all learning content across the platform.

Need help with specific admin tasks? The admin dashboard includes helpful tooltips and guidance for each feature!