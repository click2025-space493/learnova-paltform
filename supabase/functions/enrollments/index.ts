import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    switch (method) {
      case 'GET':
        // Get user's enrollments
        const { data: enrollments, error } = await supabaseClient
          .from('enrollments')
          .select(`
            *,
            course:courses(
              *,
              teacher:users!courses_teacher_id_fkey(id, name, email, avatar_url),
              chapters(
                *,
                lessons(*)
              )
            )
          `)
          .eq('student_id', user.id)
          .order('enrolled_at', { ascending: false })

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(enrollments), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'POST':
        // Enroll in course
        const { course_id } = await req.json()
        
        // Check if already enrolled
        const { data: existingEnrollment } = await supabaseClient
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', course_id)
          .single()

        if (existingEnrollment) {
          return new Response(JSON.stringify({ error: 'Already enrolled in this course' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: enrollment, error: enrollError } = await supabaseClient
          .from('enrollments')
          .insert({
            student_id: user.id,
            course_id,
            progress: 0
          })
          .select()
          .single()

        if (enrollError) {
          return new Response(JSON.stringify({ error: enrollError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(enrollment), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'PUT':
        // Update enrollment progress
        const enrollmentId = pathSegments[pathSegments.length - 1]
        const { progress, completed_at } = await req.json()
        
        const updateData: any = { progress }
        if (completed_at) {
          updateData.completed_at = completed_at
        }

        const { data: updatedEnrollment, error: updateError } = await supabaseClient
          .from('enrollments')
          .update(updateData)
          .eq('id', enrollmentId)
          .eq('student_id', user.id) // Ensure user can only update their own enrollments
          .select()
          .single()

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(updatedEnrollment), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        // Unenroll from course
        const courseIdToUnenroll = pathSegments[pathSegments.length - 1]
        
        const { error: deleteError } = await supabaseClient
          .from('enrollments')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseIdToUnenroll)

        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
