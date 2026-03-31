import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    text: { type: String, default: "" },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

export const Story = mongoose.model("Story", storySchema);
