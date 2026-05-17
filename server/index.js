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
let dbWriteQueue = Promise.resolve();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(distDir));

function normalizeUrlList(value, ...fallbacks) {
  const urls = [
    ...(Array.isArray(value) ? value : []),
    ...fallbacks,
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  return [...new Set(urls)];
}

function ensureProductMedia(product) {
  const photos = normalizeUrlList(product.photos, product.photoUrl);
  const videos = normalizeUrlList(product.videos, product.videoUrl);
  const image = photos[0] || String(product.image ?? "");
  return {
    ...product,
    photos,
    videos,
    photoUrl: photos[0] ?? "",
    videoUrl: videos[0] ?? "",
    image,
  };
}

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    const products = JSON.parse(await fs.readFile(seedPath, "utf8"));
    const contacts = JSON.parse(await fs.readFile(contactsSeedPath, "utf8"));
    await writeDb({ products, contacts, users: [], orders: [] });
  }
}

async function readDb() {
  await ensureDb();
  const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
  if (!Array.isArray(db.contacts)) {
    db.contacts = JSON.parse(await fs.readFile(contactsSeedPath, "utf8"));
    await writeDb(db);
  }
  if (!Array.isArray(db.orders)) {
    db.orders = [];
    await writeDb(db);
  }
  if (Array.isArray(db.products)) {
    let changed = false;
    db.products = db.products.map((product) => {
      const nextProduct = ensureProductMedia(product);
      if (!Array.isArray(product.photos) || !Array.isArray(product.videos) || product.photoUrl !== nextProduct.photoUrl || product.videoUrl !== nextProduct.videoUrl) {
        changed = true;
      }
      return nextProduct;
    });
    if (changed) await writeDb(db);
  }
  return db;
}

async function writeDb(db) {
  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`);
}

async function withDbWriteLock(operation) {
  const run = dbWriteQueue.then(operation, operation);
  dbWriteQueue = run.catch(() => {});
  return run;
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
  const photoUrl = telegramUser.photo_url ?? telegramUser.photoUrl ?? existing?.photoUrl ?? "";
  const user = {
    id,
    name,
    username: telegramUser.username ?? existing?.username ?? "",
    photoUrl,
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
  const parseAmountFromLabel = (label) => {
    const normalized = String(label ?? "").trim().toLowerCase().replace(",", ".");
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value)) return 0;
    return normalized.includes("kg") ? value * 1000 : value;
  };
  const pricingOptions = Array.isArray(input.pricingOptions)
    ? input.pricingOptions.map((option) => ({
        amount: Number(option.amount) > 0 ? Number(option.amount) : parseAmountFromLabel(option.label),
        label: String(option.label ?? ""),
        price: Number(option.price),
      })).filter((option) => option.label && Number.isFinite(option.amount) && option.amount > 0 && Number.isFinite(option.price))
    : existing.pricingOptions ?? [];

  const firstPrice = pricingOptions[0]?.price ?? Number(input.price ?? existing.price ?? 0);
  const photos = normalizeUrlList(input.photos, input.photoUrl, existing.photoUrl, ...(Array.isArray(existing.photos) ? existing.photos : []));
  const videos = normalizeUrlList(input.videos, input.videoUrl, existing.videoUrl, ...(Array.isArray(existing.videos) ? existing.videos : []));
  const image = photos[0] || String(input.image ?? existing.image ?? "");

  return {
    ...existing,
    name: String(input.name ?? existing.name ?? "Nuovo prodotto"),
    price: Number.isFinite(firstPrice) ? firstPrice : 0,
    image,
    photos,
    videos,
    photoUrl: photos[0] ?? "",
    videoUrl: videos[0] ?? "",
    category: String(input.category ?? existing.category ?? "Hash"),
    badge: input.badge ? String(input.badge) : "",
    badgeVariant: String(input.badgeVariant ?? existing.badgeVariant ?? ""),
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

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const product = item.product ?? {};
    const grams = Number(item.grams ?? 0);
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    return {
      productId: Number(product.id ?? item.productId ?? 0),
      name: String(product.name ?? item.name ?? ""),
      category: String(product.category ?? item.category ?? ""),
      grams,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  }).filter((item) => item.productId && item.name && item.grams > 0 && item.quantity > 0 && Number.isFinite(item.unitPrice));
}

function publicOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    service: order.service,
    items: order.items,
    createdAt: order.createdAt,
  };
}

function formatItalianDateTime(date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(date);
}

function formatCustomer(user) {
  return user.username ? `@${user.username}` : `${user.name} (ID: ${user.id})`;
}

function formatOrderNotification(order, user) {
  const lines = [
    `Nuovo ordine ${order.id}`,
    `Cliente: ${formatCustomer(user)}`,
    `Servizio: ${order.service}`,
    `Ora: ${formatItalianDateTime(new Date(order.createdAt))}`,
    "",
    "Prodotti:",
    ...order.items.map((item) => `- ${item.name} | ${item.grams}g x ${item.quantity} | ${item.lineTotal.toFixed(2)}€`),
    "",
    `Totale: ${order.total.toFixed(2)}€`,
  ];

  return lines.join("\n");
}

async function notifyAdminsAboutOrder(order, user) {
  const adminIds = await readAdminIds();
  if (!adminIds.length) return;

  const message = formatOrderNotification(order, user);
  await Promise.all(adminIds.map((adminId) => sendTelegramMessage(adminId, message, {
    reply_markup: {
      inline_keyboard: [[
        { text: "Accetta", callback_data: `order:accepted:${order.id}` },
        { text: "Rifiuta", callback_data: `order:rejected:${order.id}` },
      ]],
    },
  })));
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

async function downloadTelegramProfilePhoto(userId) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return "";

  try {
    const photos = await telegramApi("getUserProfilePhotos", { user_id: userId, limit: 1 });
    const photoSizes = photos?.photos?.[0];
    const bestPhoto = photoSizes?.[photoSizes.length - 1];
    if (!bestPhoto?.file_id) return "";

    const file = await telegramApi("getFile", { file_id: bestPhoto.file_id });
    if (!file?.file_path) return "";

    const response = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`);
    if (!response.ok) return "";

    const ext = path.extname(file.file_path) || ".jpg";
    const telegramUploadsDir = path.join(uploadsDir, "telegram");
    await fs.mkdir(telegramUploadsDir, { recursive: true });
    const filename = `${userId}${ext}`;
    const filepath = path.join(telegramUploadsDir, filename);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    return `/uploads/telegram/${filename}`;
  } catch (error) {
    console.warn("Telegram profile photo download failed:", error.message);
    return "";
  }
}

async function sendTelegramMessage(chatId, text, options = {}) {
  try {
    await telegramApi("sendMessage", { chat_id: chatId, text, ...options });
  } catch (error) {
    console.warn("Telegram sendMessage failed:", error.message);
  }
}

async function answerTelegramCallback(callbackQueryId, text) {
  try {
    await telegramApi("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
  } catch (error) {
    console.warn("Telegram answerCallbackQuery failed:", error.message);
  }
}

async function editTelegramMessage(chatId, messageId, text) {
  try {
    await telegramApi("editMessageText", { chat_id: chatId, message_id: messageId, text });
  } catch (error) {
    console.warn("Telegram editMessageText failed:", error.message);
  }
}

async function handleTelegramStart(from, chatId, payload) {
  if (!from?.id) return;

  if (!payload?.startsWith("login_")) {
    await sendTelegramMessage(chatId, "Apri il login sul sito Tom Farm e premi il pulsante Telegram.");
    return;
  }

  cleanupAuthSessions();
  const code = payload.slice("login_".length);
  const sessionId = sessionByCode.get(code);
  const session = sessionId ? authSessions.get(sessionId) : null;
  if (!session) {
    await sendTelegramMessage(chatId, "Il link di accesso e scaduto. Apri di nuovo il login sul sito.");
    return;
  }

  const photoUrl = await downloadTelegramProfilePhoto(from.id);
  const user = await upsertTelegramUser({ ...from, photoUrl });
  session.user = publicUser(user);
  authSessions.set(sessionId, session);
  await sendTelegramMessage(chatId, "Fatto. Torna sul sito Tom Farm, l'accesso e confermato.");
}

async function processTelegramUpdate(update) {
  if (update.callback_query) {
    await handleTelegramCallback(update.callback_query);
    return;
  }

  const message = update.message;
  const text = message?.text ?? "";
  if (!message?.from || !text.startsWith("/start")) return;

  const [, payload = ""] = text.trim().split(/\s+/, 2);
  await handleTelegramStart(message.from, message.chat.id, payload);
}

async function handleTelegramCallback(callbackQuery) {
  const data = callbackQuery.data ?? "";
  const [kind, status, ...orderIdParts] = data.split(":");
  if (kind !== "order" || !["accepted", "rejected"].includes(status)) return;

  const adminIds = await readAdminIds();
  const fromId = String(callbackQuery.from?.id ?? "");
  if (!adminIds.includes(fromId)) {
    await answerTelegramCallback(callbackQuery.id, "Non autorizzato");
    return;
  }

  const orderId = orderIdParts.join(":");
  const db = await readDb();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    await answerTelegramCallback(callbackQuery.id, "Ordine non trovato");
    return;
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  order.reviewedBy = fromId;
  await writeDb(db);

  const statusLabel = status === "accepted" ? "accettato" : "rifiutato";
  await answerTelegramCallback(callbackQuery.id, `Ordine ${statusLabel}`);
  const originalText = callbackQuery.message?.text ?? `Nuovo ordine ${order.id}`;
  await editTelegramMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id, `${originalText}\n\nStato: ${statusLabel.toUpperCase()}`);
}

async function pollTelegramUpdates() {
  if (telegramPollingActive || !process.env.TELEGRAM_BOT_TOKEN) return;
  telegramPollingActive = true;
  try {
    const updates = await telegramApi("getUpdates", {
      offset: telegramPollingOffset ? telegramPollingOffset + 1 : undefined,
      timeout: 0,
      allowed_updates: ["message", "callback_query"],
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

app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  const db = await readDb();
  const ordersByUser = new Map();
  for (const order of db.orders) {
    const stats = ordersByUser.get(order.userId) ?? { orders: 0, approvedTotal: 0 };
    stats.orders += 1;
    if (order.status === "accepted" || order.status === "completed") stats.approvedTotal += Number(order.total ?? 0);
    ordersByUser.set(order.userId, stats);
  }

  res.json(db.users.map((user) => ({
    ...publicUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    orderCount: ordersByUser.get(String(user.id))?.orders ?? 0,
    approvedTotal: ordersByUser.get(String(user.id))?.approvedTotal ?? 0,
  })));
});

app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
  const db = await readDb();
  const usersById = new Map(db.users.map((user) => [String(user.id), publicUser(user)]));
  const orders = db.orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((order) => ({
      ...publicOrder(order),
      user: usersById.get(String(order.userId)) ?? null,
      updatedAt: order.updatedAt,
      reviewedBy: order.reviewedBy,
    }));
  res.json(orders);
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

app.get("/api/orders", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Accesso richiesto" });

  const db = await readDb();
  const user = db.users.find((item) => String(item.id) === String(userId));
  if (!user) return res.status(401).json({ error: "Utente non trovato" });

  const orders = db.orders
    .filter((order) => String(order.userId) === String(userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(publicOrder);
  res.json(orders);
});

app.post("/api/orders", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Accesso richiesto" });

  const db = await readDb();
  const user = db.users.find((item) => String(item.id) === String(userId));
  if (!user) return res.status(401).json({ error: "Utente non trovato" });

  const items = normalizeOrderItems(req.body?.items);
  if (!items.length) return res.status(400).json({ error: "Ordine vuoto" });
  const service = String(req.body?.service ?? "").trim();
  const allowedServices = new Set(["Meet Up", "Delivery", "Ship"]);
  if (!allowedServices.has(service)) return res.status(400).json({ error: "Servizio richiesto" });

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const nextId = db.orders.reduce((max, order) => Math.max(max, Number(order.sequence ?? 0)), 0) + 1;
  const order = {
    sequence: nextId,
    id: `Ordine#${nextId}`,
    userId: String(userId),
    status: "pending",
    service,
    total,
    items,
    createdAt: new Date().toISOString(),
  };

  db.orders.push(order);
  await writeDb(db);
  await notifyAdminsAboutOrder(order, user);
  res.status(201).json(publicOrder(order));
});

function attachProductMedia(product, kind, files = []) {
  const urls = files.map((file) => `/uploads/${file.filename}`);
  if (!urls.length) return;

  if (kind === "photo") {
    product.photos = normalizeUrlList(product.photos, product.photoUrl, ...urls);
    product.photoUrl = product.photos[0] ?? "";
    product.image = product.photoUrl || product.image || "";
  }
  if (kind === "video") {
    product.videos = normalizeUrlList(product.videos, product.videoUrl, ...urls);
    product.videoUrl = product.videos[0] ?? "";
  }
}

app.post("/api/products/:id/media-file", requireAdmin, upload.single("file"), async (req, res) => {
  const kind = req.query.kind === "video" ? "video" : "photo";
  if (!req.file) return res.status(400).json({ error: "File richiesto" });

  try {
    const product = await withDbWriteLock(async () => {
      const db = await readDb();
      const item = db.products.find((entry) => String(entry.id) === req.params.id);
      if (!item) {
        const error = new Error("Prodotto non trovato");
        error.status = 404;
        throw error;
      }

      attachProductMedia(item, kind, [req.file]);
      await writeDb(db);
      return item;
    });
    res.json(product);
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "Upload non riuscito" });
  }
});

app.post("/api/products/:id/media", requireAdmin, upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "photos", maxCount: 50 },
  { name: "videos", maxCount: 3 },
]), async (req, res) => {
  try {
    const product = await withDbWriteLock(async () => {
      const db = await readDb();
      const item = db.products.find((entry) => String(entry.id) === req.params.id);
      if (!item) {
        const error = new Error("Prodotto non trovato");
        error.status = 404;
        throw error;
      }

      attachProductMedia(item, "photo", [...(req.files?.photo ?? []), ...(req.files?.photos ?? [])]);
      attachProductMedia(item, "video", [...(req.files?.video ?? []), ...(req.files?.videos ?? [])]);
      await writeDb(db);
      return item;
    });
    res.json(product);
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "Upload non riuscito" });
  }
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
