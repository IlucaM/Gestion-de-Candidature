import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import Spinner from "../components/Spinner";
import { api, ApiError, SessionExpiredError } from "../lib/api";
import type { CandidateFormValues } from "../lib/types";

type CandidateFormPageProps = {
  mode: "create" | "edit";
};

const formCardMotion = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const defaultValues: CandidateFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  resume: "",
  skills: [],
  experience: 0,
  education: "other",
};

function parseSkillsInput(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toSkillsInput(skills?: string[]): string {
  if (!skills || skills.length === 0) return "";
  return skills.join(", ");
}

export default function CandidateFormPage({ mode }: CandidateFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEdit = mode === "edit";

  const [pageLoading, setPageLoading] = React.useState<boolean>(isEdit);
  const [pageError, setPageError] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CandidateFormValues & { skillsInput?: string }>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultValues,
      skillsInput: "",
    },
  });

  React.useEffect(() => {
    if (!isEdit || !id) return;

    let cancelled = false;

    const loadCandidate = async () => {
      setPageLoading(true);
      setPageError("");

      try {
        const candidate = await api.candidates.getById(id);
        if (cancelled) return;

        reset({
          firstName: candidate.firstName ?? "",
          lastName: candidate.lastName ?? "",
          email: candidate.email ?? "",
          phone: candidate.phone ?? "",
          birthDate: candidate.birthDate
            ? candidate.birthDate.slice(0, 10)
            : "",
          resume: candidate.resume || candidate.resumeUrl || "",
          skills: candidate.skills ?? [],
          skillsInput: toSkillsInput(candidate.skills),
          experience: candidate.experience ?? 0,
          education: candidate.education ?? "other",
        });
      } catch (error) {
        if (cancelled) return;

        if (error instanceof SessionExpiredError) {
          toast.error("Votre session a expiré, veuillez vous reconnecter.");
          navigate("/login", { replace: true });
          return;
        }

        const msg =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Impossible de charger le candidat.";
        setPageError(msg);
        toast.error(`Échec du chargement : ${msg}`);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };

    loadCandidate();

    return () => {
      cancelled = true;
    };
  }, [isEdit, id, navigate, reset]);

  const onSubmit = async (
    values: CandidateFormValues & { skillsInput?: string },
  ) => {
    const payload: CandidateFormValues = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone?.trim() || "",
      birthDate: values.birthDate || "",
      resume: values.resume?.trim() || "",
      skills: parseSkillsInput(values.skillsInput),
      experience: Number(values.experience) || 0,
      education: values.education,
    };

    try {
      if (isEdit) {
        if (!id) throw new Error("Identifiant candidat manquant.");
        await api.candidates.update(id, payload);
        toast.success("Candidat mis à jour avec succès !");
        navigate(`/candidates/${id}`);
      } else {
        await api.candidates.create(payload);
        toast.success("Candidat créé avec succès !");
        navigate("/candidates");
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        toast.error("Votre session a expiré, veuillez vous reconnecter.");
        navigate("/login", { replace: true });
        return;
      }

      if (error instanceof ApiError) {
        const details = error.details
          ?.map((d) => `• ${d.path}: ${d.message}`)
          .join("\n");
        toast.error(
          details
            ? `${error.message}\n${details}`
            : error.message || "Échec de la sauvegarde du candidat.",
        );
        return;
      }

      const msg =
        error instanceof Error
          ? error.message
          : "Échec de la sauvegarde du candidat.";
      toast.error(msg);
    }
  };

  if (pageLoading) {
    return (
      <section className="card stack">
        <Spinner label="Chargement du formulaire..." />
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="card stack">
        <h1 className="title">Erreur</h1>
        <div className="alert alert-error" role="alert">
          {pageError}
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate("/candidates")}
          >
            Retour à la liste
          </button>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      className={`card stack ${!isEdit ? "candidate-form-compact" : ""}`}
      variants={formCardMotion}
      initial="hidden"
      animate="visible"
      aria-labelledby="candidate-form-title"
    >
      <h1 id="candidate-form-title" className="title">
        {isEdit ? "Modifier le candidat" : "Créer un candidat"}
      </h1>
      <p className="subtitle">
        {isEdit
          ? "Mettez à jour les informations du candidat."
          : "Renseignez les informations pour créer un nouveau candidat."}
      </p>

      <form
        className={`form ${!isEdit ? "candidate-form-compact-form" : ""}`}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-busy={isSubmitting}
      >
        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="firstName">Prénom *</label>
          <input
            id="firstName"
            aria-label="Prénom"
            aria-invalid={errors.firstName ? "true" : "false"}
            {...register("firstName", {
              required: "Le prénom est requis.",
              minLength: { value: 1, message: "Le prénom est requis." },
              maxLength: { value: 50, message: "Maximum 50 caractères." },
            })}
          />
          {errors.firstName ? (
            <span
              role="alert"
              style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
            >
              {errors.firstName.message}
            </span>
          ) : null}
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="lastName">Nom *</label>
          <input
            id="lastName"
            aria-label="Nom"
            aria-invalid={errors.lastName ? "true" : "false"}
            {...register("lastName", {
              required: "Le nom est requis.",
              minLength: { value: 1, message: "Le nom est requis." },
              maxLength: { value: 50, message: "Maximum 50 caractères." },
            })}
          />
          {errors.lastName ? (
            <span
              role="alert"
              style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
            >
              {errors.lastName.message}
            </span>
          ) : null}
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            aria-label="Email candidat"
            aria-invalid={errors.email ? "true" : "false"}
            {...register("email", {
              required: "L'email est requis.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Format email invalide.",
              },
            })}
          />
          {errors.email ? (
            <span
              role="alert"
              style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
            >
              {errors.email.message}
            </span>
          ) : null}
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="phone">Téléphone (optionnel)</label>
          <input
            id="phone"
            aria-label="Téléphone"
            {...register("phone", {
              pattern: {
                value: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                message: "Format téléphone invalide.",
              },
            })}
          />
          {errors.phone ? (
            <span
              role="alert"
              style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
            >
              {errors.phone.message}
            </span>
          ) : null}
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="birthDate">Date de naissance</label>
          <input
            id="birthDate"
            type="date"
            aria-label="Date de naissance"
            {...register("birthDate")}
          />
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="resume">CV (URL ou base64)</label>
          <textarea
            id="resume"
            rows={3}
            aria-label="CV"
            placeholder="https://... ou data:application/pdf;base64,..."
            {...register("resume")}
          />
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="skillsInput">
            Compétences (séparées par des virgules)
          </label>
          <input
            id="skillsInput"
            aria-label="Compétences"
            placeholder="React, TypeScript, Node.js"
            {...register("skillsInput")}
            onBlur={(e) => {
              const parsed = parseSkillsInput(e.target.value);
              setValue("skills", parsed);
            }}
          />
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="experience">Expérience (années)</label>
          <input
            id="experience"
            type="number"
            min={0}
            max={50}
            step={1}
            aria-label="Expérience"
            {...register("experience", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimum 0." },
              max: { value: 50, message: "Maximum 50." },
            })}
          />
          {errors.experience ? (
            <span
              role="alert"
              style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
            >
              {errors.experience.message}
            </span>
          ) : null}
        </div>

        <div
          className={`form-row ${!isEdit ? "candidate-form-compact-row" : ""}`}
        >
          <label htmlFor="education">Niveau d'étude</label>
          <select
            id="education"
            aria-label="Niveau d'étude"
            {...register("education")}
          >
            <option value="other">Autre</option>
            <option value="high_school">Lycée</option>
            <option value="bachelor">Bachelor</option>
            <option value="master">Master</option>
            <option value="phd">Doctorat</option>
          </select>
        </div>

        <div
          className={`button-row ${!isEdit ? "candidate-form-compact-actions" : ""}`}
        >
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting
              ? isEdit
                ? "Mise à jour..."
                : "Création..."
              : isEdit
                ? "Enregistrer"
                : "Créer"}
          </motion.button>

          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Annuler
          </button>
        </div>
      </form>

      {!isEdit ? (
        <style>{`
          .candidate-form-compact {
            max-width: 780px;
            margin: 0 auto;
            padding: 0.85rem;
          }
          .candidate-form-compact-form {
            gap: 0.65rem;
          }
          .candidate-form-compact-row {
            gap: 0.22rem;
          }
          .candidate-form-compact-row label {
            font-size: 0.84rem;
          }
          .candidate-form-compact-row input,
          .candidate-form-compact-row select,
          .candidate-form-compact-row textarea {
            padding: 0.54rem 0.62rem;
            font-size: 0.9rem;
          }
          .candidate-form-compact-actions {
            margin-top: 0.2rem;
          }
          @media (max-width: 640px) {
            .candidate-form-compact {
              max-width: 100%;
              padding: 0.72rem;
            }
          }
        `}</style>
      ) : null}
    </motion.section>
  );
}
