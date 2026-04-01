import React, { useEffect, useId, useRef } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = 720,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocusRef,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // Lock body scroll + save/restore focus
  useEffect(() => {
    if (!open) return;

    lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget =
      initialFocusRef?.current ||
      (contentRef.current?.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null) ||
      dialogRef.current;

    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      lastFocusedElementRef.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  // Escape handling + focus trap
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const container = contentRef.current;
      if (!container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusables.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, closeOnEscape]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (!closeOnOverlayClick) return;
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(2px)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          maxHeight: "90vh",
          overflow: "auto",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 24px 48px rgba(2, 6, 23, 0.25)",
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: "1rem 1rem 0.875rem",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.9rem",
            }}
          >
            <h2
              id={titleId}
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              style={{
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#0f172a",
                borderRadius: "10px",
                padding: "0.45rem 0.65rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Fermer
            </button>
          </header>

          <div>{children}</div>

          {footer ? (
            <footer
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
