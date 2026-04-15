const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary if keys are present
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const storage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'seira_marketplace',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'svg']
  }
}) : null; // Fallback handled in routes

module.exports = { cloudinary, storage, isCloudinaryConfigured };
