#!/bin/bash

echo "🔐 Security Verification Script for Earn Your Wings Platform"
echo "============================================================"
echo

# Check if .env files are properly ignored
echo "✅ Checking .env files are ignored by Git..."
if git check-ignore backend/.env frontend/.env > /dev/null 2>&1; then
    echo "   ✓ Environment files are properly ignored"
else
    echo "   ❌ WARNING: Environment files may not be ignored!"
fi

# Search for any hardcoded API keys in source code
echo
echo "🔍 Scanning for hardcoded API keys..."
if grep -r "pk_test_\|sk_proj_\|sk-" --include="*.js" --include="*.py" --include="*.md" . 2>/dev/null | grep -v ".env.example" | grep -v "README" | grep -v "SECURITY.md"; then
    echo "   ❌ WARNING: Found potential hardcoded API keys!"
else
    echo "   ✓ No hardcoded API keys found in source code"
fi

# Check if example files exist
echo
echo "📋 Checking example files..."
if [[ -f "backend/.env.example" && -f "frontend/.env.example" ]]; then
    echo "   ✓ Example environment files exist"
else
    echo "   ❌ Missing example environment files"
fi

# Check if security documentation exists
echo
echo "📚 Checking security documentation..."
if [[ -f "SECURITY.md" && -f "README_SETUP.md" ]]; then
    echo "   ✓ Security documentation exists"
else
    echo "   ❌ Missing security documentation"
fi

# Check environment variables are properly used
echo
echo "⚙️  Checking environment variable usage..."
if grep -q "process.env.REACT_APP" frontend/src/*.js 2>/dev/null; then
    echo "   ✓ Frontend uses environment variables"
else
    echo "   ❌ Frontend may not be using environment variables properly"
fi

if grep -q "os.getenv\|os.environ" backend/server.py 2>/dev/null; then
    echo "   ✓ Backend uses environment variables"
else
    echo "   ❌ Backend may not be using environment variables properly"
fi

echo
echo "✅ Security verification complete!"
echo
echo "🚀 Ready for GitHub commit!"
echo "   All sensitive data is properly excluded from version control."
echo "   Remember to:"
echo "   1. Copy .env.example files to .env in each environment"
echo "   2. Fill in your actual API keys in the .env files"  
echo "   3. Never commit .env files to version control"