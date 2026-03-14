import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", ChatSchema);
