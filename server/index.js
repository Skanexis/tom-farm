import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import "dotenv/config";
import express from "express";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dbPath = path.join(dataDir, "db.json");
const seedPath = path.join(dataDir, "initial-products.json");
const contactsSeedPath = path.join(dataDir, "initial-contacts.json");
const uploadsDir = path.join(rootDir, "uploads");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT ?? 3001);
const authSessions = new Map();
const sessionByCode = new Map();
let telegramPollingOffset = 0;
let telegramPollingActive = false;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(distDir));

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    const products = JSON.parse(await fs.readFile(seedPath, "utf8"));
    const contacts = JSON.parse(await fs.readFile(contactsSeedPath, "utf8"));
    await writeDb({ products, contacts, users: [] });
  }
}

async function readDb() {
  await ensureDb();
  const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
  if (!Array.isArray(db.contacts)) {
    db.contacts = JSON.parse(await fs.readFile(contactsSeedPath, "utf8"));
    await writeDb(db);
  }
  return db;
}

async function writeDb(db) {
  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    photoUrl: user.photoUrl,
    isAdmin: user.isAdmin,
  };
}

async function upsertTelegramUser(telegramUser) {
  const db = await readDb();
  const id = String(telegramUser.id);
  const name = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") || telegramUser.username || `User ${id}`;
  const existing = db.users.find((user) => String(user.id) === id);
  const ids = await readAdminIds();
  const user = {
    id,
    name,
    username: telegramUser.username ?? existing?.username ?? "",
    photoUrl: telegramUser.photo_url ?? existing?.photoUrl ?? "",
    isAdmin: ids.includes(id) || existing?.isAdmin || false,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  if (existing) Object.assign(existing, user);
  else db.users.push(user);
  await writeDb(db);
  return user;
}

async function readAdminIds() {
  return (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function isAdminUser(user) {
  const ids = await readAdminIds();
  return Boolean(user?.isAdmin || ids.includes(String(user?.id)));
}

async function requireAdmin(req, res, next) {
  const userId = req.header("x-user-id");
  const db = await readDb();
  const user = db.users.find((item) => String(item.id) === String(userId));
  if (!(await isAdminUser(user))) {
    return res.status(403).json({ error: "Accesso admin richiesto" });
  }
  req.user = user;
  next();
}

function verifyTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (calculated.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash))) return null;

  const userRaw = params.get("user");
  return userRaw ? JSON.parse(userRaw) : null;
}

function verifyTelegramLoginData(loginData, botToken) {
  const { hash, ...data } = loginData ?? {};
  if (!hash) return null;

  const dataCheckString = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const calculated = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (calculated.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash))) return null;

  const authDate = Number(data.auth_date ?? 0);
  const maxAgeSeconds = 24 * 60 * 60;
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  return data;
}

function normalizeProduct(input, existing = {}) {
  const pricingOptions = Array.isArray(input.pricingOptions)
    ? input.pricingOptions.map((option) => ({
        amount: Number(option.amount),
        label: String(option.label ?? ""),
        price: Number(option.price),
      })).filter((option) => option.label && Number.isFinite(option.amount) && Number.isFinite(option.price))
    : existing.pricingOptions ?? [];

  const firstPrice = pricingOptions[0]?.price ?? Number(input.price ?? existing.price ?? 0);

  return {
    ...existing,
    name: String(input.name ?? existing.name ?? "Nuovo prodotto"),
    price: Number.isFinite(firstPrice) ? firstPrice : 0,
    image: String(input.image ?? existing.image ?? ""),
    photoUrl: String(input.photoUrl ?? existing.photoUrl ?? ""),
    videoUrl: String(input.videoUrl ?? existing.videoUrl ?? ""),
    category: String(input.category ?? existing.category ?? "Hash"),
    badge: input.badge ? String(input.badge) : "",
    stock: Number(input.stock ?? existing.stock ?? 0),
    description: String(input.description ?? existing.description ?? ""),
    pricingOptions,
  };
}

function normalizeContact(input, existing = {}) {
  return {
    ...existing,
    title: String(input.title ?? existing.title ?? "Nuovo contatto"),
    label: String(input.label ?? existing.label ?? ""),
    href: String(input.href ?? existing.href ?? ""),
    type: String(input.type ?? existing.type ?? "telegram"),
    accent: String(input.accent ?? existing.accent ?? "#6FD3F7"),
  };
}

function cleanupAuthSessions() {
  const now = Date.now();
  for (const [sessionId, session] of authSessions.entries()) {
    if (session.expiresAt <= now) {
      authSessions.delete(sessionId);
      sessionByCode.delete(session.code);
    }
  }
}

async function telegramApi(method, body = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
}

async function sendTelegramMessage(chatId, text) {
  try {
    await telegramApi("sendMessage", { chat_id: chatId, text });
  } catch (error) {
    console.warn("Telegram sendMessage failed:", error.message);
  }
}

async function handleTelegramStart(from, chatId, payload) {
  if (!from?.id) return;

  if (!payload?.startsWith("login_")) {
    await sendTelegramMessage(chatId, "Откройте вход на сайте Tom Farm и нажмите кнопку Telegram.");
    return;
  }

  cleanupAuthSessions();
  const code = payload.slice("login_".length);
  const sessionId = sessionByCode.get(code);
  const session = sessionId ? authSessions.get(sessionId) : null;
  if (!session) {
    await sendTelegramMessage(chatId, "Ссылка входа устарела. Откройте вход на сайте еще раз.");
    return;
  }

  const user = await upsertTelegramUser(from);
  session.user = publicUser(user);
  authSessions.set(sessionId, session);
  await sendTelegramMessage(chatId, "Готово. Вернитесь на сайт Tom Farm, вход уже подтвержден.");
}

async function processTelegramUpdate(update) {
  const message = update.message;
  const text = message?.text ?? "";
  if (!message?.from || !text.startsWith("/start")) return;

  const [, payload = ""] = text.trim().split(/\s+/, 2);
  await handleTelegramStart(message.from, message.chat.id, payload);
}

async function pollTelegramUpdates() {
  if (telegramPollingActive || !process.env.TELEGRAM_BOT_TOKEN) return;
  telegramPollingActive = true;
  try {
    const updates = await telegramApi("getUpdates", {
      offset: telegramPollingOffset ? telegramPollingOffset + 1 : undefined,
      timeout: 0,
      allowed_updates: ["message"],
    });

    for (const update of updates ?? []) {
      telegramPollingOffset = Math.max(telegramPollingOffset, Number(update.update_id));
      await processTelegramUpdate(update);
    }
  } catch (error) {
    console.warn("Telegram polling failed:", error.message);
  } finally {
    telegramPollingActive = false;
  }
}

async function startTelegramPolling() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await telegramApi("deleteWebhook", { drop_pending_updates: false });
  } catch (error) {
    console.warn("Telegram deleteWebhook failed:", error.message);
  }
  pollTelegramUpdates();
  setInterval(pollTelegramUpdates, 1800);
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Sono permessi solo file immagine e video"));
  },
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/config", (_req, res) => {
  res.json({
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? "",
  });
});

app.post("/api/auth/telegram/start-session", (_req, res) => {
  const botUsername = String(process.env.TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, "");
  if (!process.env.TELEGRAM_BOT_TOKEN || !botUsername) {
    return res.status(503).json({ error: "Telegram bot is not configured" });
  }

  cleanupAuthSessions();
  const sessionId = crypto.randomUUID();
  const code = crypto.randomBytes(8).toString("hex");
  const expiresAt = Date.now() + 5 * 60 * 1000;
  authSessions.set(sessionId, { code, expiresAt, user: null });
  sessionByCode.set(code, sessionId);

  res.json({
    sessionId,
    expiresAt,
    botUsername,
    startUrl: `https://t.me/${botUsername}?start=login_${code}`,
  });
});

app.get("/api/auth/telegram/session/:id", (req, res) => {
  cleanupAuthSessions();
  const session = authSessions.get(req.params.id);
  if (!session) return res.status(404).json({ status: "expired" });
  if (session.user) return res.json({ status: "authorized", user: session.user });
  res.json({ status: "pending", expiresAt: session.expiresAt });
});

app.get("/api/products", async (_req, res) => {
  const db = await readDb();
  res.json(db.products);
});

app.get("/api/contacts", async (_req, res) => {
  const db = await readDb();
  res.json(db.contacts);
});

app.post("/api/contacts", requireAdmin, async (req, res) => {
  const db = await readDb();
  const nextId = db.contacts.reduce((max, contact) => Math.max(max, Number(contact.id)), 0) + 1;
  const contact = { id: nextId, ...normalizeContact(req.body) };
  db.contacts.push(contact);
  await writeDb(db);
  res.status(201).json(contact);
});

app.put("/api/contacts/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  const index = db.contacts.findIndex((contact) => String(contact.id) === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Contatto non trovato" });
  db.contacts[index] = { id: db.contacts[index].id, ...normalizeContact(req.body, db.contacts[index]) };
  await writeDb(db);
  res.json(db.contacts[index]);
});

app.delete("/api/contacts/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  db.contacts = db.contacts.filter((contact) => String(contact.id) !== req.params.id);
  await writeDb(db);
  res.status(204).end();
});

app.post("/api/products", requireAdmin, async (req, res) => {
  const db = await readDb();
  const nextId = db.products.reduce((max, product) => Math.max(max, Number(product.id)), 0) + 1;
  const product = { id: nextId, ...normalizeProduct(req.body) };
  db.products.push(product);
  await writeDb(db);
  res.status(201).json(product);
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  const index = db.products.findIndex((product) => String(product.id) === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Prodotto non trovato" });
  db.products[index] = { id: db.products[index].id, ...normalizeProduct(req.body, db.products[index]) };
  await writeDb(db);
  res.json(db.products[index]);
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  db.products = db.products.filter((product) => String(product.id) !== req.params.id);
  await writeDb(db);
  res.status(204).end();
});

app.post("/api/products/:id/media", requireAdmin, upload.fields([{ name: "photo", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
  const db = await readDb();
  const product = db.products.find((item) => String(item.id) === req.params.id);
  if (!product) return res.status(404).json({ error: "Prodotto non trovato" });

  const photo = req.files?.photo?.[0];
  const video = req.files?.video?.[0];
  if (photo) {
    product.photoUrl = `/uploads/${photo.filename}`;
    product.image = product.photoUrl;
  }
  if (video) product.videoUrl = `/uploads/${video.filename}`;

  await writeDb(db);
  res.json(product);
});

app.post("/api/auth/telegram", async (req, res) => {
  const { initData, loginData, devUser } = req.body ?? {};
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let telegramUser = null;

  if (initData && botToken) telegramUser = verifyTelegramInitData(initData, botToken);
  if (!telegramUser && loginData && botToken) telegramUser = verifyTelegramLoginData(loginData, botToken);
  if (!telegramUser && !botToken && process.env.NODE_ENV !== "production" && devUser) telegramUser = devUser;
  if (!telegramUser) return res.status(401).json({ error: "Autenticazione Telegram non riuscita" });

  const user = await upsertTelegramUser(telegramUser);
  res.json(publicUser(user));
});

app.get("/api/users/:id", async (req, res) => {
  const db = await readDb();
  const user = db.users.find((item) => String(item.id) === req.params.id);
  if (!user) return res.status(404).json({ error: "Utente non trovato" });
  res.json(publicUser(user));
});

app.get(/^(?!\/api(?:\/|$)).*/, async (_req, res, next) => {
  const indexPath = path.join(distDir, "index.html");
  try {
    await fs.access(indexPath);
    res.sendFile(indexPath);
  } catch (error) {
    next(error);
  }
});

await ensureDb();
startTelegramPolling();
app.listen(port, () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
