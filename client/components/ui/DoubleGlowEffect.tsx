import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

export default function DoubleGlowEffect() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 blur-[100px]"
        animate={{
          background: `radial-gradient(600px at ${cursorPos.x}px ${cursorPos.y}px, rgba(159, 122, 234, 0.15) 0%, transparent 80%)`,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      />
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 blur-[60px]"
        animate={{
          background: `radial-gradient(400px at ${cursorPos.x}px ${cursorPos.y}px, rgba(236, 72, 153, 0.1) 0%, transparent 80%)`,
        }}
        transition={{ type: "tween", duration: 0.2 }}
      />
    </>
  );
}
