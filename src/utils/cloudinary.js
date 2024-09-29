import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = (filePath, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);

        stream.pipe(
            cloudinary.uploader.upload_stream(
                { resource_type: 'image', public_id: fileName },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                }
            )
        );

        stream.on("error", (error) => {
            reject(error);
        });
    });
};

export { uploadOnCloudinary };
