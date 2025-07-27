import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // for the read write remove open change and all those things to use 

cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath, publicId, folder) => {

    try {
        if(!localFilePath) return null
            //console.error("❌ No local file path provided to Cloudinary upload.");
            
        
        //upload the file on cloudinary
      const response =  await cloudinary.uploader.upload(localFilePath,{
            resource_type:"image",
            public_id: publicId,
            folder
        });
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
         console.error("❌ Cloudinary upload failed:", error?.message || error);
        fs.unlinkSync(localFilePath) // romove the localy saved temporary file as the upload operation got the failed
        return null
    }
}





export {uploadOnCloudinary}