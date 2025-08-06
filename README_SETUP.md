# Earn Your Wings Platform - Environment Setup

## Prerequisites

1. **Clerk.com Account**: Sign up at [https://clerk.com](https://clerk.com)
2. **OpenAI API Key**: Get your API key from [https://platform.openai.com](https://platform.openai.com)
3. **MongoDB**: Local MongoDB instance or MongoDB Atlas connection

## Environment Configuration

### Backend Setup

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in your actual values in `backend/.env`:
   - `MONGO_URL`: Your MongoDB connection string
   - `DB_NAME`: Your database name
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `CLERK_JWKS_URL`: Your Clerk instance JWKS URL
   - `CLERK_ISSUER`: Your Clerk instance URL

### Frontend Setup

1. Copy the example environment file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. Fill in your actual values in `frontend/.env`:
   - `REACT_APP_BACKEND_URL`: Your backend API URL
   - `REACT_APP_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

## Clerk.com Configuration

### Creating a Clerk Application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Choose "Email" and "Password" as authentication methods
4. Copy your publishable key to `frontend/.env`
5. Note your instance URL (format: `https://your-app-name.clerk.accounts.dev`)

### Setting Up Admin Roles

1. In your Clerk dashboard, go to "Users"
2. Find the user you want to make an admin
3. Edit their "Public metadata" and add:
   ```json
   {
     "roles": ["admin"]
   }
   ```

### Webhook Configuration (Optional)

If you want to sync users to your MongoDB:
1. In Clerk dashboard, go to "Webhooks"
2. Add endpoint: `https://your-backend-url/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`

## Security Notes

- Never commit `.env` files to version control
- Use different API keys for development and production
- Regularly rotate your API keys
- Keep your Clerk secret keys secure (only use in backend)

## Deployment

The platform is designed to work with:
- **Backend**: FastAPI with MongoDB
- **Frontend**: React (Create React App)
- **Authentication**: Clerk.com
- **AI**: OpenAI GPT integration