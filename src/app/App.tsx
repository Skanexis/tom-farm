import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { ShopPage } from "./components/ShopPage";
import { CartDrawer, CartItem } from "./components/CartDrawer";
import { QuickViewModal } from "./components/QuickViewModal";
import { ProfilePage } from "./components/ProfilePage";
import { Product } from "./components/ProductCard";
import { AdminPage } from "./components/AdminPage";
import { ContactsPage } from "./components/ContactsPage";
import initialProducts from "../../data/initial-products.json";
import initialContacts from "../../data/initial-contacts.json";

export interface AppUser {
  id: string;
  name: string;
  username?: string;
  photoUrl?: string;
  isAdmin?: boolean;
}

export interface ContactItem {
  id: number;
  title: string;
  label: string;
  href: string;
  type: string;
  accent: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
      };
    };
  }
}

// ── Telegram login modal ──────────────────────────────────────────────────────
function TelegramLoginModal({
  onClose,
  onLogin,
}: {
  onClose: () => void;
  onLogin: (user: AppUser) => void;
}) {
  const [loading, setLoading] = useState(false);

  const mockLogin = async () => {
    setLoading(true);
    try {
      const telegramInitData = window.Telegram?.WebApp?.initData;
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          telegramInitData
            ? { initData: telegramInitData }
            : { devUser: { id: "123456789", first_name: "Admin", username: "tomfarm_admin" } }
        ),
      });
      if (!response.ok) throw new Error("Telegram auth failed");
      const user = await response.json();
      onLogin(user);
      setLoading(false);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[#0F0F11] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#229ED9">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>

          <h2 className="text-white font-black text-2xl mb-2">Accedi con Telegram</h2>
          <p className="text-[#A1A1AA] text-sm mb-8 leading-relaxed">
            Collega il tuo account Telegram per accedere a ordini, profilo e offerte riservate.
          </p>

          <button
            onClick={mockLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#229ED9] hover:bg-[#1d8bbf] disabled:opacity-70 rounded-2xl text-white font-bold transition-all"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connessione...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Continua con Telegram
              </>
            )}
          </button>

          <p className="text-[#A1A1AA] text-xs mt-4">
            Continuando accetti i nostri{" "}
            <span className="text-[#6FD3F7] cursor-pointer hover:underline">Termini di servizio</span>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Checkout success toast ────────────────────────────────────────────────────
function CheckoutSuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[#0F0F11] border border-[#30D158]/20 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Ordine inviato!</h2>
          <p className="text-[#A1A1AA] text-sm mb-8">Il tuo ordine è stato inviato correttamente. Riceverai a breve una notifica su Telegram.</p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#6FD3F7] rounded-2xl text-[#071114] font-bold hover:bg-[#9DEBFF] transition-all"
          >
            Continua gli acquisti
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState<Product[]>(initialProducts as Product[]);
  const [contacts, setContacts] = useState<ContactItem[]>(initialContacts as ContactItem[]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem("tomfarm_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Products request failed");
      setProducts(await response.json());
    } catch {
      setProducts(initialProducts as Product[]);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const response = await fetch("/api/contacts");
      if (!response.ok) throw new Error("Contacts request failed");
      setContacts(await response.json());
    } catch {
      setContacts(initialContacts as ContactItem[]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadContacts();
  }, [loadProducts, loadContacts]);

  const handleLogin = useCallback((nextUser: AppUser) => {
    localStorage.setItem("tomfarm_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("tomfarm_user");
    setUser(null);
  }, []);

  const addToCart = useCallback((product: Product, grams = 1, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.grams === grams);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.grams === grams ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, grams, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, grams: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) =>
          i.product.id === productId && i.grams === grams ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0);
    });
  }, []);

  const removeFromCart = useCallback((productId: number, grams: number) => {
    setCart((prev) => prev.filter((i) => !(i.product.id === productId && i.grams === grams)));
  }, []);

  const handleCheckout = () => {
    setCartOpen(false);
    setCart([]);
    setCheckoutSuccess(true);
  };

  const navigate = (p: string) => {
    setPage(p);
    document.querySelector(".app-content-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen overflow-hidden bg-[#020405] px-5 py-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(111,211,247,0.08),transparent_38%),linear-gradient(165deg,transparent_54%,rgba(244,201,93,0.08))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.06] [background-image:linear-gradient(108deg,#6FD3F7_1px,transparent_1px)] [background-size:58px_58px]" />

      <main className="app-shell relative mx-auto h-[min(760px,calc(100vh-48px))] w-full max-w-[1008px] overflow-hidden rounded-[34px] border border-[#2B5360]/55 bg-[#05080A] shadow-[0_28px_90px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.07)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(111,211,247,0.11),transparent_30%),linear-gradient(90deg,rgba(5,8,10,0.98),rgba(11,25,30,0.72))]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#6FD3F7_1px,transparent_0)] [background-size:24px_24px]" />

        <Header
          cartCount={cartCount}
          currentPage={page}
          onNavigate={navigate}
          onCartOpen={() => setCartOpen(true)}
          user={user}
          onLoginClick={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />

        <div className="relative z-10 h-full overflow-y-auto app-content-scroll">
          {page === "home" && (
            <HomePage
              products={products}
              onAddToCart={addToCart}
              onQuickView={setQuickViewProduct}
              onNavigate={navigate}
            />
          )}
          {(page === "shop" || page === "news" || page === "faq") && (
            <ShopPage
              products={products}
              onAddToCart={addToCart}
              onQuickView={setQuickViewProduct}
            />
          )}
          {page === "support" && <ContactsPage contacts={contacts} />}
          {page === "profile" && (
            <ProfilePage
              user={user}
              onLoginClick={() => setLoginOpen(true)}
              onLogout={handleLogout}
              onNavigate={navigate}
            />
          )}
          {page === "admin" && (
            <AdminPage
              user={user}
              products={products}
              onLoginClick={() => setLoginOpen(true)}
              onProductsChange={loadProducts}
              contacts={contacts}
              onContactsChange={loadContacts}
            />
          )}
        </div>
      </main>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, grams, qty) => { addToCart(p, grams, qty); setQuickViewProduct(null); }}
      />

      {loginOpen && (
        <TelegramLoginModal
          onClose={() => setLoginOpen(false)}
          onLogin={handleLogin}
        />
      )}

      {checkoutSuccess && (
        <CheckoutSuccessModal onClose={() => { setCheckoutSuccess(false); navigate("home"); }} />
      )}
    </div>
  );
}


