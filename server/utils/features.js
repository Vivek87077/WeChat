import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";

/* =======================
   Cookie Options
======================= */
const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  sameSite: "none",  // important for cross-site cookies
  httpOnly: true,    // JS se access nahi hoga
  secure: true,      // only https
};

/* =======================
   MongoDB Connection
======================= */
const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri, {
      dbName: "Chattu",          // custom DB name
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,                 // Atlas requires SSL
      tls: true,                 // enforce TLS
    });
    console.log(`✅ Connected to DB: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

/* =======================
   Send JWT Token in Cookie
======================= */
const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  return res
    .status(code)
    .cookie("chattu-token", token, cookieOptions)
    .json({
      success: true,
      user,
      message,
    });
};

/* =======================
   Emit Event via Socket.io
======================= */
const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

/* =======================
   Upload Files to Cloudinary
======================= */
const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);

    return results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
  } catch (err) {
    console.error("❌ Cloudinary Upload Error:", err.message);
    throw new Error("Error uploading files to cloudinary");
  }
};

/* =======================
   Delete Files from Cloudinary
======================= */
const deleteFilesFromCloudinary = async (public_ids = []) => {
  try {
    const deletePromises = public_ids.map((public_id) =>
      cloudinary.uploader.destroy(public_id)
    );
    await Promise.all(deletePromises);
    console.log("🗑️ Files deleted from Cloudinary:", public_ids);
  } catch (err) {
    console.error("❌ Error deleting files from Cloudinary:", err.message);
    throw new Error("Error deleting files from Cloudinary");
  }
};

export {
  connectDB,
  sendToken,
  cookieOptions,
  emitEvent,
  uploadFilesToCloudinary,
  deleteFilesFromCloudinary,
};
