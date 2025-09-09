#!/usr/bin/env python3
"""
CRITICAL SECURITY VERIFICATION SCRIPT
Verifies all security fixes implemented for production deployment
"""

import os
import re
import sys
import json
import secrets
from pathlib import Path

class SecurityVerifier:
    def __init__(self):
        self.issues = []
        self.fixes_verified = []
        self.app_root = Path("/app")
        
    def log_issue(self, severity, category, description, file_path=None):
        """Log a security issue"""
        self.issues.append({
            "severity": severity,
            "category": category, 
            "description": description,
            "file": file_path
        })
        
    def log_fix(self, category, description):
        """Log a verified security fix"""
        self.fixes_verified.append({
            "category": category,
            "description": description
        })

    def verify_environment_variables(self):
        """Verify environment variable security"""
        print("🔍 Verifying Environment Variable Security...")
        
        # Check backend .env
        backend_env = self.app_root / "backend" / ".env"
        if backend_env.exists():
            content = backend_env.read_text()
            
            # Check for secure SECRET_KEY
            if "SECRET_KEY=" in content:
                secret_match = re.search(r'SECRET_KEY="([^"]+)"', content)
                if secret_match:
                    secret_key = secret_match.group(1)
                    if secret_key == "your-secret-key-here-change-in-production":
                        self.log_issue("CRITICAL", "SECRET_KEY", "Default insecure SECRET_KEY still in use", str(backend_env))
                    elif len(secret_key) < 32:
                        self.log_issue("HIGH", "SECRET_KEY", "SECRET_KEY too short (< 32 chars)", str(backend_env))
                    else:
                        self.log_fix("SECRET_KEY", f"Secure SECRET_KEY configured ({len(secret_key)} chars)")
                        
            # Check for CORS configuration
            if "ALLOWED_ORIGINS=" in content:
                origins_match = re.search(r'ALLOWED_ORIGINS="([^"]+)"', content)
                if origins_match:
                    origins = origins_match.group(1)
                    if "*" in origins:
                        self.log_issue("HIGH", "CORS", "Wildcard CORS origins configured", str(backend_env))
                    else:
                        self.log_fix("CORS", f"Specific CORS origins configured: {origins}")
                        
            # Check for production mode
            if "PRODUCTION_MODE=" in content:
                self.log_fix("PRODUCTION", "Production mode configuration present")
        
        # Check frontend .env
        frontend_env = self.app_root / "frontend" / ".env"
        if frontend_env.exists():
            content = frontend_env.read_text()
            
            # Check for hardcoded URLs
            if "prelaunch-check.preview.emergentagent.com" in content:
                self.log_issue("HIGH", "HARDCODED_URL", "Hardcoded preview URL in frontend .env", str(frontend_env))
            elif "REACT_APP_BACKEND_URL=${BACKEND_URL}" in content:
                self.log_fix("ENVIRONMENT_URL", "Frontend using environment variable for backend URL")

    def verify_hardcoded_urls(self):
        """Check for hardcoded URLs in codebase"""
        print("🔍 Scanning for Hardcoded URLs...")
        
        # Files to check
        files_to_check = [
            self.app_root / "backend" / "server.py",
            self.app_root / "backend" / "server_backup.py",
            self.app_root / "backend" / "auth_utils.py"
        ]
        
        hardcoded_url_pattern = r"https://prelaunch-check\.preview\.emergentagent\.com"
        
        for file_path in files_to_check:
            if file_path.exists():
                content = file_path.read_text()
                matches = re.findall(hardcoded_url_pattern, content)
                if matches:
                    self.log_issue("MEDIUM", "HARDCODED_URL", f"Found {len(matches)} hardcoded preview URLs", str(file_path))
                else:
                    self.log_fix("HARDCODED_URL", f"No hardcoded URLs found in {file_path.name}")

    def verify_admin_backdoors(self):
        """Check for hardcoded admin user IDs"""
        print("🔍 Checking for Admin Backdoors...")
        
        files_to_check = [
            self.app_root / "backend" / "server.py",
            self.app_root / "backend" / "server_backup.py", 
            self.app_root / "backend" / "auth_utils.py"
        ]
        
        backdoor_pattern = r"user_30vth9baPWjZZCkjLSUgOrW2Mvy"
        
        for file_path in files_to_check:
            if file_path.exists():
                content = file_path.read_text()
                matches = re.findall(backdoor_pattern, content)
                if matches:
                    self.log_issue("CRITICAL", "ADMIN_BACKDOOR", f"Found {len(matches)} hardcoded admin user IDs", str(file_path))
                else:
                    self.log_fix("ADMIN_BACKDOOR", f"No hardcoded admin user IDs in {file_path.name}")

    def verify_cors_configuration(self):
        """Verify CORS configuration in server files"""
        print("🔍 Verifying CORS Configuration...")
        
        files_to_check = [
            self.app_root / "backend" / "server.py",
            self.app_root / "backend" / "server_backup.py"
        ]
        
        for file_path in files_to_check:
            if file_path.exists():
                content = file_path.read_text()
                
                # Check for wildcard CORS
                if 'allow_origins=["*"]' in content:
                    self.log_issue("HIGH", "CORS", "Wildcard CORS configuration found", str(file_path))
                elif "cors_origins" in content and "ALLOWED_ORIGINS" in content:
                    self.log_fix("CORS", f"Dynamic CORS configuration implemented in {file_path.name}")
                elif "allow_origins=" in content:
                    # Check if it's using environment-based configuration
                    if "ALLOWED_ORIGINS" in content or "cors_origins" in content:
                        self.log_fix("CORS", f"Environment-based CORS configuration in {file_path.name}")
                    else:
                        self.log_issue("MEDIUM", "CORS", "Static CORS configuration found", str(file_path))

    def verify_secret_key_validation(self):
        """Verify SECRET_KEY validation logic"""
        print("🔍 Verifying SECRET_KEY Validation...")
        
        files_to_check = [
            self.app_root / "backend" / "server.py",
            self.app_root / "backend" / "server_backup.py"
        ]
        
        for file_path in files_to_check:
            if file_path.exists():
                content = file_path.read_text()
                
                # Check for production SECRET_KEY validation
                if 'raise ValueError("PRODUCTION SECRET_KEY must be configured' in content:
                    self.log_fix("SECRET_KEY", f"Production SECRET_KEY validation implemented in {file_path.name}")
                elif "secrets.token_urlsafe" in content:
                    self.log_fix("SECRET_KEY", f"Cryptographic SECRET_KEY generation in {file_path.name}")
                elif "your-secret-key-here-change-in-production" in content:
                    self.log_issue("CRITICAL", "SECRET_KEY", "Default insecure SECRET_KEY still present", str(file_path))

    def generate_security_report(self):
        """Generate comprehensive security report"""
        print("\n" + "="*80)
        print("🛡️  CRITICAL SECURITY VERIFICATION REPORT")
        print("="*80)
        
        # Summary
        critical_issues = [i for i in self.issues if i["severity"] == "CRITICAL"]
        high_issues = [i for i in self.issues if i["severity"] == "HIGH"] 
        medium_issues = [i for i in self.issues if i["severity"] == "MEDIUM"]
        
        print(f"\n📊 SECURITY SUMMARY:")
        print(f"   ✅ Fixes Verified: {len(self.fixes_verified)}")
        print(f"   🔴 Critical Issues: {len(critical_issues)}")
        print(f"   🟡 High Issues: {len(high_issues)}")
        print(f"   🟠 Medium Issues: {len(medium_issues)}")
        
        # Verified Fixes
        if self.fixes_verified:
            print(f"\n✅ VERIFIED SECURITY FIXES ({len(self.fixes_verified)}):")
            for fix in self.fixes_verified:
                print(f"   ✓ {fix['category']}: {fix['description']}")
        
        # Critical Issues
        if critical_issues:
            print(f"\n🔴 CRITICAL SECURITY ISSUES ({len(critical_issues)}):")
            for issue in critical_issues:
                print(f"   ❌ {issue['category']}: {issue['description']}")
                if issue['file']:
                    print(f"      📁 File: {issue['file']}")
        
        # High Issues  
        if high_issues:
            print(f"\n🟡 HIGH PRIORITY ISSUES ({len(high_issues)}):")
            for issue in high_issues:
                print(f"   ⚠️  {issue['category']}: {issue['description']}")
                if issue['file']:
                    print(f"      📁 File: {issue['file']}")
        
        # Medium Issues
        if medium_issues:
            print(f"\n🟠 MEDIUM PRIORITY ISSUES ({len(medium_issues)}):")
            for issue in medium_issues:
                print(f"   ⚡ {issue['category']}: {issue['description']}")
                if issue['file']:
                    print(f"      📁 File: {issue['file']}")
        
        # Production Readiness Assessment
        print(f"\n🎯 PRODUCTION READINESS ASSESSMENT:")
        if critical_issues:
            print("   ❌ NOT READY FOR PRODUCTION - Critical security issues must be resolved")
            return False
        elif high_issues:
            print("   ⚠️  CAUTION - High priority security issues should be addressed")
            return False
        else:
            print("   ✅ READY FOR PRODUCTION - All critical security fixes verified")
            return True

    def run_verification(self):
        """Run complete security verification"""
        print("🚀 Starting Critical Security Verification...")
        print("="*60)
        
        self.verify_environment_variables()
        self.verify_hardcoded_urls()
        self.verify_admin_backdoors()
        self.verify_cors_configuration()
        self.verify_secret_key_validation()
        
        return self.generate_security_report()

def main():
    """Main verification function"""
    verifier = SecurityVerifier()
    production_ready = verifier.run_verification()
    
    print("\n" + "="*80)
    if production_ready:
        print("🎉 SECURITY VERIFICATION COMPLETE - PRODUCTION READY!")
        sys.exit(0)
    else:
        print("🚨 SECURITY VERIFICATION FAILED - RESOLVE ISSUES BEFORE PRODUCTION")
        sys.exit(1)

if __name__ == "__main__":
    main()