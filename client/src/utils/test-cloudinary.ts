// Test Cloudinary upload configuration
export const testCloudinaryUpload = async () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_1;
  
  console.log('🔍 Testing Cloudinary with cloud name:', cloudName);
  
  if (!cloudName || cloudName === 'your_cloud_name_1') {
    console.error('❌ Cloudinary cloud name not configured properly');
    return false;
  }

  // Test with a simple video file upload to check if preset exists
  const formData = new FormData();
  const testBlob = new Blob(['test video content'], { type: 'video/mp4' });
  formData.append('file', testBlob, 'test.mp4');
  formData.append('upload_preset', 'learnova_videos');
  formData.append('resource_type', 'video');
  
  console.log('📤 Attempting upload to:', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cloudinary upload preset is working!', result);
      return true;
    } else {
      console.error('❌ Cloudinary upload failed:', result);
      
      if (result.error?.message?.includes('Invalid upload preset')) {
        console.error('🔧 Upload preset "learnova_videos" does not exist. Please create it in your Cloudinary dashboard.');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Network error testing Cloudinary:', error);
    return false;
  }
};

// Alternative: Create a signed upload (doesn't require preset)
export const createSignedUpload = async (file: File) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_1;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY_1;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET_1;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  // Generate timestamp and signature
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'learnova/videos';
  
  // Create signature string (simplified - in production, do this server-side)
  const paramsToSign = `folder=${folder}&resource_type=video&timestamp=${timestamp}`;
  
  // For now, let's try without signature (basic upload)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', folder);
  formData.append('resource_type', 'video');
  
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Signed upload failed: ${error.error?.message || response.statusText}`);
  }

  return response.json();
};
