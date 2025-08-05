# Course Platform CMS (Sanity Studio)

This is the Sanity Studio for managing course content.

## Setup

1. **Create a Sanity Project**
   - Go to [sanity.io](https://www.sanity.io/) and create an account
   - Create a new project
   - Copy your project ID

2. **Configure Environment Variables**
   
   Create `.env` file in this directory:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your-api-token
   ```

   Also add these to your web app's `.env.local`:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your-api-token
   SANITY_WEBHOOK_SECRET=your-webhook-secret
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Deploy GraphQL API** (optional)
   ```bash
   npm run deploy-graphql
   ```

5. **Run Studio Locally**
   ```bash
   npm run dev
   ```

## Content Structure

### Course
- Title, slug, description
- Thumbnail image
- Instructor reference
- Category reference
- Price and duration
- Level (beginner/intermediate/advanced)
- Prerequisites and learning objectives
- Lessons array
- Published status

### Lesson
- Title, slug, description
- Rich content (with code blocks, images, callouts)
- Video URL and duration
- Downloadable resources
- Quiz questions
- Order within course

### Instructor
- Name, email, bio
- Avatar image
- Areas of expertise
- Social links

### Category
- Title, slug, description
- Icon

## Webhooks

To sync content with Supabase:

1. Go to your Sanity project settings
2. Add a webhook with URL: `https://your-domain.com/api/webhooks/sanity`
3. Set the secret to match `SANITY_WEBHOOK_SECRET`
4. Select document types: course, lesson

## Deployment

To deploy the studio:

```bash
npm run deploy
```

This will deploy to `https://your-project-id.sanity.studio/`

## Best Practices

1. **Images**: Use Sanity's image pipeline for optimization
2. **Slugs**: Always generate from title for consistency
3. **Publishing**: Use the isPublished flag to control visibility
4. **Rich Content**: Use the blockContent schema for flexible content
5. **References**: Link instructors and categories for better organization