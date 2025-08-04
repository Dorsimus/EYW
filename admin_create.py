#!/usr/bin/env python3
"""
Admin User Creation Script
Run this to create the first admin user for the Earn Your Wings platform
"""

import asyncio
import requests
import sys

# Configuration
API_URL = "https://dfa066c0-2724-4f8c-87ee-696b2f1f82b7.preview.emergentagent.com/api"

async def create_admin():
    print("🔧 Creating Admin User for Earn Your Wings Platform")
    print("=" * 50)
    
    # Get admin details
    name = input("Enter admin name: ") or "Admin User"
    email = input("Enter admin email: ") or "admin@earnwings.com"
    password = input("Enter admin password: ") or "admin123"
    
    # Create admin user
    admin_data = {
        "email": email,
        "name": name,
        "role": "admin",
        "level": "navigator",
        "is_admin": True,
        "password": password
    }
    
    try:
        response = requests.post(f"{API_URL}/admin/create", json=admin_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Admin user created successfully!")
            print(f"User ID: {result['user_id']}")
            print(f"Email: {email}")
            print(f"Password: {password}")
            print("\nYou can now login to the admin panel using these credentials.")
            return True
        else:
            print(f"❌ Failed to create admin user: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(create_admin())
    sys.exit(0 if success else 1)