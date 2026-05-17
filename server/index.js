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
  if (!crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash))) return null;

  const userRaw = params.get("user");
  return userRaw ? JSON.parse(userRaw) : null;
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
  const { initData, devUser } = req.body ?? {};
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let telegramUser = null;

  if (initData && botToken) telegramUser = verifyTelegramInitData(initData, botToken);
  if (!telegramUser && !botToken && devUser) telegramUser = devUser;
  if (!telegramUser) return res.status(401).json({ error: "Autenticazione Telegram non riuscita" });

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
app.listen(port, () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
