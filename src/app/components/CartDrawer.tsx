import { X, Trash2, Plus, Minus, ReceiptText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Product, getProductOption } from "./ProductCard";

export interface CartItem {
  product: Product;
  grams: number;
  quantity: number;
}

export type CheckoutService = "Meet Up" | "Delivery" | "Ship";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, grams: number, delta: number) => void;
  onRemove: (productId: number, grams: number) => void;
  onCheckout: (service: CheckoutService) => void;
}

export function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + getProductOption(item.product, item.grams).price * item.quantity, 0);
  const totalPacks = items.reduce((sum, item) => sum + item.quantity, 0);
  const [service, setService] = useState<CheckoutService>("Meet Up");
  const services: CheckoutService[] = ["Meet Up", "Delivery", "Ship"];

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
            <div className="relative border-b border-[#2B5360]/55 px-4 py-3 sm:px-6 sm:py-6">
              <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,#6FD3F7_1px,transparent_1px),linear-gradient(#6FD3F7_1px,transparent_1px)] [background-size:18px_18px]" />
              <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl border border-[#6FD3F7]/35 bg-[#6FD3F7]/12 text-[#D8FF7A] sm:h-10 sm:w-10 sm:rounded-2xl">
                    <ReceiptText size={17} className="sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#8EA9AF] sm:text-[11px] sm:tracking-[0.3em]">Tom Farm</p>
                    <h2 className="text-lg font-black sm:text-2xl">Ricevuta ordine</h2>
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-center sm:mt-4 sm:gap-2">
                    <div className="rounded-lg border border-[#2B5360]/45 bg-white/7 px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                      <p className="text-[8px] font-black uppercase text-[#8EA9AF] sm:text-[10px]">Righe</p>
                      <p className="text-sm font-black sm:text-base">{items.length}</p>
                    </div>
                    <div className="rounded-lg border border-[#2B5360]/45 bg-white/7 px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                      <p className="text-[8px] font-black uppercase text-[#8EA9AF] sm:text-[10px]">Pacchi</p>
                      <p className="text-sm font-black sm:text-base">{totalPacks}</p>
                    </div>
                    <div className="rounded-lg border border-[#2B5360]/45 bg-white/7 px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                      <p className="text-[8px] font-black uppercase text-[#8EA9AF] sm:text-[10px]">Listino</p>
                      <p className="text-sm font-black sm:text-base">Tom Farm</p>
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
            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
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
                <div className="rounded-[18px] border border-[#2B5360]/55 bg-white/7 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[24px] sm:p-4">
                  <div className="grid grid-cols-[1.5fr_44px_50px_58px_28px] gap-1.5 border-b border-dashed border-[#2B5360]/55 pb-2 text-[8px] font-black uppercase tracking-[0.14em] text-[#8EA9AF] sm:grid-cols-[1.5fr_56px_64px_72px_32px] sm:gap-2 sm:pb-3 sm:text-[10px] sm:tracking-[0.18em]">
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
                          className="grid grid-cols-[1.5fr_44px_50px_58px_28px] items-center gap-1.5 py-2.5 sm:grid-cols-[1.5fr_56px_64px_72px_32px] sm:gap-2 sm:py-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-[#071114] sm:h-12 sm:w-12 sm:rounded-xl">
                                <ImageWithFallback
                                  src={item.product.photoUrl || item.product.image}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover opacity-70 grayscale"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black sm:text-sm">{item.product.name}</p>
                                <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
                                  <button
                                    onClick={() => onUpdateQuantity(item.product.id, item.grams, -1)}
                                  className="grid h-5 w-5 place-items-center rounded-md bg-white/7 hover:bg-white/12 sm:h-6 sm:w-6"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-4 text-center text-xs font-black sm:w-5 sm:text-sm">{item.quantity}</span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.product.id, item.grams, 1)}
                                  className="grid h-5 w-5 place-items-center rounded-md bg-white/7 hover:bg-white/12 sm:h-6 sm:w-6"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-right text-xs font-black sm:text-sm">{option.label}</span>
                          <span className="text-right text-xs font-bold text-[#8EA9AF] sm:text-sm">{option.price}€</span>
                          <span className="text-right text-xs font-black sm:text-sm">{lineTotal}€</span>
                          <button
                            onClick={() => onRemove(item.product.id, item.grams)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-[#8EA9AF] transition-colors hover:bg-[#6FD3F7]/12 hover:text-[#9DEBFF] sm:h-8 sm:w-8"
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
              <div className="space-y-2 border-t border-[#2B5360]/55 bg-[#071114] px-4 py-3 sm:space-y-4 sm:px-6 sm:py-5">
                <div className="space-y-2 rounded-2xl border border-[#2B5360]/55 bg-white/7 p-3 sm:p-4">
                  <div>
                    <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#8EA9AF] sm:mb-2 sm:text-[10px] sm:tracking-[0.18em]">Servizio</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {services.map((item) => (
                        <button
                          key={item}
                          onClick={() => setService(item)}
                          className={`h-8 rounded-xl text-[10px] font-black transition-all sm:h-9 sm:text-[11px] ${
                            service === item
                              ? "bg-[#D8FF7A] text-[#071114]"
                              : "border border-white/10 bg-white/7 text-[#A8B4B7] hover:border-[#6FD3F7]/45 hover:text-[#F5F7EE]"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-[#8EA9AF]">Pacchi totali</span>
                    <span className="font-black">{totalPacks}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-[#8EA9AF]">Listino</span>
                    <span className="font-black">Tom Farm</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-[#2B5360]/55 pt-2 sm:pt-3">
                    <span className="text-base font-black sm:text-lg">Totale ricevuta</span>
                    <span className="text-2xl font-black sm:text-3xl">{total.toFixed(2)}€</span>
                  </div>
                </div>
                <button
                  onClick={() => onCheckout(service)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6FD3F7] py-3 text-sm font-black text-[#071114] transition-all duration-200 hover:bg-[#9DEBFF] active:scale-[0.98] sm:py-4"
                >
                  Invia ricevuta
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded-2xl border border-[#2B5360]/55 py-2.5 text-sm font-bold text-[#8EA9AF] transition-all hover:border-[#6FD3F7]/45 hover:text-[#F5F7EE] sm:py-3"
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
