import { Router } from "express";
import { listNotifications, markAllRead, markRead } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.post("/read-all", requireAuth, markAllRead);
router.post("/:id/read", requireAuth, markRead);

export default router;
