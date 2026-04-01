import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { api, ApiError, SessionExpiredError } from "../lib/api";
import type { Candidate, CandidateStatus } from "../lib/types";

const cardMotion = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.24, ease: "easeOut" },
  },
};

const sectionMotion = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay, ease: "easeOut" },
  }),
};

function formatDate(input?: string) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function uiValidationStatus(status: CandidateStatus): "pending" | "valid" | "invalid" {
  if (status === "validated") return "valid";
  if (status === "rejected") return "invalid";
  return "pending";
}

export default function CandidateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [candidate, setCandidate] = React.useState<Candidate | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  const [validating, setValidating] = React.useState<boolean>(false);
  const [deleting, setDeleting] = React.useState<boolean>(false);

  const loadCandidate = React.useCallback(async () => {
    if (!id) {
      setError("Identifiant candidat manquant.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await api.candidates.getById(id);
      setCandidate(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error("Votre session a expiré, veuillez vous reconnecter.");
        navigate("/login", { replace: true });
        return;
      }

      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Impossible de charger le candidat.";

      setError(msg);
      toast.error(`Échec du chargement : ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  React.useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  const handleValidate = async (status: "validated" | "rejected") => {
    if (!id) return;

    setValidating(true);
    try {
      await api.candidates.validate(id, { status });
      await loadCandidate();

      if (status === "validated") {
        toast.success("Candidat validé avec succès.");
      } else {
        toast.info("Candidat marqué non validé.");
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error("Votre session a expiré, veuillez vous reconnecter.");
        navigate("/login", { replace: true });
        return;
      }

      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erreur de validation.";

      toast.error(`Échec de la validation : ${msg}`);
    } finally {
      setValidating(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!id || deleting) return;
    const confirmed = window.confirm(
      "Confirmer la suppression logique de ce candidat ?",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.candidates.remove(id);
      toast.success("Candidat supprimé (soft delete).");
      navigate("/candidates");
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error("Votre session a expiré, veuillez vous reconnecter.");
        navigate("/login", { replace: true });
        return;
      }

      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erreur de suppression.";
      toast.error(`Échec de la suppression : ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.section
      className="stack-lg"
      variants={cardMotion}
      initial="hidden"
      animate="visible"
      aria-label="Détail candidat"
    >
      <div className="button-row" style={{ justifyContent: "space-between" }}>
        <button
          type="button"
          className="button-secondary"
          onClick={() => navigate("/candidates")}
        >
          ← Retour à la liste
        </button>

        {candidate ? (
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate(`/candidates/${candidate._id}/edit`)}
          >
            Modifier
          </button>
        ) : null}
      </div>

      {loading ? (
        <section className="card stack" aria-busy="true">
          <Spinner label="Chargement du candidat..." />
        </section>
      ) : error ? (
        <section className="card stack">
          <h1 className="title">Erreur</h1>
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        </section>
      ) : !candidate ? (
        <section className="card stack">
          <h1 className="title">Candidat introuvable</h1>
          <p className="subtitle">Le candidat demandé n’existe pas.</p>
        </section>
      ) : (
        <>
          <motion.section
            className="card stack"
            custom={0.02}
            variants={sectionMotion}
            initial="hidden"
            animate="visible"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1 className="title" style={{ marginBottom: 4 }}>
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p className="subtitle" style={{ marginTop: 0 }}>
                  {candidate.email}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <StatusBadge status={candidate.status} />
                <StatusBadge status={uiValidationStatus(candidate.status)} withDot={false} />
              </div>
            </div>

            <dl className="kv">
              <dt>Téléphone</dt>
              <dd>{candidate.phone || "—"}</dd>

              <dt>Date de naissance</dt>
              <dd>{formatDate(candidate.birthDate)}</dd>

              <dt>Créé le</dt>
              <dd>{formatDate(candidate.createdAt)}</dd>

              <dt>Mis à jour le</dt>
              <dd>{formatDate(candidate.updatedAt)}</dd>

              <dt>Date validation</dt>
              <dd>{formatDate(candidate.validatedAt)}</dd>

              <dt>CV</dt>
              <dd>
                {candidate.resume || candidate.resumeUrl ? (
                  <span style={{ wordBreak: "break-all" }}>
                    {candidate.resume || candidate.resumeUrl}
                  </span>
                ) : (
                  "—"
                )}
              </dd>

              <dt>Notes</dt>
              <dd>{candidate.notes || "—"}</dd>
            </dl>
          </motion.section>

          <motion.section
            className="card stack"
            custom={0.06}
            variants={sectionMotion}
            initial="hidden"
            animate="visible"
          >
            <h2 className="title" style={{ fontSize: "1.2rem" }}>
              Actions de validation
            </h2>
            <p className="subtitle">
              L’API de validation simule un délai de 2 secondes.
            </p>

            <div className="button-row">
              <motion.button
                type="button"
                onClick={() => handleValidate("validated")}
                disabled={validating || deleting}
                whileTap={{ scale: 0.98 }}
                whileHover={validating ? {} : { y: -1 }}
                aria-busy={validating}
              >
                {validating ? "Validation en cours..." : "Valider"}
              </motion.button>

              <motion.button
                type="button"
                className="button-secondary"
                onClick={() => handleValidate("rejected")}
                disabled={validating || deleting}
                whileTap={{ scale: 0.98 }}
                whileHover={validating ? {} : { y: -1 }}
                aria-busy={validating}
              >
                {validating ? "Validation en cours..." : "Marquer non validé"}
              </motion.button>

              <motion.button
                type="button"
                className="button-danger"
                onClick={handleSoftDelete}
                disabled={deleting || validating}
                whileTap={{ scale: 0.98 }}
                whileHover={deleting ? {} : { y: -1 }}
                aria-busy={deleting}
              >
                {deleting ? "Suppression..." : "Supprimer (soft delete)"}
              </motion.button>
            </div>
          </motion.section>
        </>
      )}
    </motion.section>
  );
}
