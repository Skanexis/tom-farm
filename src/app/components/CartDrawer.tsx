import { X, Trash2, Plus, Minus, ReceiptText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Product, getProductOption } from "./ProductCard";

export interface CartItem {
  product: Product;
  grams: number;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, grams: number, delta: number) => void;
  onRemove: (productId: number, grams: number) => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + getProductOption(item.product, item.grams).price * item.quantity, 0);
  const totalPacks = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#0B0F12] text-[#F5F7EE] border-l border-[#2B5360]/55 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="relative px-6 py-6 border-b border-[#2B5360]/55">
              <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,#6FD3F7_1px,transparent_1px),linear-gradient(#6FD3F7_1px,transparent_1px)] [background-size:18px_18px]" />
              <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#6FD3F7]/12 text-[#D8FF7A] border border-[#6FD3F7]/35">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8EA9AF]">Tom Farm</p>
                    <h2 className="text-2xl font-black">Ricevuta ordine</h2>
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-[#2B5360]/45 bg-white/7 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-[#8EA9AF]">Righe</p>
                      <p className="font-black">{items.length}</p>
                    </div>
                    <div className="rounded-xl border border-[#2B5360]/45 bg-white/7 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-[#8EA9AF]">Pacchi</p>
                      <p className="font-black">{totalPacks}</p>
                    </div>
                    <div className="rounded-xl border border-[#2B5360]/45 bg-white/7 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-[#8EA9AF]">Listino</p>
                      <p className="font-black">Tom Farm</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#8EA9AF] hover:text-[#F5F7EE] hover:bg-white/7 transition-all"
              >
                <X size={20} />
              </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#6FD3F7]/12 border border-[#6FD3F7]/35 flex items-center justify-center">
                    <ReceiptText size={28} className="text-[#D8FF7A]" />
                  </div>
                  <div>
                    <p className="font-black mb-1">La ricevuta è vuota</p>
                    <p className="text-[#8EA9AF] text-sm">Aggiungi un prodotto per creare l'ordine.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-[#6FD3F7] rounded-xl text-[#071114] font-black hover:bg-[#9DEBFF] transition-all"
                  >
                    Sfoglia il menu
                  </button>
                </div>
              ) : (
                <div className="rounded-[24px] border border-[#2B5360]/55 bg-white/7 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="grid grid-cols-[1.5fr_56px_64px_72px_32px] gap-2 border-b border-dashed border-[#2B5360]/55 pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#8EA9AF]">
                    <span>Prodotto</span>
                    <span className="text-right">Formato</span>
                    <span className="text-right">Prezzo</span>
                    <span className="text-right">Totale</span>
                    <span />
                  </div>
                  <div className="divide-y divide-dashed divide-[#2B5360]/45">
                    {items.map((item) => {
                      const option = getProductOption(item.product, item.grams);
                      const lineTotal = option.price * item.quantity;

                      return (
                        <motion.div
                          key={`${item.product.id}-${item.grams}`}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="grid grid-cols-[1.5fr_56px_64px_72px_32px] items-center gap-2 py-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#071114]">
                                <ImageWithFallback
                                  src={item.product.photoUrl || item.product.image}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover opacity-70 grayscale"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">{item.product.name}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <button
                                    onClick={() => onUpdateQuantity(item.product.id, item.grams, -1)}
                                  className="grid h-6 w-6 place-items-center rounded-md bg-white/7 hover:bg-white/12"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-5 text-center text-sm font-black">{item.quantity}</span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.product.id, item.grams, 1)}
                                  className="grid h-6 w-6 place-items-center rounded-md bg-white/7 hover:bg-white/12"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-right text-sm font-black">{option.label}</span>
                          <span className="text-right text-sm font-bold text-[#8EA9AF]">{option.price}€</span>
                          <span className="text-right text-sm font-black">{lineTotal}€</span>
                          <button
                            onClick={() => onRemove(item.product.id, item.grams)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#8EA9AF] hover:bg-[#6FD3F7]/12 hover:text-[#9DEBFF] transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-[#2B5360]/55 space-y-4 bg-[#071114]">
                <div className="space-y-2 rounded-2xl border border-[#2B5360]/55 bg-white/7 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#8EA9AF]">Pacchi totali</span>
                    <span className="font-black">{totalPacks}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#8EA9AF]">Listino</span>
                    <span className="font-black">Tom Farm</span>
                  </div>
                  <div className="border-t border-dashed border-[#2B5360]/55 pt-3 flex items-center justify-between">
                    <span className="text-lg font-black">Totale ricevuta</span>
                    <span className="text-3xl font-black">{total.toFixed(2)}€</span>
                  </div>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#6FD3F7] rounded-2xl text-[#071114] font-black hover:bg-[#9DEBFF] active:scale-[0.98] transition-all duration-200"
                >
                  Invia ricevuta
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl border border-[#2B5360]/55 text-[#8EA9AF] hover:text-[#F5F7EE] hover:border-[#6FD3F7]/45 font-bold transition-all"
                >
                  Continua il menu
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
