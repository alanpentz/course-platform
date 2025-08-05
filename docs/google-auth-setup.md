# Google Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for the Course Platform using Supabase.

## Prerequisites

- Access to your Supabase project dashboard
- A Google Cloud Console account

## Step 1: Set up Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - For local development: `http://localhost:3000/auth/callback`

5. Save your:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find "Google" in the list and enable it
5. Enter your Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
6. Save the configuration

## Step 3: Update Redirect URLs

1. In Supabase Dashboard, go to "Authentication" > "URL Configuration"
2. Add your site URL (e.g., `http://localhost:3000` for development)
3. Ensure the redirect URL matches: `/auth/callback`

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/login`
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to `/dashboard`

## Security Considerations

1. **Production Setup**:
   - Always use HTTPS in production
   - Update redirect URLs to your production domain
   - Restrict OAuth client to specific domains

2. **User Data**:
   - Google OAuth users will have their email and name automatically populated
   - The database trigger will create a profile with default role (student)
   - Users can update their role in profile settings

3. **Environment Variables**:
   - No additional environment variables needed for Google OAuth
   - Supabase handles the OAuth flow internally

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**:
   - Ensure the redirect URI in Google Console exactly matches Supabase's callback URL
   - Check for trailing slashes or protocol differences (http vs https)

2. **User not redirected after login**:
   - Check that `/auth/callback` route is properly implemented
   - Verify the `redirectTo` parameter in `signInWithGoogle()`

3. **Profile not created**:
   - Check the database trigger `on_auth_user_created` is active
   - Verify the trigger function has proper permissions

## Additional OAuth Providers

The implementation supports other providers. To add them:

1. Enable the provider in Supabase Dashboard
2. Use the `signInWithProvider()` function:
   ```typescript
   signInWithProvider('github')  // or 'azure', etc.
   ```

3. Add provider-specific buttons to the auth pages