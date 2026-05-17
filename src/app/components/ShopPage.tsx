import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard, Product } from "./ProductCard";

interface ShopPageProps {
  products: Product[];
  onAddToCart: (product: Product, grams: number) => void;
  onQuickView: (product: Product) => void;
}

const categories = ["Tutti", "Hash", "Frozen", "Premium", "Vape"];
const categoryMap: Record<string, string> = {
  Tutti: "All",
  Hash: "Hash",
  Frozen: "Frozen",
  Premium: "Premium",
  Vape: "Vape",
};
export function ShopPage({ products, onAddToCart, onQuickView }: ShopPageProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tutti");

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    const categoryValue = categoryMap[activeCategory] ?? activeCategory;
    if (categoryValue !== "All") {
      result = result.filter((p) => p.category.toLowerCase() === categoryValue.toLowerCase());
    }

    return result;
  }, [products, search, activeCategory]);

  return (
    <div className="min-h-full px-3 pb-6 pt-18 text-[#F5F7EE] sm:px-4 sm:pb-8 sm:pt-24">
      <div className="relative mx-auto max-w-[820px]">
        <aside className="pointer-events-none absolute -left-16 top-20 hidden h-[260px] w-12 lg:block">
          <div className="absolute left-6 top-0 h-24 w-px rotate-[72deg] bg-[#2B5360]" />
          <p className="absolute left-5 top-20 rotate-90 text-[10px] font-black uppercase tracking-[0.28em] text-[#8EA9AF]">Catalogo</p>
          <div className="absolute left-6 top-32 flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((dot) => (
              <span key={dot} className={`h-1.5 w-1.5 rounded-full ${dot === 1 ? "h-5 bg-[#6FD3F7]" : "bg-[#4A565A]"}`} />
            ))}
          </div>
        </aside>

        <section className="overflow-visible sm:overflow-hidden sm:rounded-[24px] sm:border sm:border-[#2B5360]/55 sm:bg-[#0B0F12]/90 sm:shadow-[0_22px_70px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.06)] sm:backdrop-blur-xl">
          <div className="relative px-0 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
            <div className="pointer-events-none absolute inset-0 hidden opacity-[0.04] [background-image:linear-gradient(#D8FF7A_1px,transparent_1px)] [background-size:100%_4px] sm:block" />
            <div className="relative">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black leading-none text-[#F5F7EE] sm:text-3xl">Catalogo</h1>
                  <p className="mt-1.5 text-xs text-[#A8B4B7]">{filtered.length} prodotti disponibili</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8EA9AF]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cerca"
                    className="h-10 w-12 rounded-[14px] border border-white/10 bg-white/8 pl-9 pr-2 text-xs text-[#F5F7EE] outline-none transition-all placeholder:text-transparent focus:w-48 focus:border-[#6FD3F7]/60 focus:placeholder:text-[#718187]"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8EA9AF] hover:text-[#F5F7EE]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-3.5 rounded-[18px] border border-[#2B5360]/55 bg-[linear-gradient(100deg,rgba(111,211,247,0.16),rgba(216,255,122,0.04))] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#A8B4B7]">Selezione</p>
                    <p className="mt-1.5 text-base font-black text-[#F5F7EE]">{activeCategory}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#A8B4B7]">Prodotti</p>
                    <p className="mt-0.5 text-2xl font-black text-[#D8FF7A]">{filtered.length}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`h-8 rounded-full px-3.5 text-xs font-black transition-all ${
                      activeCategory === cat
                        ? "bg-[#6FD3F7] text-[#071114] shadow-[0_12px_30px_rgba(111,211,247,0.16)]"
                        : "border border-white/10 bg-white/7 text-[#A8B4B7] hover:border-[#6FD3F7]/45 hover:text-[#F5F7EE]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search size={42} className="mb-4 text-[#6FD3F7]" />
                  <p className="mb-2 text-lg font-black text-[#F5F7EE]">Nessun prodotto trovato</p>
                  <p className="mb-6 text-sm text-[#A8B4B7]">Prova a modificare ricerca o filtri</p>
                  <button
                    onClick={() => { setSearch(""); setActiveCategory("Tutti"); }}
                    className="rounded-xl bg-[#D8FF7A] px-6 py-3 font-black text-[#071114] transition-all hover:bg-[#E8FFAA]"
                  >
                    Cancella filtri
                  </button>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={onAddToCart}
                          onQuickView={onQuickView}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
