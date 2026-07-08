"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    question: "How does instant booking work?",
    answer:
      "Once you find a bike, reserve it directly through the platform — no waiting for a provider to confirm.",
  },
  {
    question: "What documents do I need to rent a bike?",
    answer: "A valid driving license and a government ID are required at pickup.",
  },
  {
    question: "Is insurance included?",
    answer: "Every booking includes basic insurance coverage; extended coverage is available.",
  },
  {
    question: "Can I list my own bike?",
    answer: "Yes — enable Partner Mode from your account to list bikes and manage bookings.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-foreground/10 rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question} className="px-6">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between py-5 text-left text-sm font-medium"
            >
              {faq.question}
              <span className={`transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 text-sm text-foreground/60">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
