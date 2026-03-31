import { Router } from "express";
import { listMessages, listUsers } from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/users", requireAuth, listUsers);
router.get("/messages", requireAuth, listMessages);

export default router;
