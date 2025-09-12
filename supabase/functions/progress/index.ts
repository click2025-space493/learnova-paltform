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

    switch (method) {
      case 'GET':
        // Get lesson progress for a course
        const courseId = url.searchParams.get('course_id')
        if (!courseId) {
          return new Response(JSON.stringify({ error: 'course_id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: progress, error } = await supabaseClient
          .from('lesson_progress')
          .select(`
            *,
            lesson:lessons(
              *,
              chapter:chapters(*)
            )
          `)
          .eq('student_id', user.id)
          .in('lesson_id', 
            supabaseClient
              .from('lessons')
              .select('id')
              .in('chapter_id',
                supabaseClient
                  .from('chapters')
                  .select('id')
                  .eq('course_id', courseId)
              )
          )

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(progress), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'POST':
        // Update lesson progress
        const { lesson_id, watch_time, completed } = await req.json()
        
        // Upsert lesson progress
        const { data: lessonProgress, error: progressError } = await supabaseClient
          .from('lesson_progress')
          .upsert({
            student_id: user.id,
            lesson_id,
            watch_time,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          }, {
            onConflict: 'student_id,lesson_id'
          })
          .select()
          .single()

        if (progressError) {
          return new Response(JSON.stringify({ error: progressError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // If lesson completed, update course enrollment progress
        if (completed) {
          // Get course info through lesson -> chapter -> course
          const { data: lesson } = await supabaseClient
            .from('lessons')
            .select(`
              chapter:chapters(
                course_id
              )
            `)
            .eq('id', lesson_id)
            .single()

          if (lesson?.chapter?.course_id) {
            // Calculate overall course progress
            const { data: allLessons } = await supabaseClient
              .from('lessons')
              .select('id')
              .in('chapter_id',
                supabaseClient
                  .from('chapters')
                  .select('id')
                  .eq('course_id', lesson.chapter.course_id)
              )

            const { data: completedLessons } = await supabaseClient
              .from('lesson_progress')
              .select('id')
              .eq('student_id', user.id)
              .eq('completed', true)
              .in('lesson_id', allLessons?.map(l => l.id) || [])

            const totalLessons = allLessons?.length || 0
            const completedCount = completedLessons?.length || 0
            const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0

            // Update enrollment progress
            await supabaseClient
              .from('enrollments')
              .update({
                progress: progressPercentage,
                completed_at: progressPercentage >= 100 ? new Date().toISOString() : null
              })
              .eq('student_id', user.id)
              .eq('course_id', lesson.chapter.course_id)
          }
        }

        return new Response(JSON.stringify(lessonProgress), {
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
