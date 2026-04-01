import { motion } from "framer-motion";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  /**
   * Tailwind-like semantic size
   */
  size?: SpinnerSize;
  /**
   * Optional label shown under spinner
   */
  label?: string;
  /**
   * Whether to center in parent
   */
  centered?: boolean;
  /**
   * Accessible live region mode
   */
  live?: "polite" | "assertive" | "off";
  /**
   * Additional className for wrapper
   */
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 24,
  md: 36,
  lg: 52,
};

export default function Spinner({
  size = "md",
  label = "Chargement...",
  centered = true,
  live = "polite",
  className = "",
}: SpinnerProps) {
  const px = sizeMap[size];
  const stroke = Math.max(3, Math.round(px / 10));

  return (
    <div
      className={className}
      role="status"
      aria-live={live}
      aria-busy="true"
      style={{
        display: "grid",
        placeItems: centered ? "center" : "start",
        gap: 10,
      }}
    >
      <motion.div
        aria-hidden="true"
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          border: `${stroke}px solid rgba(37, 99, 235, 0.18)`,
          borderTopColor: "rgba(37, 99, 235, 1)",
          borderRightColor: "rgba(14, 165, 233, 0.95)",
          boxShadow: "0 6px 24px rgba(37, 99, 235, 0.18)",
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0))",
        }}
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          duration: 0.85,
        }}
      />

      {label ? (
        <motion.span
          style={{
            fontSize: 14,
            color: "#475569",
            fontWeight: 500,
            letterSpacing: 0.2,
          }}
          initial={{ opacity: 0.4, y: 2 }}
          animate={{ opacity: [0.5, 1, 0.5], y: [2, 0, 2] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {label}
        </motion.span>
      ) : (
        <span className="sr-only">Chargement</span>
      )}
    </div>
  );
}
