import { Response } from "../models/Response.js";

function normalizeTone(tone) {
  if (tone === "professional" || tone === "playful") return tone;
  return "supportive";
}

function normalizeAudience(audience) {
  if (audience === "followers" || audience === "private") return audience;
  return "public";
}

function normalizeStatus(status) {
  return status === "draft" ? "draft" : "sent";
}

export async function listResponses(req, res) {
  const { status, limit } = req.query;
  const limitNum = Math.min(parseInt(limit || "10", 10), 50);
  const filter = { author: req.user.id };
  if (status === "draft" || status === "sent") {
    filter.status = status;
  }
  const responses = await Response.find(filter).sort({ createdAt: -1 }).limit(limitNum);
  res.json({ responses });
}

export async function createResponse(req, res) {
  const { title, body, tone, audience, status, context } = req.body || {};
  const normalizedTitle = (title || "").trim();
  const normalizedBody = (body || "").trim();
  const normalizedContext = (context || "").trim();
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "sent" && !normalizedBody) {
    return res.status(400).json({ message: "body is required" });
  }

  if (normalizedStatus === "draft" && !normalizedTitle && !normalizedBody) {
    return res.status(400).json({ message: "title or body is required" });
  }

  const response = await Response.create({
    author: req.user.id,
    title: normalizedTitle,
    body: normalizedBody,
    tone: normalizeTone(tone),
    audience: normalizeAudience(audience),
    status: normalizedStatus,
    context: normalizedContext
  });

  res.status(201).json({ response });
}

export async function updateResponse(req, res) {
  const { id } = req.params;
  const { title, body, tone, audience, status, context } = req.body || {};
  const response = await Response.findById(id);
  if (!response) {
    return res.status(404).json({ message: "Response not found" });
  }
  if (response.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (typeof title === "string") response.title = title.trim();
  if (typeof body === "string") response.body = body.trim();
  if (typeof tone === "string") response.tone = normalizeTone(tone);
  if (typeof audience === "string") response.audience = normalizeAudience(audience);
  if (typeof status === "string") response.status = normalizeStatus(status);
  if (typeof context === "string") response.context = context.trim();

  if (response.status === "sent" && !response.body) {
    return res.status(400).json({ message: "body is required to send" });
  }
  if (response.status === "draft" && !response.title && !response.body) {
    return res.status(400).json({ message: "title or body is required" });
  }

  await response.save();
  res.json({ response });
}
