import { Router } from "express";
import {
  addBookmark,
  followUser,
  getFollowers,
  getFollowing,
  getMe,
  getProfile,
  listBookmarks,
  removeBookmark,
  listSuggestedUsers,
  unfollowUser,
  updateMe
} from "../controllers/user.controller.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/:id/follow", requireAuth, followUser);
router.delete("/:id/follow", requireAuth, unfollowUser);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.get("/me/bookmarks", requireAuth, listBookmarks);
router.post("/me/bookmarks", requireAuth, addBookmark);
router.delete("/me/bookmarks/:postId", requireAuth, removeBookmark);
router.get("/suggested", optionalAuth, listSuggestedUsers);
router.get("/:username/followers", optionalAuth, getFollowers);
router.get("/:username/following", optionalAuth, getFollowing);
router.get("/:username", optionalAuth, getProfile);

export default router;
