import { X, ShoppingCart, Zap, MessageCircle, Minus, Plus, ChevronLeft, ChevronRight, Image as ImageIcon, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Product, badgeVariantClasses, getBadgeLabel, getBadgeVariant, getProductOption, getProductOptions, getProductPhotos, getProductVideos } from "./ProductCard";

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

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, grams: number, quantity: number) => void;
}

export function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    setActiveMediaIndex(0);
    setQuantity(1);
    setAmount(1);
  }, [product?.id]);

  if (!product) return null;

  const options = getProductOptions(product);
  const selectedOption = getProductOption(product, options.some((option) => option.amount === amount) ? amount : options[0].amount);
  const media = [
    ...getProductPhotos(product).map((url) => ({ type: "photo" as const, url })),
    ...getProductVideos(product).map((url) => ({ type: "video" as const, url })),
  ];
  const activeMedia = media[activeMediaIndex] ?? media[0];
  const goMedia = (step: number) => setActiveMediaIndex((current) => (current + step + media.length) % media.length);

  const handleAdd = () => {
    onAddToCart(product, selectedOption.amount, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const badgeLabel = getBadgeLabel(product);
  const badgeVariant = getBadgeVariant(product);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 pointer-events-none sm:p-4"
          >
            <div
              className="max-h-[calc(100dvh-20px)] w-full max-w-[760px] overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F11] shadow-2xl pointer-events-auto sm:max-h-[calc(100dvh-32px)] sm:rounded-[22px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex max-h-[calc(100dvh-20px)] min-h-0 flex-col md:max-h-[calc(100dvh-32px)] md:flex-row">
                <div className="relative flex h-[46dvh] min-h-[255px] max-h-[410px] flex-col bg-[#1A1A1E] md:h-auto md:max-h-none md:w-[58%]">
                  <div className="relative min-h-0 flex-1 overflow-hidden">
                  {activeMedia?.type === "video" ? (
                    <video
                      key={activeMedia.url}
                      src={activeMedia.url}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageWithFallback
                      src={activeMedia?.url}
                      alt={product.name}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {media.length > 1 && (
                    <>
                      <button onClick={() => goMedia(-1)} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => goMedia(1)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75">
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                  {badgeLabel && (
                    <div className={`absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur-md ${
                      badgeVariantClasses[badgeVariant] ?? badgeVariantClasses.top
                    }`}>
                      {badgeLabel}
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="absolute top-4 right-4 bg-[#48C78E] px-2 py-1 rounded-lg text-[#071114] text-xs font-bold">
                      -{discount}%
                    </div>
                  )}
                  </div>
                  {media.length > 1 && (
                    <div className="flex h-16 gap-2 overflow-x-auto border-t border-white/10 bg-[#0B0F12] p-2">
                      {media.map((item, index) => (
                        <button
                          key={`${item.type}-${item.url}`}
                          onClick={() => setActiveMediaIndex(index)}
                          className={`relative h-12 w-14 flex-shrink-0 overflow-hidden rounded-xl border transition ${index === activeMediaIndex ? "border-[#D8FF7A]" : "border-white/10 opacity-70 hover:opacity-100"}`}
                        >
                          {item.type === "photo" ? (
                            <ImageWithFallback src={item.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          ) : (
                            <>
                              <video src={item.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                              <span className="absolute inset-0 grid place-items-center bg-black/35 text-white"><Play size={13} fill="currentColor" /></span>
                            </>
                          )}
                          <span className="absolute bottom-1 right-1 rounded bg-black/65 p-0.5 text-white">
                            {item.type === "photo" ? <ImageIcon size={9} /> : <Play size={9} fill="currentColor" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex min-h-0 flex-col overflow-y-auto p-4 app-content-scroll md:w-[42%] md:p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-widest text-[#A1A1AA]">{categoryLabels[product.category] ?? product.category}</p>
                      <h2 className="text-lg font-bold leading-tight text-white">{product.name}</h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="mb-4 text-xs leading-relaxed text-[#A1A1AA]">{product.description}</p>

                  {/* Stock */}
                  {product.stock <= 5 && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-[#F4C95D]">
                      <Zap size={14} />
                      <span>Solo {product.stock} rimasti in stock!</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4 flex items-baseline gap-2.5">
                    <span className="text-2xl font-bold text-white">{selectedOption.price}€</span>
                    {product.originalPrice && (
                      <span className="text-base text-[#A1A1AA] line-through">{product.originalPrice}€</span>
                    )}
                    <span className="text-xs text-[#A1A1AA]">{selectedOption.label}</span>
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 text-[10px] uppercase tracking-widest text-[#A1A1AA]">Seleziona formato</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {options.map((option) => (
                        <button
                          key={option.amount}
                          onClick={() => setAmount(option.amount)}
                          className={`rounded-lg px-1.5 py-1.5 text-xs font-bold transition-all ${
                            selectedOption.amount === option.amount
                              ? "bg-[#D8FF7A] text-[#101207]"
                              : "bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-[#A1A1AA] hover:text-white transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="text-white font-semibold w-6 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="text-[#A1A1AA] hover:text-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-xs text-[#A1A1AA]">{(selectedOption.price * quantity).toFixed(2)}€ totale</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAdd}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                        added
                          ? "bg-[#48C78E] text-[#071114]"
                          : "bg-[#6FD3F7] text-[#071114] hover:bg-[#9DEBFF]"
                      }`}
                    >
                      <ShoppingCart size={16} />
                      {added ? "Aggiunto al carrello!" : "Aggiungi al carrello"}
                    </motion.button>
                    <button className="rounded-xl border border-[#229ED9]/30 bg-[#229ED9]/20 px-3.5 py-3 text-[#229ED9] transition-all hover:bg-[#229ED9]/30">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
