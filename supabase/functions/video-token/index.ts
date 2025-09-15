// @deno-types="https://deno.land/x/types/react/index.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoTokenPayload {
  lessonId: string
  userId: string
  userEmail: string
  courseId: string
  exp: number
  iat: number
  domain: string
}

// JWT secret key - should be set in environment variables
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production'

async function generateVideoToken(payload: Omit<VideoTokenPayload, 'exp' | 'iat'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload: VideoTokenPayload = {
    ...payload,
    iat: now,
    exp: now + (5 * 60), // 5 minutes expiry
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  return await create({ alg: 'HS256', typ: 'JWT' }, tokenPayload, key)
}

async function verifyVideoToken(token: string): Promise<VideoTokenPayload | null> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const payload = await verify(token, key) as VideoTokenPayload
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null
    }

    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Generate video access token
      const { lessonId, courseId } = await req.json()

      if (!lessonId || !courseId) {
        return new Response(
          JSON.stringify({ error: 'lessonId and courseId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user is the teacher of this course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single()

      if (courseError) {
        return new Response(
          JSON.stringify({ error: 'Course not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const isTeacher = course.teacher_id === user.id

      // If not teacher, verify user has active enrollment
      if (!isTeacher) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'active')
          .single()

        if (enrollmentError || !enrollment) {
          return new Response(
            JSON.stringify({ error: 'Access denied: No active enrollment found' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Verify lesson exists and get its chapter info to find course
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id, 
          youtube_video_id,
          chapter:chapters!inner (
            course_id
          )
        `)
        .eq('id', lessonId)
        .single()

      // Verify lesson belongs to the correct course
      if (lessonError || !lesson || !lesson.youtube_video_id || lesson.chapter.course_id !== courseId) {
        return new Response(
          JSON.stringify({ error: 'Lesson not found or no video available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get client IP and user agent for logging
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const userAgent = req.headers.get('user-agent') || 'unknown'
      const referer = req.headers.get('referer') || ''

      // Validate domain (basic check)
      const allowedDomains = [
        'https://learnova-paltform.vercel.app',
        'https://learnova-platform.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
      ]
      
      const isValidDomain = allowedDomains.some(domain => referer.startsWith(domain))
      if (!isValidDomain && referer) {
        return new Response(
          JSON.stringify({ error: 'Access denied: Invalid domain' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate JWT token
      const videoToken = await generateVideoToken({
        lessonId,
        userId: user.id,
        userEmail: user.email || '',
        courseId,
        domain: referer || 'unknown'
      })

      // Store token hash in database for tracking
      const tokenHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(videoToken)
      )
      const tokenHashHex = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      await supabase
        .from('video_access_tokens')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          token_hash: tokenHashHex,
          expires_at: expiresAt.toISOString(),
          ip_address: clientIP,
          user_agent: userAgent
        })

      return new Response(
        JSON.stringify({
          success: true,
          token: videoToken,
          expiresAt: expiresAt.toISOString(),
          videoId: lesson.youtube_video_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (req.method === 'GET') {
      // Verify video access token
      const url = new URL(req.url)
      const token = url.searchParams.get('token')
      const lessonId = url.searchParams.get('lessonId')

      if (!token || !lessonId) {
        return new Response(
          JSON.stringify({ error: 'Token and lessonId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify JWT token
      const payload = await verifyVideoToken(token)
      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify token matches lesson and user
      if (payload.lessonId !== lessonId || payload.userId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Token mismatch' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark token as used
      const tokenHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(token)
      )
      const tokenHashHex = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      await supabase
        .from('video_access_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token_hash', tokenHashHex)

      return new Response(
        JSON.stringify({
          valid: true,
          payload: {
            lessonId: payload.lessonId,
            userId: payload.userId,
            userEmail: payload.userEmail,
            courseId: payload.courseId,
            expiresAt: new Date(payload.exp * 1000).toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

  } catch (error) {
    console.error('Video token error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
