import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    body: { type: String, trim: true, maxlength: 1000, default: "" },
    tone: {
      type: String,
      enum: ["supportive", "professional", "playful"],
      default: "supportive"
    },
    audience: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public"
    },
    status: { type: String, enum: ["draft", "sent"], default: "sent" },
    context: { type: String, trim: true, maxlength: 300, default: "" }
  },
  { timestamps: true }
);

export const Response = mongoose.model("Response", responseSchema);
