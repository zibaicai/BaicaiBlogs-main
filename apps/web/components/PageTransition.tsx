"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}