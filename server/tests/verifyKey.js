import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import { buildCourse } from "../services/courseService.js";

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const userId = new mongoose.Types.ObjectId().toString();
    const videoId = "testVideo123";
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`Testing with userId: ${userId} and videoId: ${videoId}`);

    // Call buildCourse
    const course = await buildCourse(url, userId);
    console.log("Course created/found:", course._id);
    console.log("Course Key in object:", course.courseKey);

    // Verify in DB
    const dbCourse = await Course.findById(course._id);
    console.log("Course Key in DB:", dbCourse.courseKey);

    if (dbCourse.courseKey === userId + videoId) {
      console.log("✅ Verification Successful: courseKey matches userId + videoId");
    } else {
      console.log("❌ Verification Failed: courseKey does not match");
    }

    // Clean up
    await Course.findByIdAndDelete(course._id);
    console.log("Test course cleaned up");

  } catch (err) {
    console.error("Verification error:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verify();
