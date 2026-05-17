import { Grid3X3, Home, Phone, Settings, ShoppingCart, User } from "lucide-react";
import { motion } from "motion/react";
import type { AppUser } from "../App";
import tomFarmLogo from "../../../upload/photo_2026-05-15_19-34-45.jpg";

interface HeaderProps {
  cartCount: number;
  currentPage: string;
  onNavigate: (page: string) => void;
  onCartOpen: () => void;
  user: AppUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

const navLinks = [
  { label: "Inizio", page: "home", icon: Home },
  { label: "Catalogo", page: "shop", icon: Grid3X3 },
  { label: "Carrello", page: "cart", icon: ShoppingCart },
  { label: "Profilo", page: "profile", icon: User },
  { label: "Contatti", page: "support", icon: Phone },
];

export function Header({ cartCount, currentPage, onNavigate, onCartOpen, user, onLoginClick }: HeaderProps) {
  const visibleLinks = user?.isAdmin
    ? [...navLinks, { label: "Admin", page: "admin", icon: Settings }]
    : navLinks;

  return (
    <header className="absolute left-5 right-5 top-5 z-50 flex items-center justify-between gap-3 rounded-[22px] border border-[#2B5360]/55 bg-[#0B0F12]/86 px-4 py-3 shadow-[0_14px_42px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 group"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full border border-[#6FD3F7]/45 bg-[#071114] shadow-[0_0_18px_rgba(111,211,247,0.16)] transition-transform group-hover:rotate-6">
            <img
              src={tomFarmLogo}
              alt="Tom Farm logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-[0.18em] text-[#D8FF7A]">T.F</span>
        </button>

        <nav className="flex flex-1 items-center justify-center gap-1.5">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = currentPage === link.page || (link.page === "shop" && ["news", "faq"].includes(currentPage));

            return (
              <button
                key={link.page}
                onClick={() => {
                  if (link.page === "cart") onCartOpen();
                  else if (link.page === "profile" && !user) onLoginClick();
                  else onNavigate(link.page);
                }}
                className={`group relative flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-black transition-all ${
                  active
                    ? "border border-[#D8FF7A]/35 bg-[#D8FF7A] text-[#071114] shadow-[0_12px_30px_rgba(216,255,122,0.14)]"
                    : "border border-white/10 bg-white/7 text-[#A8B4B7] hover:border-[#6FD3F7]/45 hover:bg-[#6FD3F7]/10 hover:text-[#F5F7EE]"
                }`}
                title={link.label}
              >
                <span
                  className={`grid h-5.5 w-5.5 place-items-center rounded-lg transition-all ${
                    active
                      ? "bg-[#071114]/12"
                      : "bg-[#071114]/55 text-[#9DEBFF] group-hover:bg-[#6FD3F7]/18"
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <span className="hidden lg:inline">{link.label}</span>
                {link.page === "cart" && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black ${
                      active ? "bg-[#071114] text-[#D8FF7A]" : "bg-[#D8FF7A] text-[#071114]"
                    }`}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

      </header>
  );
}
