import { useState } from "react";
import { Play, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  photoUrl?: string;
  videoUrl?: string;
  category: string;
  badge?: "NEW" | "HOT" | "SALE";
  stock: number;
  description: string;
  pricingOptions?: ProductPricingOption[];
}

export interface ProductPricingOption {
  amount: number;
  label: string;
  price: number;
}

export const GRAM_OPTIONS = [1, 2, 3, 5, 10, 25, 50, 100, 250, 500];
export const getProductOptions = (product: Product): ProductPricingOption[] =>
  product.pricingOptions ?? GRAM_OPTIONS.map((amount) => ({
    amount,
    label: `${amount}g`,
    price: product.price * amount,
  }));

export const getProductOption = (product: Product, amount: number): ProductPricingOption =>
  getProductOptions(product).find((option) => option.amount === amount) ?? getProductOptions(product)[0];

const categoryLabels: Record<string, string> = {
  Classic: "Classico",
  "Green Label": "Etichetta Verde",
  Reserve: "Riserva",
  "Night Batch": "Lotto Notte",
  "Soft Trim": "Taglio Morbido",
  Farmhouse: "Fattoria",
  Amber: "Ambra",
  Silver: "Argento",
  "Black Label": "Etichetta Nera",
  Bulk: "Ingrosso",
  Hash: "Hash",
  Frozen: "Frozen",
  Premium: "Premium",
  Vape: "Vape",
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, grams: number) => void;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const options = getProductOptions(product);
  const [amount, setAmount] = useState(options[0]?.amount ?? 1);
  const badgeColors = {
    NEW: "bg-[#D8FF7A] text-[#0B1113]",
    HOT: "bg-[#6FD3F7] text-[#071114]",
    SALE: "bg-[#F4C95D] text-[#171008]",
  };
  const badgeLabels = {
    NEW: "NUOVO",
    HOT: "TOP",
    SALE: "OFFERTA",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative min-h-[250px] overflow-hidden cursor-pointer group rounded-[14px] border border-[#2B5360]/55 bg-[#111518] shadow-[0_14px_44px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:border-[#6FD3F7]/65 sm:min-h-[205px] sm:rounded-[16px]"
      onClick={() => onQuickView(product)}
    >
      {product.badge && (
        <div className={`absolute right-3 top-3 z-20 ${badgeColors[product.badge]} rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide shadow-lg`}>
          {badgeLabels[product.badge]}
        </div>
      )}

      {product.stock <= 3 && product.stock > 0 && (
        <div className={`absolute right-3 z-20 flex items-center gap-1 rounded-full border border-[#F4C95D]/35 bg-[#F4C95D]/15 px-2 py-0.5 text-[10px] font-black text-[#F7D77D] ${product.badge ? "top-9" : "top-3"}`}>
          <Zap size={9} />
          {product.stock} rimasti
        </div>
      )}

      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(90deg,#D8FF7A_1px,transparent_1px),linear-gradient(#D8FF7A_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="tf-card-sweep pointer-events-none absolute inset-y-0 -left-1/2 z-10 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(111,211,247,0.10),transparent)]" />
      <div className="relative grid h-full min-h-[250px] grid-cols-1 sm:min-h-[205px]">
        <div className="relative min-h-[112px] overflow-hidden border-b border-[#2B5360]/45 bg-[#071114] sm:min-h-[168px]">
          {product.videoUrl ? (
            <video
              src={product.videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale transition-all duration-500 group-hover:opacity-35 group-hover:scale-105"
              onMouseEnter={(event) => event.currentTarget.play()}
              onMouseLeave={(event) => event.currentTarget.pause()}
            />
          ) : (
            <ImageWithFallback
              src={product.photoUrl || product.image}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover opacity-18 grayscale transition-all duration-500 group-hover:opacity-25 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,17,20,0.92),rgba(20,42,48,0.72))]" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-[#6FD3F7]/45 bg-[#6FD3F7]/10 shadow-[0_0_44px_rgba(111,211,247,0.18)] sm:h-16 sm:w-16">
              <div className="grid h-7 w-7 place-items-center rounded-full border border-[#D8FF7A] text-[#D8FF7A] sm:h-8 sm:w-8">
                <Play size={14} fill="currentColor" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#6FD3F7]/45 to-transparent" />
        </div>

        <div className="relative flex min-h-[138px] flex-col p-2.5 sm:min-h-[175px] sm:p-3.5">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8EA9AF] sm:text-[9px] sm:tracking-[0.24em]">{categoryLabels[product.category] ?? product.category}</p>
            <h3 className="mt-1.5 text-[11px] font-black uppercase leading-tight text-[#F5F7EE] sm:mt-2 sm:text-sm">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#A8B4B7] sm:mt-1.5 sm:text-xs">{product.description}</p>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div className="flex flex-wrap gap-1">
              {options.map((option) => (
                <button
                  key={option.amount}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAmount(option.amount);
                  }}
                  className={`rounded-full px-1.5 py-1 text-[8px] font-black transition-all sm:px-2 sm:text-[9px] ${
                    amount === option.amount
                      ? "bg-[#D8FF7A] text-[#071114]"
                      : "border border-white/10 bg-white/7 text-[#A8B4B7] hover:border-[#6FD3F7]/45 hover:text-[#F5F7EE]"
                  }`}
                >
                  {option.label} · {option.price}€
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
