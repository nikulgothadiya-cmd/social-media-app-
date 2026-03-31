import { Router } from "express";
import {
  deletePostAdmin,
  listPosts,
  listUsers,
  toggleBan,
  toggleVerified
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/users", requireAuth, requireAdmin, listUsers);
router.post("/users/:id/ban", requireAuth, requireAdmin, toggleBan);
router.post("/users/:id/verify", requireAuth, requireAdmin, toggleVerified);
router.get("/posts", requireAuth, requireAdmin, listPosts);
router.delete("/posts/:id", requireAuth, requireAdmin, deletePostAdmin);

export default router;
