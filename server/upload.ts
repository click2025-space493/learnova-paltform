import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Extend Express Request type to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = Router();

// Configure multer for file uploads with size limit
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Configure Cloudinary with load balancing
const cloudinaryConfigs = [
  {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_1,
    api_key: process.env.CLOUDINARY_API_KEY_1,
    api_secret: process.env.CLOUDINARY_API_SECRET_1,
  },
  {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_2,
    api_key: process.env.CLOUDINARY_API_KEY_2,
    api_secret: process.env.CLOUDINARY_API_SECRET_2,
  },
  {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_3,
    api_key: process.env.CLOUDINARY_API_KEY_3,
    api_secret: process.env.CLOUDINARY_API_SECRET_3,
  }
];

// Function to get a working Cloudinary config
function getCloudinaryConfig() {
  for (const config of cloudinaryConfigs) {
    if (config.cloud_name && config.api_key && config.api_secret) {
      return config;
    }
  }
  throw new Error('No valid Cloudinary configuration found');
}

// Large video upload endpoint with chunked upload
router.post('/upload-video', upload.single('video'), async (req: MulterRequest, res: Response) => {
  console.log('🎬 Starting large video upload...');
  
  if (!req.file) {
    console.error('❌ No file provided');
    return res.status(400).json({ error: 'No video file provided' });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  
  console.log(`📁 File: ${fileName}`);
  console.log(`📏 Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📂 Temp path: ${filePath}`);

  try {
    // Get Cloudinary configuration
    const config = getCloudinaryConfig();
    console.log(`☁️ Using Cloudinary account: ${config.cloud_name}`);
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    });

    console.log('🚀 Starting chunked upload to Cloudinary...');
    
    // Upload large video using upload_large (chunked upload)
    const uploadResult = await cloudinary.uploader.upload_large(filePath, {
      resource_type: 'video',
      chunk_size: 10 * 1024 * 1024, // 10MB chunks
      folder: 'learnova/videos',
      public_id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      overwrite: true,
      notification_url: undefined, // Can add webhook URL for progress tracking
      eager: [
        { width: 720, height: 480, crop: 'scale', format: 'mp4' },
        { width: 1280, height: 720, crop: 'scale', format: 'mp4' }
      ],
      eager_async: true,
    }) as UploadApiResponse;

    console.log('✅ Upload successful!');
    console.log(`🔗 Secure URL: ${uploadResult.secure_url}`);
    console.log(`🆔 Public ID: ${uploadResult.public_id}`);
    console.log(`⏱️ Duration: ${uploadResult.duration || 'N/A'} seconds`);

    // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temporary file:', cleanupError);
    }

    // Return success response
    res.json({
      success: true,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      duration: uploadResult.duration,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      eager: uploadResult.eager,
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    // Clean up temporary file on error
    try {
      fs.unlinkSync(filePath);
      console.log('🗑️ Temporary file cleaned up after error');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temporary file after error:', cleanupError);
    }

    // Return error response
    const errorMessage = error instanceof Error ? error.message : 'Video upload failed';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
  }
});

// Health check endpoint
router.get('/upload-status', (req, res) => {
  try {
    const config = getCloudinaryConfig();
    res.json({
      status: 'ready',
      cloudinary_account: config.cloud_name,
      max_file_size: '500MB',
      chunk_size: '10MB',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Cloudinary configuration missing',
    });
  }
});

export default router;
