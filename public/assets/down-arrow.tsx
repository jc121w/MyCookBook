"use client";

import { motion } from "framer-motion";

export const DownArrow = () => {
  const downButtonVariants = {
    animateDown: {
      y: 70,
      opacity: [0, 0.1, 0.3, 0.5, 0.7, 1, 1, 0],

      transition: {
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.9, 1],
        duration: 2,
      },
      initial: { y: 0, opacity: 0 },
    },
  };
  return (
    <motion.div
      variants={downButtonVariants}
      initial="initial"
      animate="animateDown"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-circle-chevron-down"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m16 10-4 4-4-4" />
      </svg>
    </motion.div>
  );
};
