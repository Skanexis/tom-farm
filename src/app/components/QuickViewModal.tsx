import { X, ShoppingCart, Zap, MessageCircle, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Product, getProductOption, getProductOptions } from "./ProductCard";

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

  if (!product) return null;

  const options = getProductOptions(product);
  const selectedOption = getProductOption(product, options.some((option) => option.amount === amount) ? amount : options[0].amount);

  const handleAdd = () => {
    onAddToCart(product, selectedOption.amount, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-[#0F0F11] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden pointer-events-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="relative md:w-1/2 h-64 md:h-auto bg-[#1A1A1E]">
                  {product.videoUrl ? (
                    <video
                      src={product.videoUrl}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageWithFallback
                      src={product.photoUrl || product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {product.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold ${
                      product.badge === "HOT" ? "bg-[#6FD3F7] text-[#071114]" : product.badge === "SALE" ? "bg-[#48C78E] text-[#071114]" : "bg-[#D8FF7A] text-[#071114]"
                    }`}>
                      {product.badge === "NEW" ? "NUOVO" : product.badge === "SALE" ? "OFFERTA" : "TOP"}
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="absolute top-4 right-4 bg-[#48C78E] px-2 py-1 rounded-lg text-[#071114] text-xs font-bold">
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="md:w-1/2 p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[#A1A1AA] text-xs uppercase tracking-widest mb-1">{categoryLabels[product.category] ?? product.category}</p>
                      <h2 className="text-white font-bold text-xl leading-tight">{product.name}</h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-[#A1A1AA] text-sm leading-relaxed mb-5">{product.description}</p>

                  {/* Stock */}
                  {product.stock <= 5 && (
                    <div className="flex items-center gap-2 mb-4 text-[#F4C95D] text-sm">
                      <Zap size={14} />
                      <span>Solo {product.stock} rimasti in stock!</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="text-white font-bold text-3xl">{selectedOption.price}€</span>
                    {product.originalPrice && (
                      <span className="text-[#A1A1AA] text-lg line-through">{product.originalPrice}€</span>
                    )}
                    <span className="text-[#A1A1AA] text-sm">{selectedOption.label}</span>
                  </div>

                  <div className="mb-5">
                    <p className="text-[#A1A1AA] text-xs uppercase tracking-widest mb-2">Seleziona formato</p>
                    <div className="grid grid-cols-5 gap-2">
                      {options.map((option) => (
                        <button
                          key={option.amount}
                          onClick={() => setAmount(option.amount)}
                          className={`rounded-xl px-2 py-2 text-sm font-bold transition-all ${
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
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-[#A1A1AA] hover:text-white transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="text-white font-semibold w-6 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="text-[#A1A1AA] hover:text-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-[#A1A1AA] text-sm">{(selectedOption.price * quantity).toFixed(2)}€ totale</span>
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
                    <button className="px-4 py-3 rounded-xl bg-[#229ED9]/20 border border-[#229ED9]/30 text-[#229ED9] hover:bg-[#229ED9]/30 transition-all">
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
