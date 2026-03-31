import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
    images: [{ type: String }],
    videoUrl: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    tags: [{ type: String, index: true }],
    edits: [
      {
        content: { type: String, default: "" },
        imageUrl: { type: String, default: "" },
        images: [{ type: String }],
        editedAt: { type: Date, default: Date.now }
      }
    ],
    editedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
    isReel: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
