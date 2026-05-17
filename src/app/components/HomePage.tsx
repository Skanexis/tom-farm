import { ArrowRight, Bitcoin, MapPin, PackageCheck, Truck } from "lucide-react";
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
    { icon: Bitcoin, title: "Pagamento", detail: "Bitcoin o contanti su ship, se portate voi da noi" },
  ];

  return (
    <div className="flex min-h-full items-center justify-center px-5 pb-10 pt-24 text-[#F5F7EE]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(111,211,247,0.14),transparent_34%)]" />
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex w-full max-w-[560px] flex-col items-center text-center"
      >
        <div className="relative mb-5">
          <div className="absolute -inset-3 rounded-full border border-[#6FD3F7]/20" />
          <div className="absolute -inset-7 rounded-full bg-[#6FD3F7]/8 blur-2xl" />
          <img
            src={tomFarmLogo}
            alt="Tom Farm logo"
            className="relative h-36 w-36 rounded-full border border-[#6FD3F7]/45 object-cover shadow-[0_24px_70px_rgba(0,0,0,0.45),0_0_42px_rgba(111,211,247,0.16)] sm:h-40 sm:w-40"
          />
        </div>

        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.34em] text-[#9DEBFF]">
          Listino
        </p>
        <h1 className="text-5xl font-black uppercase leading-none tracking-[0.08em] text-[#F5F7EE]">
          Tom Farm
        </h1>

        <div className="mt-7 grid w-full gap-2 text-left sm:grid-cols-2">
          {serviceItems.map(({ icon: Icon, title, detail }) => (
            <div
              key={title}
              className="group flex min-h-[74px] items-center gap-3 rounded-2xl border border-[#244A52] bg-[#071114]/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#6FD3F7]/35 bg-[#10242A] text-[#D8FF7A]">
                <Icon size={18} strokeWidth={2.3} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-[#9DEBFF]">
                  {title}
                </span>
                <span className="mt-1 block text-sm font-bold leading-snug text-[#F5F7EE]">
                  {detail}
                </span>
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onNavigate("shop")}
          className="mt-7 flex h-12 items-center gap-2 rounded-full bg-[#6FD3F7] px-6 text-sm font-black uppercase tracking-[0.12em] text-[#071114] shadow-[0_16px_36px_rgba(111,211,247,0.20)] transition-all hover:bg-[#9DEBFF] active:scale-[0.98]"
        >
          Apri catalogo
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </motion.section>
    </div>
  );
}
