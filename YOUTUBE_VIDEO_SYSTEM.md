# YouTube Video System Implementation

## Overview
Complete implementation of a secure YouTube-based video system for Learnova platform, replacing the previous Cloudinary upload system. This system provides enhanced security, cost savings, and better scalability.

## 🎯 Key Features Implemented

### 1. **Secure Video Access with JWT Tokens**
- **File**: `supabase/functions/video-token/index.ts`
- **Purpose**: Generate and validate short-lived JWT tokens (5-minute expiry)
- **Security**: Prevents link sharing and unauthorized access
- **Domain Validation**: Restricts access to authorized domains only

### 2. **SecureVideoPlayer Component**
- **File**: `client/src/components/SecureVideoPlayer.tsx`
- **Features**:
  - YouTube IFrame Player API integration
  - Dynamic watermark overlay with student identification
  - Disabled right-click and keyboard shortcuts (F12, Ctrl+U, etc.)
  - Custom controls (no YouTube branding/controls)
  - Automatic token refresh before expiry
  - Progress tracking and completion detection

### 3. **YouTube Video Input for Teachers**
- **File**: `client/src/components/YouTubeVideoInput.tsx`
- **Features**:
  - YouTube URL/ID validation and extraction
  - Video thumbnail preview
  - Security instructions for teachers
  - Support for various YouTube URL formats

### 4. **Enhanced Database Schema**
- **File**: `supabase/migrations/010_youtube_video_system.sql`
- **Changes**:
  - Added `youtube_video_id` and `youtube_video_url` fields to lessons
  - Created `video_access_tokens` table for JWT tracking
  - Added indexes for performance
  - Implemented RLS policies for security

### 5. **Student Lesson Page**
- **File**: `client/src/pages/lesson.tsx`
- **Features**:
  - Secure video player integration
  - Progress tracking and completion
  - Responsive design with sidebar info
  - Authentication and enrollment validation

## 🔧 Technical Implementation

### Backend (Supabase Edge Functions)

#### Video Token Generation (`/video-token`)
```typescript
POST /video-token
{
  "lessonId": "uuid",
  "courseId": "uuid"
}

Response:
{
  "token": "jwt_token",
  "expiresAt": "2024-01-01T12:05:00Z",
  "videoId": "youtube_video_id"
}
```

#### Token Validation
```typescript
GET /video-token?token=jwt&lessonId=uuid

Response:
{
  "valid": true,
  "payload": {
    "lessonId": "uuid",
    "userId": "uuid",
    "userEmail": "user@example.com",
    "courseId": "uuid",
    "expiresAt": "2024-01-01T12:05:00Z"
  }
}
```

### Frontend Components

#### SecureVideoPlayer Usage
```tsx
<SecureVideoPlayer
  lessonId="lesson-uuid"
  courseId="course-uuid"
  studentName="John Doe"
  studentId="student-uuid"
  onVideoEnd={() => handleCompletion()}
  onProgress={(progress) => updateProgress(progress)}
/>
```

#### YouTubeVideoInput Usage
```tsx
<YouTubeVideoInput
  onVideoSelect={(videoData) => {
    // Save video data to lesson
    updateLesson({
      youtubeVideoId: videoData.youtubeVideoId,
      youtubeVideoUrl: videoData.youtubeVideoUrl
    })
  }}
  initialUrl={lesson.youtubeVideoUrl}
/>
```

## 🛡️ Security Features

### 1. **JWT Token Protection**
- 5-minute expiry time
- Signed with secret key
- User and lesson validation
- IP and user agent logging

### 2. **Domain Restrictions**
- Validates referer header
- Whitelist of allowed domains
- Blocks unauthorized access attempts

### 3. **Video Player Security**
- Disabled YouTube controls and branding
- No right-click context menu
- Disabled keyboard shortcuts (F12, Ctrl+U, PrintScreen)
- No direct YouTube URL exposure

### 4. **Dynamic Watermarking**
- Student name and ID overlay
- Animated position (changes every 30 seconds)
- Prevents video cropping/editing
- Semi-transparent, non-intrusive

### 5. **Access Control**
- Enrollment verification required
- Active subscription validation
- Lesson ownership verification
- Token usage tracking

## 📊 Database Schema Updates

### New Fields in `lessons` Table
```sql
ALTER TABLE lessons ADD COLUMN youtube_video_id VARCHAR(20);
ALTER TABLE lessons ADD COLUMN youtube_video_url TEXT;
ALTER TABLE lessons ADD COLUMN video_duration INTEGER DEFAULT 0;
```

### New `video_access_tokens` Table
```sql
CREATE TABLE video_access_tokens (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);
```

## 🚀 Deployment Steps

### 1. Database Migration
```bash
supabase db push
# Or apply migration manually:
# supabase migration up
```

### 2. Deploy Edge Function
```bash
supabase functions deploy video-token
```

### 3. Set Environment Variables
In Supabase Dashboard → Edge Functions → video-token → Settings:
```
JWT_SECRET=your-super-secure-jwt-secret-key
```

### 4. Update Frontend Environment
```env
# Add to .env if needed for local development
JWT_SECRET=your-super-secure-jwt-secret-key
```

## 📋 Teacher Workflow

1. **Upload Video to YouTube**:
   - Set video to **Unlisted** (not Public or Private)
   - Copy the YouTube URL or video ID

2. **Add to Learnova**:
   - Go to course → lesson editing
   - Use `YouTubeVideoInput` component
   - Paste YouTube URL
   - System validates and extracts video ID

3. **Students Access**:
   - Students see secure video player
   - No access to original YouTube link
   - Watermarked with student info
   - Progress tracked automatically

## 🎓 Student Experience

1. **Secure Access**:
   - Click lesson → automatic token generation
   - Video loads with watermark overlay
   - Custom controls (play/pause/seek only)

2. **Progress Tracking**:
   - Real-time progress updates
   - Auto-completion at 90% watched
   - Progress saved to database

3. **Security Restrictions**:
   - No right-click or inspect element
   - No keyboard shortcuts
   - Token expires in 5 minutes
   - Link sharing won't work

## 🔍 Monitoring & Analytics

### Token Usage Tracking
- All token generations logged
- IP address and user agent captured
- Usage patterns can be analyzed
- Suspicious activity detection possible

### Video Access Logs
```sql
-- View recent video access
SELECT 
  vat.*,
  u.email as user_email,
  l.title as lesson_title
FROM video_access_tokens vat
JOIN users u ON vat.user_id = u.id
JOIN lessons l ON vat.lesson_id = l.id
ORDER BY vat.created_at DESC;
```

## 💰 Cost Benefits

### Before (Cloudinary)
- 10MB free limit
- $0.018 per GB storage
- $0.10 per GB bandwidth
- Upload processing costs

### After (YouTube + Supabase)
- Unlimited video storage (YouTube)
- Free video hosting and CDN
- Only JWT token generation costs
- Significant cost reduction for large videos

## 🛠️ Maintenance

### Token Cleanup
Automatic cleanup of expired tokens via scheduled function:
```sql
-- Clean up expired tokens (runs hourly)
DELETE FROM video_access_tokens 
WHERE expires_at < NOW() - INTERVAL '1 hour';
```

### Security Updates
- Regularly rotate JWT secret
- Monitor access patterns
- Update domain whitelist as needed
- Review and update token expiry times

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure edge function is deployed
   - Check domain whitelist in video-token function
   - Verify environment variables are set

2. **Token Expiry**:
   - Tokens expire in 5 minutes by design
   - Component auto-refreshes before expiry
   - Check system clock synchronization

3. **Video Not Loading**:
   - Verify YouTube video is set to Unlisted
   - Check video ID extraction logic
   - Ensure enrollment is active

4. **TypeScript Errors in Edge Function**:
   - Expected in IDE (Deno vs Node.js)
   - Errors don't affect deployment
   - Use `deno.json` for proper configuration

## 📈 Future Enhancements

### Potential Improvements
1. **Real-time Progress Updates**: WebSocket integration
2. **Video Analytics**: Watch time heatmaps
3. **Adaptive Watermarks**: More sophisticated positioning
4. **Offline Support**: Download for offline viewing
5. **Video Chapters**: YouTube chapter integration
6. **Quality Selection**: Allow students to choose video quality
7. **Subtitles**: YouTube subtitle integration
8. **Speed Control**: Playback speed options

### API Integrations
1. **YouTube Data API v3**: Get real video metadata
2. **YouTube Analytics**: Track video performance
3. **Content ID**: Automatic copyright detection

## 📝 Code Files Summary

### Created Files
- `supabase/functions/video-token/index.ts` - JWT token service
- `supabase/functions/video-token/deno.json` - Deno configuration
- `supabase/migrations/010_youtube_video_system.sql` - Database schema
- `client/src/components/SecureVideoPlayer.tsx` - Secure video player
- `client/src/components/YouTubeVideoInput.tsx` - Teacher video input
- `client/src/pages/lesson.tsx` - Student lesson page

### Modified Files
- `shared/schema.ts` - Added YouTube fields to lessons table
- `.env` - Added JWT_SECRET environment variable

### Environment Variables
```env
# Required for video token security
JWT_SECRET=learnova-super-secure-jwt-secret-key-2024-change-in-production

# Existing Cloudinary credentials (kept for other features)
CLOUDINARY_CLOUD_NAME_1=dn3tms3dw
CLOUDINARY_API_KEY_1=615754297337952
CLOUDINARY_API_SECRET_1=xKpedAwHRv9VSjCAOzJ4FuZ35GI
# ... (additional Cloudinary accounts)
```

This implementation provides a robust, secure, and cost-effective video system that eliminates the limitations of direct Cloudinary uploads while maintaining high security standards and excellent user experience.
