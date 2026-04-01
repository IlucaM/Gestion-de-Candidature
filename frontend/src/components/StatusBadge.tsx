import type { CandidateStatus, UiValidationStatus } from "../lib/types";

type StatusBadgeProps = {
  status: CandidateStatus | UiValidationStatus;
  className?: string;
  withDot?: boolean;
};

type BadgeConfig = {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const STATUS_CONFIG: Record<CandidateStatus | UiValidationStatus, BadgeConfig> =
  {
    pending: {
      label: "En cours",
      bg: "#FEF3C7",
      text: "#92400E",
      border: "#FCD34D",
      dot: "#D97706",
    },
    reviewing: {
      label: "En revue",
      bg: "#DBEAFE",
      text: "#1E40AF",
      border: "#93C5FD",
      dot: "#2563EB",
    },
    validated: {
      label: "Validé",
      bg: "#DCFCE7",
      text: "#166534",
      border: "#86EFAC",
      dot: "#16A34A",
    },
    rejected: {
      label: "Non validé",
      bg: "#FEE2E2",
      text: "#991B1B",
      border: "#FCA5A5",
      dot: "#DC2626",
    },
    archived: {
      label: "Archivé",
      bg: "#E5E7EB",
      text: "#374151",
      border: "#D1D5DB",
      dot: "#6B7280",
    },
    valid: {
      label: "Validé",
      bg: "#DCFCE7",
      text: "#166534",
      border: "#86EFAC",
      dot: "#16A34A",
    },
    invalid: {
      label: "Non validé",
      bg: "#FEE2E2",
      text: "#991B1B",
      border: "#FCA5A5",
      dot: "#DC2626",
    },
  };

export default function StatusBadge({
  status,
  className = "",
  withDot = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={className}
      aria-label={`Statut: ${config.label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: withDot ? 6 : 0,
        padding: "0.2rem 0.55rem",
        borderRadius: 999,
        fontSize: "0.78rem",
        fontWeight: 700,
        letterSpacing: "0.01em",
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: config.dot,
            boxShadow: `0 0 0 2px ${config.bg}`,
          }}
        />
      ) : null}
      {config.label}
    </span>
  );
}
