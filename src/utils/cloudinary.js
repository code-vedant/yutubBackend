import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = (filePath, fileName) => {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);

        cloudinary.uploader.upload_stream(
            { resource_type: 'auto', public_id: fileName },
            async (error, result) => {
                if (error) {
                    return reject(error);
                }

                try {
                    await fs.unlink(filePath);
                    console.log(`${filePath} deleted successfully.`);
                } catch (unlinkError) {
                    console.error(`Error deleting file at ${filePath}:`, unlinkError);
                }

                resolve(result);
            }
        ).end(fileStream);
    });
};

export { uploadOnCloudinary };
