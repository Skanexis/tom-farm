import { CheckCircle, Image, PackageCheck, Plus, ReceiptText, Save, Search, Trash2, Upload, Users, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AppUser, ContactItem } from "../App";
import { badgeVariantClasses } from "./ProductCard";
import type { Product, ProductPricingOption } from "./ProductCard";

interface AdminPageProps {
  user: AppUser | null;
  products: Product[];
  contacts: ContactItem[];
  onLoginClick: () => void;
  onProductsChange: () => Promise<void>;
  onContactsChange: () => Promise<void>;
}

interface AdminUser extends AppUser {
  createdAt?: string;
  updatedAt?: string;
  orderCount: number;
  approvedTotal: number;
}

interface AdminOrder {
  id: string;
  userId: string;
  status: string;
  service?: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; grams: number; quantity: number; lineTotal: number }>;
  user: AppUser | null;
}

const emptyProduct: Product = {
  id: 0,
  name: "Nuovo prodotto",
  price: 0,
  image: "",
  photoUrl: "",
  videoUrl: "",
  category: "Hash",
  badge: undefined,
  stock: 0,
  description: "",
  pricingOptions: [{ amount: 25, label: "25g", price: 0 }],
};

const inputClass = "w-full rounded-xl border border-white/10 bg-white/7 px-3 py-2 text-xs font-bold text-[#F5F7EE] outline-none transition focus:border-[#6FD3F7]/60";
const labelClass = "mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#8EA9AF]";
const badgePresets = [
  { value: "top", label: "Top", sample: "TOP" },
  { value: "new", label: "Nuovo", sample: "NUOVO" },
  { value: "sale", label: "Offerta", sample: "OFFERTA" },
  { value: "premium", label: "Premium", sample: "PREMIUM" },
  { value: "limited", label: "Limitato", sample: "LIMITATO" },
  { value: "dark", label: "Dark", sample: "CUSTOM" },
];
const emptyContact: ContactItem = {
  id: 0,
  title: "Nuovo contatto",
  label: "",
  href: "",
  type: "telegram",
  accent: "#6FD3F7",
};

function parseAmountFromLabel(label: string): number {
  const normalized = label.trim().toLowerCase().replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return 0;
  return normalized.includes("kg") ? value * 1000 : value;
}

export function AdminPage({ user, products, contacts, onLoginClick, onProductsChange, onContactsChange }: AdminPageProps) {
  const [selectedId, setSelectedId] = useState<number>(products[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<"products" | "contacts" | "users" | "orders">("products");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const selected = useMemo(() => products.find((product) => product.id === selectedId) ?? products[0], [products, selectedId]);
  const [draft, setDraft] = useState<Product>(selected ?? emptyProduct);
  const [contactDraft, setContactDraft] = useState<ContactItem>(contacts[0] ?? emptyContact);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q));
  }, [products, query]);

  useEffect(() => {
    setDraft(selected ?? emptyProduct);
  }, [selected]);

  useEffect(() => {
    if (!contactDraft.id && contacts[0]) setContactDraft(contacts[0]);
  }, [contacts, contactDraft.id]);

  useEffect(() => {
    if (!user?.isAdmin || (section !== "users" && section !== "orders")) return;

    const endpoint = section === "users" ? "/api/admin/users" : "/api/admin/orders";
    fetch(endpoint, { headers: { "x-user-id": user.id } })
      .then((response) => {
        if (!response.ok) throw new Error("Admin request failed");
        return response.json();
      })
      .then((data) => {
        if (section === "users") setAdminUsers(data);
        else setAdminOrders(data);
      })
      .catch(() => {
        if (section === "users") setAdminUsers([]);
        else setAdminOrders([]);
      });
  }, [section, user?.id, user?.isAdmin]);

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 pb-8 pt-24 text-center">
        <div className="rounded-3xl border border-[#2B5360]/55 bg-[#0B0F12]/90 p-8">
          <h1 className="text-2xl font-black text-[#F5F7EE]">Accesso admin</h1>
          <p className="mt-2 text-sm text-[#A8B4B7]">Accedi con Telegram per gestire prodotti, foto e video.</p>
          <button onClick={onLoginClick} className="mt-5 rounded-full bg-[#6FD3F7] px-5 py-3 text-sm font-black text-[#071114]">
            Accedi con Telegram
          </button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 pb-8 pt-24 text-center">
        <div className="rounded-3xl border border-[#2B5360]/55 bg-[#0B0F12]/90 p-8">
          <h1 className="text-2xl font-black text-[#F5F7EE]">Accesso negato</h1>
          <p className="mt-2 text-sm text-[#A8B4B7]">Il tuo Telegram ID non e nella lista admin.</p>
          <p className="mt-3 rounded-xl bg-white/7 px-3 py-2 text-xs font-black text-[#9DEBFF]">ID: {user.id}</p>
        </div>
      </div>
    );
  }

  const updateDraft = (patch: Partial<Product>) => setDraft((current) => ({ ...current, ...patch }));
  const updateOption = (index: number, patch: Partial<ProductPricingOption>) => {
    const pricingOptions = [...(draft.pricingOptions ?? [])];
    pricingOptions[index] = { ...pricingOptions[index], ...patch };
    updateDraft({ pricingOptions });
  };
  const updateOptionLabel = (index: number, label: string) => {
    updateOption(index, { label, amount: parseAmountFromLabel(label) });
  };

  const saveProduct = async () => {
    setSaving(true);
    const isNew = !draft.id;
    const response = await fetch(isNew ? "/api/products" : `/api/products/${draft.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": user.id },
      body: JSON.stringify(draft),
    });
    const saved = await response.json();
    setSaving(false);
    if (response.ok) {
      setStatus("Prodotto salvato");
      setSelectedId(saved.id);
      await onProductsChange();
      setTimeout(() => setStatus(""), 1800);
    }
  };

  const deleteProduct = async () => {
    if (!draft.id) return;
    await fetch(`/api/products/${draft.id}`, { method: "DELETE", headers: { "x-user-id": user.id } });
    setStatus("Prodotto eliminato");
    setSelectedId(0);
    await onProductsChange();
    setTimeout(() => setStatus(""), 1800);
  };

  const uploadMedia = async (kind: "photo" | "video", file: File | null) => {
    if (!file || !draft.id) return;
    const form = new FormData();
    form.append(kind, file);
    const response = await fetch(`/api/products/${draft.id}/media`, {
      method: "POST",
      headers: { "x-user-id": user.id },
      body: form,
    });
    const updated = await response.json();
    if (response.ok) {
      setStatus(kind === "photo" ? "Foto caricata" : "Video caricato");
      setDraft(updated);
      await onProductsChange();
      setTimeout(() => setStatus(""), 1800);
    }
  };

  const saveContact = async () => {
    setSaving(true);
    const isNew = !contactDraft.id;
    const response = await fetch(isNew ? "/api/contacts" : `/api/contacts/${contactDraft.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": user.id },
      body: JSON.stringify(contactDraft),
    });
    const saved = await response.json();
    setSaving(false);
    if (response.ok) {
      setContactDraft(saved);
      setStatus("Contatto salvato");
      await onContactsChange();
      setTimeout(() => setStatus(""), 1800);
    }
  };

  const deleteContact = async () => {
    if (!contactDraft.id) return;
    await fetch(`/api/contacts/${contactDraft.id}`, { method: "DELETE", headers: { "x-user-id": user.id } });
    setContactDraft(emptyContact);
    setStatus("Contatto eliminato");
    await onContactsChange();
    setTimeout(() => setStatus(""), 1800);
  };

  return (
    <div className="min-h-full overflow-x-hidden px-3 pb-6 pt-18 text-[#F5F7EE] sm:px-4 sm:pb-8 sm:pt-24">
      <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-3 lg:grid-cols-[240px_1fr] lg:gap-4">
        <aside className="min-w-0 rounded-[18px] border border-[#2B5360]/55 bg-[#0B0F12]/90 p-3 lg:rounded-[22px]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8EA9AF]">Admin</p>
              <h1 className="text-lg font-black">Prodotti</h1>
            </div>
            <button onClick={() => { setSelectedId(0); setDraft(emptyProduct); }} className="grid h-8 w-8 place-items-center rounded-full bg-[#6FD3F7] text-[#071114]">
              <Plus size={15} />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-4 gap-1.5 lg:grid-cols-2 lg:gap-2">
            {[
              { key: "products", label: "Prodotti" },
              { key: "contacts", label: "Contatti" },
              { key: "users", label: "Utenti" },
              { key: "orders", label: "Ordini" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key as typeof section)}
                className={`rounded-xl px-2 py-2 text-[10px] font-black lg:px-3 lg:text-xs ${section === item.key ? "bg-[#D8FF7A] text-[#071114]" : "bg-white/7 text-[#A8B4B7]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {section === "products" ? (
            <>
          <div className="relative mb-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8EA9AF]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca prodotto"
              className="w-full rounded-xl border border-white/10 bg-white/7 py-2 pl-8 pr-3 text-xs font-bold text-[#F5F7EE] outline-none focus:border-[#6FD3F7]/60"
            />
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/7 p-2">
              <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Totale</p>
              <p className="text-lg font-black text-[#D8FF7A]">{products.length}</p>
            </div>
            <div className="rounded-xl bg-white/7 p-2">
              <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Media</p>
              <p className="text-lg font-black text-[#6FD3F7]">{products.filter((product) => product.photoUrl || product.videoUrl).length}</p>
            </div>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto lg:max-h-none">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedId(product.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs font-black transition ${draft.id === product.id ? "bg-[#D8FF7A] text-[#071114]" : "bg-white/7 text-[#A8B4B7] hover:text-[#F5F7EE]"}`}
              >
                <span className="line-clamp-1">{product.name}</span>
                <span className="mt-0.5 block text-[9px] opacity-70">{product.category}</span>
              </button>
            ))}
          </div>
            </>
          ) : section === "contacts" ? (
            <div className="max-h-56 space-y-2 overflow-y-auto lg:max-h-none">
              <button
                onClick={() => setContactDraft(emptyContact)}
                className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6FD3F7] px-3 py-2 text-xs font-black text-[#071114]"
              >
                <Plus size={13} />
                Nuovo contatto
              </button>
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setContactDraft(contact)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-xs font-black transition ${contactDraft.id === contact.id ? "bg-[#D8FF7A] text-[#071114]" : "bg-white/7 text-[#A8B4B7] hover:text-[#F5F7EE]"}`}
                >
                  <span className="line-clamp-1">{contact.title}</span>
                  <span className="mt-0.5 block text-[9px] opacity-70">{contact.label}</span>
                </button>
              ))}
            </div>
          ) : section === "users" ? (
            <div className="max-h-56 space-y-2 overflow-y-auto lg:max-h-none">
              <div className="rounded-xl bg-white/7 p-2">
                <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Utenti</p>
                <p className="text-lg font-black text-[#6FD3F7]">{adminUsers.length}</p>
              </div>
              {adminUsers.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl bg-white/7 px-3 py-2 text-xs">
                  <p className="font-black text-[#F5F7EE]">{item.username ? `@${item.username}` : item.name}</p>
                  <p className="mt-0.5 text-[9px] text-[#8EA9AF]">ID: {item.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto lg:max-h-none">
              <div className="rounded-xl bg-white/7 p-2">
                <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Ordini</p>
                <p className="text-lg font-black text-[#D8FF7A]">{adminOrders.length}</p>
              </div>
              {adminOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="rounded-xl bg-white/7 px-3 py-2 text-xs">
                  <p className="font-black text-[#F5F7EE]">{order.id}</p>
                  <p className="mt-0.5 text-[9px] text-[#8EA9AF]">{order.status} · {order.total.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="min-w-0 rounded-[18px] border border-[#2B5360]/55 bg-[#0B0F12]/90 p-3 lg:rounded-[22px] lg:p-4">
          {section === "users" ? (
            <>
              <div className="mb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8EA9AF]">Database</p>
                <h2 className="flex items-center gap-2 text-xl font-black"><Users size={18} /> Utenti</h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-2xl bg-white/7 p-3">
                  <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Totale utenti</p>
                  <p className="text-2xl font-black text-[#6FD3F7]">{adminUsers.length}</p>
                </div>
                <div className="rounded-2xl bg-white/7 p-3">
                  <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Admin</p>
                  <p className="text-2xl font-black text-[#D8FF7A]">{adminUsers.filter((item) => item.isAdmin).length}</p>
                </div>
                <div className="rounded-2xl bg-white/7 p-3">
                  <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Speso approvato</p>
                  <p className="text-2xl font-black text-[#48C78E]">{adminUsers.reduce((sum, item) => sum + item.approvedTotal, 0).toFixed(0)}€</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {adminUsers.map((item) => (
                  <div key={item.id} className="grid grid-cols-[44px_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[44px_1fr_90px_90px]">
                    <div className="h-11 w-11 overflow-hidden rounded-xl bg-[#6FD3F7]/15">
                      {item.photoUrl ? <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-black text-[#6FD3F7]">{item.name[0]}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#F5F7EE]">{item.username ? `@${item.username}` : item.name}</p>
                      <p className="mt-0.5 truncate text-[10px] font-bold text-[#8EA9AF]">ID: {item.id}</p>
                    </div>
                    <div className="col-start-1 text-left sm:col-start-auto sm:text-right">
                      <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Ordini</p>
                      <p className="font-black">{item.orderCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-[#8EA9AF]">Speso</p>
                      <p className="font-black text-[#D8FF7A]">{item.approvedTotal.toFixed(0)}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : section === "orders" ? (
            <>
              <div className="mb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8EA9AF]">Database</p>
                <h2 className="flex items-center gap-2 text-xl font-black"><ReceiptText size={18} /> Ordini</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[
                  { label: "Totale", value: adminOrders.length, color: "text-[#6FD3F7]" },
                  { label: "In attesa", value: adminOrders.filter((order) => order.status === "pending").length, color: "text-[#F4C95D]" },
                  { label: "Accettati", value: adminOrders.filter((order) => order.status === "accepted" || order.status === "completed").length, color: "text-[#48C78E]" },
                  { label: "Rifiutati", value: adminOrders.filter((order) => order.status === "rejected").length, color: "text-[#FF6B6B]" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/7 p-3">
                    <p className="text-[9px] font-black uppercase text-[#8EA9AF]">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {adminOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#F5F7EE]">{order.id}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-[#8EA9AF]">
                          {order.user?.username ? `@${order.user.username}` : order.user?.name ?? order.userId} · {order.service ?? "Servizio n/d"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#D8FF7A]">{order.total.toFixed(2)}€</p>
                        <p className="mt-0.5 text-[10px] font-black uppercase text-[#8EA9AF]">{order.status}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {order.items.map((item, index) => (
                        <span key={`${order.id}-${index}`} className="rounded-full bg-[#071114] px-2 py-1 text-[10px] font-bold text-[#A8B4B7]">
                          {item.name} · {item.grams}g x {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : section === "contacts" ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8EA9AF]">Editor contatto</p>
                  <h2 className="text-xl font-black">{contactDraft.id ? contactDraft.title : "Nuovo contatto"}</h2>
                  {status && (
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-[#D8FF7A]">
                      <CheckCircle size={11} />
                      {status}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={deleteContact} disabled={!contactDraft.id} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#A8B4B7] hover:text-[#F5F7EE] disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={saveContact} disabled={saving} className="flex h-9 items-center gap-2 rounded-full bg-[#6FD3F7] px-4 text-xs font-black text-[#071114] disabled:opacity-60">
                    <Save size={14} />
                    {saving ? "Salvataggio" : "Salva"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>Titolo</span>
                  <input className={inputClass} value={contactDraft.title} onChange={(event) => setContactDraft({ ...contactDraft, title: event.target.value })} />
                </label>
                <label>
                  <span className={labelClass}>Etichetta</span>
                  <input className={inputClass} value={contactDraft.label} onChange={(event) => setContactDraft({ ...contactDraft, label: event.target.value })} />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass}>Link</span>
                  <input className={inputClass} value={contactDraft.href} onChange={(event) => setContactDraft({ ...contactDraft, href: event.target.value })} />
                </label>
                <label>
                  <span className={labelClass}>Tipo</span>
                  <select className={inputClass} value={contactDraft.type} onChange={(event) => setContactDraft({ ...contactDraft, type: event.target.value })}>
                    <option value="telegram">Telegram</option>
                    <option value="group">Gruppo</option>
                    <option value="viber">Viber</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Colore</span>
                  <input className={inputClass} value={contactDraft.accent} onChange={(event) => setContactDraft({ ...contactDraft, accent: event.target.value })} />
                </label>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-black text-[#F5F7EE]">Anteprima</p>
                <a href={contactDraft.href || "#"} target="_blank" rel="noreferrer" className="block rounded-xl border border-[#2B5360]/55 bg-[#071114]/72 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8EA9AF]">{contactDraft.title}</p>
                  <p className="mt-1 text-sm font-black text-[#F5F7EE]">{contactDraft.label || "Etichetta"}</p>
                  <p className="mt-1 truncate text-[10px] font-bold" style={{ color: contactDraft.accent }}>{contactDraft.href || "https://..."}</p>
                </a>
              </div>
            </>
          ) : (
            <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8EA9AF]">Editor prodotto</p>
              <h2 className="text-xl font-black">{draft.id ? draft.name : "Nuovo prodotto"}</h2>
              {status && (
                <p className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-[#D8FF7A]">
                  <CheckCircle size={11} />
                  {status}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={deleteProduct} disabled={!draft.id} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#A8B4B7] hover:text-[#F5F7EE] disabled:opacity-30">
                <Trash2 size={15} />
              </button>
              <button onClick={saveProduct} disabled={saving} className="flex h-9 items-center gap-2 rounded-full bg-[#6FD3F7] px-4 text-xs font-black text-[#071114] disabled:opacity-60">
                <Save size={14} />
                {saving ? "Salvataggio" : "Salva"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Nome</span>
              <input className={inputClass} value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Categoria</span>
              <select className={inputClass} value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })}>
                {["Hash", "Frozen", "Premium", "Vape"].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Testo etichetta</span>
              <input
                className={inputClass}
                value={draft.badge ?? ""}
                onChange={(event) => updateDraft({ badge: event.target.value })}
                placeholder="TOP, NUOVO, 120U..."
              />
            </label>
            <div className="flex flex-wrap gap-1.5 sm:col-span-2">
              {badgePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => updateDraft({ badgeVariant: preset.value as Product["badgeVariant"] })}
                  className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] backdrop-blur-md transition ${
                    badgeVariantClasses[preset.value]
                  } ${draft.badgeVariant === preset.value ? "ring-2 ring-[#D8FF7A]/45" : "opacity-70 hover:opacity-100"}`}
                  title={preset.label}
                >
                  {draft.badge || preset.sample}
                </button>
              ))}
            </div>
            <label>
              <span className={labelClass}>Disponibilita</span>
              <input className={inputClass} type="number" value={draft.stock} onChange={(event) => updateDraft({ stock: Number(event.target.value) })} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Descrizione</span>
              <textarea className={`${inputClass} min-h-20 resize-none`} value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">Formati e prezzi</h3>
              <button
                onClick={() => updateDraft({ pricingOptions: [...(draft.pricingOptions ?? []), { amount: 0, label: "", price: 0 }] })}
                className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-[#D8FF7A]"
              >
                Aggiungi formato
              </button>
            </div>
            <div className="space-y-2">
              {(draft.pricingOptions ?? []).map((option, index) => (
                <div key={`${option.label}-${index}`} className="grid grid-cols-[1fr_1fr_32px] gap-1.5 sm:gap-2">
                  <input className={inputClass} value={option.label} onChange={(event) => updateOptionLabel(index, event.target.value)} placeholder="50g o 1kg" />
                  <input className={inputClass} type="number" value={option.price} onChange={(event) => updateOption(index, { price: Number(event.target.value) })} placeholder="Prezzo" />
                  <button
                    onClick={() => updateDraft({ pricingOptions: (draft.pricingOptions ?? []).filter((_, i) => i !== index) })}
                    className="grid place-items-center rounded-xl bg-white/7 text-[#A8B4B7] hover:text-[#F5F7EE]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-black"><Image size={14} /> Foto</div>
              {draft.photoUrl || draft.image ? <img src={draft.photoUrl || draft.image} className="mb-3 h-28 w-full rounded-xl object-cover" /> : null}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6FD3F7] px-3 py-2 text-xs font-black text-[#071114]">
                <Upload size={13} />
                Carica foto
                <input hidden type="file" accept="image/*" disabled={!draft.id} onChange={(event) => uploadMedia("photo", event.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-black"><Video size={14} /> Video</div>
              {draft.videoUrl ? <video src={draft.videoUrl} controls className="mb-3 h-28 w-full rounded-xl object-cover" /> : <div className="mb-3 grid h-28 place-items-center rounded-xl bg-[#071114] text-xs text-[#8EA9AF]">Nessun video</div>}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D8FF7A] px-3 py-2 text-xs font-black text-[#071114]">
                <Upload size={13} />
                Carica video
                <input hidden type="file" accept="video/*" disabled={!draft.id} onChange={(event) => uploadMedia("video", event.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
