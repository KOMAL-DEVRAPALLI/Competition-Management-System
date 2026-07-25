import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

try {
  const result = await cloudinary.uploader.upload(
    "./uploads/logo.png",
    {
      resource_type: "image",
    }
  );

  console.log("SUCCESS");
  console.log(result.secure_url);
} catch (err) {
  console.error(err);
}