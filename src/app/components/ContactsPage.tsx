import { ExternalLink, Instagram, MessageCircle, Send, Users } from "lucide-react";
import { motion } from "motion/react";
import type { ContactItem } from "../App";

const iconMap = {
  telegram: Send,
  instagram: Instagram,
  group: Users,
  viber: MessageCircle,
  default: MessageCircle,
};

export function ContactsPage({ contacts }: { contacts: ContactItem[] }) {
  return (
    <div className="min-h-full px-4 pb-8 pt-24 text-[#F5F7EE]">
      <div className="relative mx-auto max-w-[820px]">
        <section className="overflow-hidden rounded-[24px] border border-[#2B5360]/55 bg-[#0B0F12]/90 shadow-[0_22px_70px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
          <div className="relative px-5 pb-6 pt-6 sm:px-6">
            <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#D8FF7A_1px,transparent_1px)] [background-size:100%_4px]" />
            <div className="relative">
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#9DEBFF]">
                  Tom Farm
                </p>
                <h1 className="text-2xl font-black leading-none text-[#F5F7EE] sm:text-3xl">
                  Contatti
                </h1>
                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#A8B4B7]">
                  Scegli il canale più comodo per contattarci o seguire gli aggiornamenti.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {contacts.map((contact, index) => {
                  const Icon = iconMap[contact.type as keyof typeof iconMap] ?? iconMap.default;
                  return (
                    <motion.a
                      key={contact.href}
                      href={contact.href}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.22 }}
                      className="group relative overflow-hidden rounded-[18px] border border-[#2B5360]/55 bg-[#071114]/72 p-4 transition-all hover:border-[#6FD3F7]/60 hover:bg-white/7"
                    >
                      <div
                        className="absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-15 blur-2xl"
                        style={{ backgroundColor: contact.accent }}
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl border bg-white/7"
                            style={{ borderColor: `${contact.accent}66`, color: contact.accent }}
                          >
                            <Icon size={18} strokeWidth={2.4} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8EA9AF]">
                              {contact.title}
                            </p>
                            <p className="mt-1 truncate text-sm font-black text-[#F5F7EE]">
                              {contact.label}
                            </p>
                            <p className="mt-1 truncate text-[10px] font-bold text-[#6FD3F7]">
                              {contact.href.replace(/^https?:\/\//, "")}
                            </p>
                          </div>
                        </div>
                        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white/7 text-[#A8B4B7] transition group-hover:bg-[#6FD3F7] group-hover:text-[#071114]">
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
