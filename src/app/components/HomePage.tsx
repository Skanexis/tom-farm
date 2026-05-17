import { ArrowRight, MapPin, PackageCheck, Truck } from "lucide-react";
import { motion } from "motion/react";
import tomFarmLogo from "../../../upload/photo_2026-05-15_19-34-45.jpg";
import { Product } from "./ProductCard";

interface HomePageProps {
  products: Product[];
  onAddToCart: (product: Product, grams: number) => void;
  onQuickView: (product: Product) => void;
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const serviceItems = [
    { icon: MapPin, title: "Meet up", detail: "Frosinone" },
    { icon: Truck, title: "Delivery", detail: "Tutto il Lazio, preferibile ordinare un giorno prima" },
    { icon: PackageCheck, title: "Ship", detail: "24-48h in tutta Italia e anche fuori Italia" },
  ];

  return (
    <div className="flex min-h-full items-center justify-center px-3 pb-3 pt-16 text-[#F5F7EE] sm:px-4 sm:pb-4 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(111,211,247,0.14),transparent_34%)]" />
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex w-full max-w-[540px] flex-col items-center text-center"
      >
        <div className="relative mb-2.5 sm:mb-3">
          <div className="absolute -inset-2 rounded-full border border-[#6FD3F7]/20" />
          <div className="absolute -inset-5 rounded-full bg-[#6FD3F7]/8 blur-2xl" />
          <img
            src={tomFarmLogo}
            alt="Tom Farm logo"
            className="relative h-20 w-20 rounded-full border border-[#6FD3F7]/45 object-cover shadow-[0_18px_52px_rgba(0,0,0,0.42),0_0_34px_rgba(111,211,247,0.14)] sm:h-28 sm:w-28"
          />
        </div>

        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#9DEBFF]">
          Listino
        </p>
        <h1 className="text-3xl font-black uppercase leading-none tracking-[0.08em] text-[#F5F7EE] sm:text-5xl">
          Tom Farm
        </h1>

        <div className="mt-4 grid w-full gap-1.5 text-left sm:mt-5 sm:grid-cols-2 sm:gap-2">
          {serviceItems.map(({ icon: Icon, title, detail }) => (
            <div
              key={title}
              className="group flex min-h-[48px] items-center gap-2 rounded-[14px] border border-[#244A52] bg-[#071114]/70 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:min-h-[58px] sm:gap-2.5 sm:rounded-2xl"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#6FD3F7]/35 bg-[#10242A] text-[#D8FF7A] sm:h-8 sm:w-8">
                <Icon size={13} strokeWidth={2.3} className="sm:h-[15px] sm:w-[15px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#9DEBFF]">
                  {title}
                </span>
                <span className="mt-0.5 block text-[11px] font-bold leading-snug text-[#F5F7EE] sm:text-[13px]">
                  {detail}
                </span>
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onNavigate("shop")}
          className="mt-4 flex h-9 items-center gap-2 rounded-full bg-[#6FD3F7] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#071114] shadow-[0_14px_30px_rgba(111,211,247,0.18)] transition-all hover:bg-[#9DEBFF] active:scale-[0.98] sm:mt-5 sm:h-10 sm:px-5 sm:text-xs"
        >
          Apri catalogo
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </motion.section>
    </div>
  );
}
