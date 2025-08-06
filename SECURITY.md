# Security Guidelines - Earn Your Wings Platform

## API Key Security

### ✅ What's Protected
- All `.env` files are excluded from Git via `.gitignore`
- Example files (`.env.example`) are provided without real keys
- No hardcoded API keys in source code
- Sensitive environment variables are required at runtime

### 🔑 API Keys Used
1. **OpenAI API Key** (`OPENAI_API_KEY`) - Backend only
2. **Clerk Publishable Key** (`REACT_APP_CLERK_PUBLISHABLE_KEY`) - Frontend (safe for client)
3. **Clerk JWKS URL** (`CLERK_JWKS_URL`) - Backend configuration
4. **Clerk Issuer URL** (`CLERK_ISSUER`) - Backend configuration

### 🛡️ Security Measures Implemented

#### Backend Security
- JWT token validation using Clerk's JWKS endpoint
- Role-based access control for admin endpoints
- Environment variable validation at startup
- Secure MongoDB connection strings
- CORS properly configured
- No API keys in source code

#### Frontend Security
- Clerk publishable keys are safe for client-side use
- Authentication tokens handled by Clerk SDK
- No sensitive keys exposed to client
- Proper sign-out functionality

### 🔧 Development Setup

1. **Never commit `.env` files**
2. **Copy example files**: `cp .env.example .env`
3. **Fill in real values** in your local `.env` files
4. **Use different keys** for development vs production
5. **Rotate keys regularly**

### 🚨 If Keys Are Compromised

#### OpenAI API Key
1. Immediately revoke the key at [OpenAI Platform](https://platform.openai.com/api-keys)
2. Generate a new key
3. Update all environments

#### Clerk Keys
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Regenerate publishable key if needed
3. Update environment files
4. Restart applications

### 📋 Pre-Deployment Checklist

- [ ] All `.env` files excluded from Git
- [ ] No hardcoded API keys in source code
- [ ] Example files created for all environments
- [ ] Environment validation in place
- [ ] Different keys for production
- [ ] HTTPS configured for production
- [ ] CORS properly configured
- [ ] Admin roles configured in Clerk

### 🔍 How to Verify Security

```bash
# Check that .env files are ignored
git status --ignored | grep .env

# Search for any hardcoded keys (should return nothing)
grep -r "pk_test_\|sk_proj_\|sk-" --include="*.js" --include="*.py" --include="*.md" . || echo "No hardcoded keys found"

# Verify gitignore is working
git check-ignore backend/.env frontend/.env
```

## Deployment Considerations

### Environment Variables in Production
- Use secure secret management (not plain text files)
- Rotate keys regularly
- Monitor API usage for anomalies
- Set up alerts for authentication failures

### Monitoring
- Log authentication attempts
- Monitor API rate limits
- Track unusual access patterns
- Set up alerts for admin access