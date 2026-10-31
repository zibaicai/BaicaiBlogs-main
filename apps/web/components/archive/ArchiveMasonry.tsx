"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ArchiveMasonryProps } from "./types";

export default function ArchiveMasonry({ items, masonryColumns = 4 }: ArchiveMasonryProps) {
  const [columnCount, setColumnCount] = useState(masonryColumns);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth <= 640) setColumnCount(1);
      else if (window.innerWidth <= 900) setColumnCount(Math.min(2, masonryColumns));
      else setColumnCount(masonryColumns);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [masonryColumns]);

  const columns: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => columns[index % columnCount].push(item));

  return (
    <div className="archive-masonry">
      {columns.map((column, columnIndex) => (
        <div className="archive-masonry-column" key={columnIndex}>
          {column.map((item, index) => (
            <motion.div
              key={`${columnIndex}-${index}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.3, delay: Math.min(index, 5) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}
