import mongoose from "mongoose";

const likeEventSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const LikeEvent = mongoose.model("LikeEvent", likeEventSchema);
