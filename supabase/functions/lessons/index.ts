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

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const lessonId = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'GET':
        if (lessonId && lessonId !== 'lessons') {
          // Get single lesson
          const { data: lesson, error } = await supabaseClient
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single()

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify(lesson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Get lessons by chapter_id from query params
          const chapterId = url.searchParams.get('chapter_id')
          if (!chapterId) {
            return new Response(JSON.stringify({ error: 'chapter_id is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          const { data: lessons, error } = await supabaseClient
            .from('lessons')
            .select('*')
            .eq('chapter_id', chapterId)
            .order('position', { ascending: true })

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify(lessons), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

      case 'POST':
        // Create new lesson
        const lessonData = await req.json()
        
        const { data: lesson, error: createError } = await supabaseClient
          .from('lessons')
          .insert(lessonData)
          .select()
          .single()

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(lesson), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'PUT':
        // Update lesson
        const updateData = await req.json()
        
        const { data: updatedLesson, error: updateError } = await supabaseClient
          .from('lessons')
          .update(updateData)
          .eq('id', lessonId)
          .select()
          .single()

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(updatedLesson), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        // Delete lesson
        const { error: deleteError } = await supabaseClient
          .from('lessons')
          .delete()
          .eq('id', lessonId)

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
