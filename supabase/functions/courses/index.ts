// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createSupabaseClient, getAuthenticatedUser } from '../_shared/supabase.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createSupabaseClient(req)

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const courseId = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'GET':
        if (courseId && courseId !== 'courses') {
          // Get single course with chapters and lessons
          const { data: course, error: courseError } = await supabaseClient
            .from('courses')
            .select(`
              *,
              teacher:users!courses_teacher_id_fkey(id, name, email, avatar_url),
              chapters(
                *,
                lessons(*)
              )
            `)
            .eq('id', courseId)
            .single()

          if (courseError) {
            return new Response(JSON.stringify({ error: courseError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify(course), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Get all published courses
          const { data: courses, error } = await supabaseClient
            .from('courses')
            .select(`
              *,
              teacher:users!courses_teacher_id_fkey(id, name, email, avatar_url)
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false })

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify(courses), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

      case 'POST':
        // Create new course
        const courseData = await req.json()
        
        // Get user from auth
        const user = await getAuthenticatedUser(supabaseClient)

        const { data: course, error: createError } = await supabaseClient
          .from('courses')
          .insert({
            ...courseData,
            teacher_id: user.id
          })
          .select()
          .single()

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(course), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'PUT':
        // Update course
        const updateData = await req.json()
        
        const { data: updatedCourse, error: updateError } = await supabaseClient
          .from('courses')
          .update(updateData)
          .eq('id', courseId)
          .select()
          .single()

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(updatedCourse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        // Delete course
        const { error: deleteError } = await supabaseClient
          .from('courses')
          .delete()
          .eq('id', courseId)

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
