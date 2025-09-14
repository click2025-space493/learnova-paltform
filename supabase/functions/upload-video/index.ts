import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CLOUDINARY_CONFIGS = [
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_1'),
    api_key: Deno.env.get('CLOUDINARY_API_KEY_1'),
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_1'),
  },
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_2'),
    api_key: Deno.env.get('CLOUDINARY_API_KEY_2'),
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_2'),
  },
  {
    cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME_3'),
    api_key: Deno.env.get('CLOUDINARY_API_KEY_3'),
    api_secret: Deno.env.get('CLOUDINARY_API_SECRET_3'),
  }
];

function getCloudinaryConfig() {
  for (const config of CLOUDINARY_CONFIGS) {
    if (config.cloud_name && config.api_key && config.api_secret) {
      return config;
    }
  }
  throw new Error('No valid Cloudinary configuration found');
}

async function generateSignature(params: Record<string, any>, apiSecret: string): Promise<string> {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + apiSecret;
  
  // Create SHA1 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

async function uploadToCloudinary(file: File, config: any): Promise<any> {
  console.log(`🚀 Starting chunked upload to account: ${config.cloud_name}`);
  
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `video_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Parameters for signature generation
  const params = {
    timestamp: timestamp,
    public_id: publicId,
    folder: 'learnova/videos',
    resource_type: 'video',
    chunk_size: 10485760, // 10MB chunks
    eager: 'w_720,h_480,c_scale,f_mp4|w_1280,h_720,c_scale,f_mp4',
    eager_async: true,
  };
  
  // Generate signature
  const signature = await generateSignature(params, config.api_secret);
  
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', config.api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('public_id', publicId);
  formData.append('folder', 'learnova/videos');
  formData.append('resource_type', 'video');
  formData.append('chunk_size', '10485760');
  formData.append('eager', 'w_720,h_480,c_scale,f_mp4|w_1280,h_720,c_scale,f_mp4');
  formData.append('eager_async', 'true');
  
  console.log(`📁 File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Upload to Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloud_name}/video/upload`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
    console.error(`Error details: ${errorText}`);
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log(`✅ Upload successful! URL: ${result.secure_url}`);
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      // Health check endpoint
      try {
        const config = getCloudinaryConfig();
        return new Response(
          JSON.stringify({
            status: 'ready',
            cloudinary_account: config.cloud_name,
            max_file_size: '500MB',
            chunk_size: '10MB',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'Cloudinary configuration missing',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    console.log('🎬 Starting large video upload...');

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('video') as File;

    if (!file) {
      console.error('❌ No file provided');
      return new Response(
        JSON.stringify({ error: 'No video file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      console.error('❌ Invalid file type:', file.type);
      return new Response(
        JSON.stringify({ error: 'Only video files are allowed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      console.error(`❌ File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Cloudinary configuration
    const config = getCloudinaryConfig();
    console.log(`☁️ Using Cloudinary account: ${config.cloud_name}`);

    // Upload to Cloudinary with chunked upload
    const uploadResult = await uploadToCloudinary(file, config);

    console.log('✅ Upload completed successfully!');
    console.log(`🔗 Secure URL: ${uploadResult.secure_url}`);
    console.log(`🆔 Public ID: ${uploadResult.public_id}`);
    console.log(`⏱️ Duration: ${uploadResult.duration || 'N/A'} seconds`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        duration: uploadResult.duration,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        eager: uploadResult.eager,
        created_at: uploadResult.created_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Video upload failed';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: Deno.env.get('DENO_ENV') === 'development' ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
