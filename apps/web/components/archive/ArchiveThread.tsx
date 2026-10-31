"use client";

import { motion } from "framer-motion";
import type { ArchiveThreadProps } from "./types";

export default function ArchiveThread({ items }: ArchiveThreadProps) {
  return (
    <div className="moment-thread">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
          className="moment-row"
          data-side={index % 2 === 0 ? "left" : "right"}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}
