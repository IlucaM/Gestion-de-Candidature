import React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";

import Spinner from "../components/Spinner";
import { api, ApiError, SessionExpiredError } from "../lib/api";
import type { Candidate, CandidateListFilters, CandidateStatus, PaginationMeta } from "../lib/types";

const PAGE_SIZE = 10;

const statusOptions: Array<{ label: string; value: CandidateStatus | "" }> = [
  { label: "Tous", value: "" },
  { label: "En cours", value: "pending" },
  { label: "En revue", value: "reviewing" },
  { label: "Validé", value: "validated" },
  { label: "Non validé", value: "rejected" },
  { label: "Archivé", value: "archived" },
];

const statusBadgeStyle: Record<CandidateStatus, React.CSSProperties> = {
  pending: { background: "#fef3c7", color: "#92400e" },
  reviewing: { background: "#dbeafe", color: "#1e40af" },
  validated: { background: "#dcfce7", color: "#166534" },
  rejected: { background: "#fee2e2", color: "#991b1b" },
  archived: { background: "#e5e7eb", color: "#374151" },
};

function statusLabel(status: CandidateStatus) {
  switch (status) {
    case "pending":
      return "En cours";
    case "reviewing":
      return "En revue";
    case "validated":
      return "Validé";
    case "rejected":
      return "Non validé";
    case "archived":
      return "Archivé";
    default:
      return status;
  }
}

function buildDefaultPagination(): PaginationMeta {
  return {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
}

export default function CandidateListPage() {
  const navigate = useNavigate();

  const [items, setItems] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");

  const [searchInput, setSearchInput] = React.useState<string>("");
  const [filters, setFilters] = React.useState<CandidateListFilters>({
    page: 1,
    limit: PAGE_SIZE,
    search: "",
    status: "",
  });

  const [pagination, setPagination] = React.useState<PaginationMeta>(buildDefaultPagination());

  const loadCandidates = React.useCallback(
    async (nextFilters: CandidateListFilters) => {
      setLoading(true);
      setError("");

      try {
        const response = await api.candidates.list(nextFilters);

        setItems(response.data ?? []);
        setPagination(response.pagination ?? { ...buildDefaultPagination(), page: nextFilters.page });

        if ((response.data ?? []).length === 0) {
          toast.info("Aucun candidat trouvé avec ces filtres.");
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
              : "Erreur lors du chargement des candidats.";

        setError(msg);
        toast.error(`Échec du chargement : ${msg}`);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  React.useEffect(() => {
    loadCandidates(filters);
  }, [filters, loadCandidates]);

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchInput.trim(),
    }));
  };

  const onStatusChange = (value: CandidateStatus | "") => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: value,
    }));
  };

  const goToPreviousPage = () => {
    if (!pagination.hasPrevPage) return;
    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  };

  const goToNextPage = () => {
    if (!pagination.hasNextPage) return;
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  return (
    <section className="stack-lg" aria-label="Page liste des candidats">
      <div className="card stack">
        <div>
          <h1 className="title">Candidats</h1>
          <p className="subtitle">Liste complète avec filtres, pagination et statut de validation.</p>
        </div>

        <div className="button-row" style={{ alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label htmlFor="candidate-search">Recherche (nom/email)</label>
            <input
              id="candidate-search"
              aria-label="Recherche nom ou email"
              placeholder="Ex: john@doe.com"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>

          <div style={{ minWidth: 220 }}>
            <label htmlFor="candidate-status-filter">Filtre statut</label>
            <select
              id="candidate-status-filter"
              aria-label="Filtre statut de validation"
              value={filters.status ?? ""}
              onChange={(e) => onStatusChange(e.target.value as CandidateStatus | "")}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="button-secondary" onClick={applyFilters}>
            Filtrer
          </button>

          <button type="button" onClick={() => navigate("/candidates/new")}>
            Nouveau candidat
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "1.25rem 0" }}>
            <Spinner label="Chargement des candidats..." />
          </div>
        ) : error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : items.length === 0 ? (
          <p className="muted" aria-live="polite">
            Aucun candidat trouvé.
          </p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="table" aria-label="Liste des candidats">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th style={{ width: 160 }}>Action</th>
                  </tr>
                </thead>

                <AnimatePresence mode="popLayout">
                  <motion.tbody layout>
                    {items.map((candidate, index) => (
                      <motion.tr
                        key={candidate._id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        style={{ background: "#fff" }}
                      >
                        <td>
                          {candidate.firstName} {candidate.lastName}
                        </td>
                        <td>{candidate.email}</td>
                        <td>
                          <span
                            style={{
                              ...statusBadgeStyle[candidate.status],
                              display: "inline-block",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              borderRadius: 999,
                              padding: "0.18rem 0.55rem",
                            }}
                          >
                            {statusLabel(candidate.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => navigate(`/candidates/${candidate._id}`)}
                            aria-label={`Voir le détail de ${candidate.firstName} ${candidate.lastName}`}
                          >
                            Voir détail
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>

            <div
              className="button-row"
              style={{ marginTop: 12, justifyContent: "space-between", alignItems: "center" }}
            >
              <div className="button-row">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={!pagination.hasPrevPage}
                  onClick={goToPreviousPage}
                >
                  Précédent
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={!pagination.hasNextPage}
                  onClick={goToNextPage}
                >
                  Suivant
                </button>
              </div>

              <span className="muted" aria-live="polite">
                Page {pagination.page} / {Math.max(1, pagination.totalPages)} — {pagination.total} résultat(s)
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
