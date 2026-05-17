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
    <header className="absolute left-2 right-2 top-2 z-50 flex items-center justify-between gap-1.5 rounded-[18px] border border-[#2B5360]/55 bg-[#0B0F12]/86 px-2 py-2 shadow-[0_14px_42px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:left-5 sm:right-5 sm:top-5 sm:gap-3 sm:rounded-[22px] sm:px-4 sm:py-3">
        <button
          onClick={() => onNavigate("home")}
          className="flex shrink-0 items-center gap-2 group sm:gap-3"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full border border-[#6FD3F7]/45 bg-[#071114] shadow-[0_0_18px_rgba(111,211,247,0.16)] transition-transform group-hover:rotate-6 sm:h-8 sm:w-8">
            <img
              src={tomFarmLogo}
              alt="Tom Farm logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-black tracking-[0.06em] text-[#D8FF7A] sm:text-xl sm:tracking-[0.18em]">Tom Farm</span>
        </button>

        <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:justify-center sm:gap-1.5">
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
                className={`group relative flex h-8 min-w-8 items-center justify-center gap-1 rounded-xl px-1 text-xs font-black transition-all sm:h-9 sm:min-w-9 sm:gap-1.5 sm:px-2.5 ${
                  active
                    ? "border border-[#D8FF7A]/35 bg-[#D8FF7A] text-[#071114] shadow-[0_12px_30px_rgba(216,255,122,0.14)]"
                    : "border border-white/10 bg-white/7 text-[#A8B4B7] hover:border-[#6FD3F7]/45 hover:bg-[#6FD3F7]/10 hover:text-[#F5F7EE]"
                }`}
                title={link.label}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-lg transition-all sm:h-5.5 sm:w-5.5 ${
                    active
                      ? "bg-[#071114]/12"
                      : "bg-[#071114]/55 text-[#9DEBFF] group-hover:bg-[#6FD3F7]/18"
                  }`}
                >
                  <Icon size={14.5} strokeWidth={2.5} className="sm:h-4 sm:w-4" />
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
