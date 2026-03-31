import { Router } from "express";
import { createStory, listStories } from "../controllers/story.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", listStories);
router.post("/", requireAuth, createStory);

export default router;
