import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// ensure env variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'shewear-products',
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) return resolve(result.secure_url);
                return reject(new Error('Cloudinary upload failed'));
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export default cloudinary;
