import { Router } from "express";
import {
  addComment,
  createPost,
  deletePost,
  listPosts,
  listReels,
  listTrendingTags,
  toggleLike,
  viewPost,
  getPostAnalytics,
  updatePost
} from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.get("/", listPosts);
router.get("/tags/trending", listTrendingTags);
router.get("/reels", listReels);
router.post("/", requireAuth, createPost);
router.post("/:id/like", requireAuth, toggleLike);
router.post("/:id/comments", requireAuth, addComment);
router.post("/:id/view", optionalAuth, viewPost);
router.get("/:id/analytics", requireAuth, getPostAnalytics);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
