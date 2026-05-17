import { Package, LogOut, ShoppingBag, Clock, CheckCircle, BadgeCheck, Zap, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

interface Order {
  id: string;
  createdAt: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "shipped";
  total: number;
  service?: string;
  items: Array<{
    productId: number;
    name: string;
    grams: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

interface ProfilePageProps {
  user: { name: string; id: string; photoUrl?: string; isAdmin?: boolean } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const statusConfig = {
  pending: { label: "In attesa", color: "text-[#FF9500]", bg: "bg-[#FF9500]/15", icon: <Clock size={12} /> },
  accepted: { label: "Accettato", color: "text-[#30D158]", bg: "bg-[#30D158]/15", icon: <CheckCircle size={12} /> },
  rejected: { label: "Rifiutato", color: "text-[#FF453A]", bg: "bg-[#FF453A]/15", icon: <XCircle size={12} /> },
  shipped: { label: "Spedito", color: "text-[#229ED9]", bg: "bg-[#229ED9]/15", icon: <Package size={12} /> },
  completed: { label: "Completato", color: "text-[#30D158]", bg: "bg-[#30D158]/15", icon: <CheckCircle size={12} /> },
};

export function ProfilePage({ user, onLoginClick, onLogout, onNavigate }: ProfilePageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setOrdersLoading(true);
    fetch("/api/orders", { headers: { "x-user-id": user.id } })
      .then((response) => {
        if (!response.ok) throw new Error("Orders request failed");
        return response.json();
      })
      .then((nextOrders) => setOrders(nextOrders))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-full bg-transparent pt-28 pb-10 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-[#141416] flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Zap size={32} className="text-[#6FD3F7]" />
          </div>
          <h2 className="text-white font-black text-3xl mb-3">Accesso richiesto</h2>
          <p className="text-[#A1A1AA] mb-8">Accedi con Telegram per vedere profilo, ordini e altro.</p>
          <button
            onClick={onLoginClick}
            className="flex items-center gap-3 px-8 py-4 bg-[#229ED9] rounded-2xl text-white font-bold mx-auto hover:bg-[#1d8bbf] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Accedi con Telegram
          </button>
        </div>
      </div>
    );
  }

  const approvedOrders = useMemo(() => orders.filter((order) => order.status === "accepted" || order.status === "completed"), [orders]);
  const totalSpent = useMemo(() => approvedOrders.reduce((sum, order) => sum + order.total, 0), [approvedOrders]);
  const completedOrders = approvedOrders.length;
  const formatOrderDate = (date: string) => new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));

  return (
    <div className="min-h-full overflow-x-hidden bg-transparent px-3 pb-8 pt-20 sm:px-0 sm:pb-10 sm:pt-28">
      <div className="mx-auto max-w-[860px] overflow-x-hidden px-0 py-4 sm:px-6 sm:py-10">
        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-5 overflow-hidden rounded-2xl border border-white/5 bg-[#141416] p-4 sm:mb-8 sm:rounded-3xl sm:p-8"
        >
          {/* bg glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FD3F7]/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#6FD3F7] to-[#D8FF7A] text-2xl font-black text-white shadow-[0_0_30px_rgba(111,211,247,0.24)] sm:h-20 sm:w-20 sm:text-3xl">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name[0].toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#30D158] rounded-full border-2 border-[#141416] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-white font-black text-2xl mb-1">{user.name}</h1>
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#229ED9">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="min-w-0 truncate text-sm text-[#229ED9]">Telegram ID: {user.id}</span>
              </div>
              {user.isAdmin && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-[#6FD3F7]/20 bg-[#6FD3F7]/10 px-3 py-1">
                    <BadgeCheck size={12} className="text-[#6FD3F7]" />
                    <span className="text-xs font-semibold text-[#6FD3F7]">ADMIN</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D8FF7A]/30 text-[#D8FF7A] hover:bg-[#D8FF7A]/10 text-sm font-medium transition-all"
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>

          {/* Stats */}
          <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/5 pt-5 sm:mt-8 sm:gap-4 sm:pt-8">
            {[
              { label: "Ordini totali", value: orders.length, icon: <ShoppingBag size={18} className="text-[#6FD3F7]" /> },
              { label: "Completati", value: completedOrders, icon: <CheckCircle size={18} className="text-[#30D158]" /> },
              { label: "Totale speso", value: `${totalSpent.toFixed(0)}€`, icon: <Zap size={18} className="text-[#BF5AF2]" /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <p className="text-lg font-black text-white sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-[10px] text-[#A1A1AA] sm:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid min-w-0 gap-4">
          {/* Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="min-w-0 rounded-2xl border border-white/5 bg-[#141416] p-4 sm:rounded-3xl sm:p-6"
          >
            <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <Package size={18} className="text-[#6FD3F7]" />
              Storico ordini
            </h2>
            <div className="space-y-3">
              {ordersLoading && (
                <div className="rounded-2xl border border-white/5 bg-[#0F0F11] p-5 text-sm font-bold text-[#A1A1AA]">
                  Caricamento ordini...
                </div>
              )}

              {!ordersLoading && orders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#2B5360]/55 bg-[#0F0F11] p-6 text-center">
                  <ShoppingBag size={26} className="mx-auto mb-3 text-[#6FD3F7]" />
                  <p className="font-black text-white">Nessun ordine ancora</p>
                  <p className="mt-1 text-sm text-[#A1A1AA]">Gli ordini reali appariranno qui dopo l'invio.</p>
                  <button
                    onClick={() => onNavigate("shop")}
                    className="mt-4 rounded-xl bg-[#6FD3F7] px-4 py-2 text-xs font-black text-[#071114]"
                  >
                    Apri catalogo
                  </button>
                </div>
              )}

              {!ordersLoading && orders.map((order) => {
                const s = statusConfig[order.status];
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <div
                    key={order.id}
                    className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-white/5 bg-[#0F0F11] p-3 transition-all hover:border-white/10 sm:flex sm:items-center sm:justify-between sm:p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6FD3F7]/10 sm:h-10 sm:w-10">
                        <ShoppingBag size={16} className="text-[#6FD3F7]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm">{order.id}</p>
                        <p className="mt-0.5 truncate text-xs text-[#A1A1AA]">
                          {formatOrderDate(order.createdAt)} · {itemCount} articolo{itemCount > 1 ? "i" : ""}{order.service ? ` · ${order.service}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${s.bg}`}>
                        <span className={s.color}>{s.icon}</span>
                        <span className={`${s.color} text-xs font-medium`}>{s.label}</span>
                      </div>
                      <span className="text-white font-bold text-sm">{order.total.toFixed(2)}€</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}



