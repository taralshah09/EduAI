import "dotenv/config";
import mongoose from "mongoose";

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const collection = mongoose.connection.collection("courses");
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    // Check if videoId_1 unique index exists and drop it
    const videoIdIndex = indexes.find(idx => idx.name === "videoId_1");
    if (videoIdIndex) {
      console.log("Dropping unique videoId_1 index...");
      await collection.dropIndex("videoId_1");
      console.log("Successfully dropped videoId_1 index.");
    } else {
      console.log("videoId_1 index not found or not named videoId_1.");
    }

    // Check if courseKey_1 index exists and drop it to recreate as unique
    const courseKeyIndex = indexes.find(idx => idx.name === "courseKey_1");
    if (courseKeyIndex) {
      console.log("Dropping existing courseKey_1 index...");
      await collection.dropIndex("courseKey_1");
    }

    // Ensure courseKey index is created as unique
    console.log("Creating unique courseKey index...");
    await collection.createIndex({ courseKey: 1 }, { unique: true });
    console.log("Successfully created unique courseKey index.");

  } catch (err) {
    console.error("Error fixing index:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixIndex();
