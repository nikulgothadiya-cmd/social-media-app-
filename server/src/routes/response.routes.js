import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createResponse,
  listResponses,
  updateResponse
} from "../controllers/response.controller.js";

const router = Router();

router.get("/", requireAuth, listResponses);
router.post("/", requireAuth, createResponse);
router.put("/:id", requireAuth, updateResponse);

export default router;
