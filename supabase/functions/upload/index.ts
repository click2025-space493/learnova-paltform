import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cloudinary configuration - 5 accounts for load balancing
const CLOUDINARY_ACCOUNTS = [
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_1') ?? '',
    api_key: Deno.env.get('CLOUDINARY_API_KEY_1') ?? '',
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_1') ?? '',
  },
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_2') ?? '',
    api_key: Deno.env.get('CLOUDINARY_API_KEY_2') ?? '',
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_2') ?? '',
  },
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_3') ?? '',
    api_key: Deno.env.get('CLOUDINARY_API_KEY_3') ?? '',
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_3') ?? '',
  },
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_4') ?? '',
    api_key: Deno.env.get('CLOUDINARY_API_KEY_4') ?? '',
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_4') ?? '',
  },
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_5') ?? '',
    api_key: Deno.env.get('CLOUDINARY_API_KEY_5') ?? '',
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_5') ?? '',
  }
]

// Generate Cloudinary signature
function generateSignature(params: Record<string, any>, apiSecret: string): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return crypto.subtle.digest('SHA-1', new TextEncoder().encode(sortedParams + apiSecret))
    .then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    })
}

// Select Cloudinary account based on load balancing
function selectCloudinaryAccount(userId: string): typeof CLOUDINARY_ACCOUNTS[0] {
  // Simple hash-based load balancing
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const index = Math.abs(hash) % CLOUDINARY_ACCOUNTS.length
  return CLOUDINARY_ACCOUNTS[index]
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
      case 'POST':
        if (url.pathname.includes('/signature')) {
          // Generate upload signature for Cloudinary
          const { timestamp, folder, resource_type } = await req.json()
          
          // Select Cloudinary account for this user
          const account = selectCloudinaryAccount(user.id)
          
          const params = {
            timestamp,
            folder: folder || 'learnova',
            resource_type: resource_type || 'video'
          }
          
          const signature = await generateSignature(params, account.api_secret)
          
          return new Response(JSON.stringify({
            signature,
            timestamp,
            cloud_name: account.cloud_name,
            api_key: account.api_key,
            folder: params.folder
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        if (url.pathname.includes('/complete')) {
          // Handle upload completion - save file info to database
          const { public_id, secure_url, resource_type, format, bytes, duration } = await req.json()
          
          // You can save upload info to a uploads table if needed
          return new Response(JSON.stringify({
            success: true,
            url: secure_url,
            public_id,
            resource_type,
            format,
            bytes,
            duration
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        break

      case 'DELETE':
        // Delete file from Cloudinary
        const { public_id } = await req.json()
        
        // Select the same account that was used for upload
        const account = selectCloudinaryAccount(user.id)
        
        const deleteParams = {
          public_id,
          timestamp: Math.round(Date.now() / 1000),
          api_key: account.api_key
        }
        
        const deleteSignature = await generateSignature(deleteParams, account.api_secret)
        
        // Make delete request to Cloudinary
        const deleteResponse = await fetch(`https://api.cloudinary.com/v1_1/${account.cloud_name}/image/destroy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            public_id: deleteParams.public_id,
            timestamp: deleteParams.timestamp.toString(),
            api_key: deleteParams.api_key,
            signature: deleteSignature
          })
        })
        
        const deleteResult = await deleteResponse.json()
        
        return new Response(JSON.stringify(deleteResult), {
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
