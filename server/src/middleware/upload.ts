import multer from 'multer';

// Use memory storage to process files before upload (e.g. to Cloudinary)
const storage = multer.memoryStorage();

// Filter to only allow images
const fileFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
});
