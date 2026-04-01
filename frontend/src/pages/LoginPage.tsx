import React from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import { api, ApiError, SessionExpiredError } from "../lib/api";

type LoginFormValues = {
  email: string;
  password: string;
};

type LoginPageProps = {
  onLoginSuccess: () => void;
};

const containerVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, delay, ease: "easeOut" },
  }),
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [apiError, setApiError] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "admin@test24h.com",
      password: "password",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError("");

    try {
      await api.auth.login({
        email: values.email.trim(),
        password: values.password,
      });

      toast.success("Connexion réussie.");
      onLoginSuccess();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        setApiError("Votre session a expiré, veuillez vous reconnecter.");
        return;
      }

      if (error instanceof ApiError) {
        setApiError(error.message || "Email ou mot de passe incorrect.");
        return;
      }

      setApiError("Impossible de se connecter pour le moment.");
    }
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 2rem)",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <motion.section
        className="card stack"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 16,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.98) 100%)",
          boxShadow: "0 20px 50px rgba(15,23,42,0.15)",
          border: "1px solid rgba(148,163,184,0.22)",
        }}
        aria-labelledby="login-title"
      >
        <motion.div
          custom={0.02}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="stack"
          style={{ gap: 6 }}
        >
          <h1 id="login-title" className="title" style={{ marginBottom: 0 }}>
            Connexion
          </h1>
          <p className="subtitle" style={{ marginTop: 0 }}>
            Accédez à l’interface de gestion des candidats.
          </p>
        </motion.div>

        {apiError ? (
          <motion.div
            custom={0.06}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="alert alert-error"
            role="alert"
            aria-live="assertive"
          >
            {apiError}
          </motion.div>
        ) : null}

        <motion.form
          custom={0.1}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="form"
          aria-busy={isSubmitting}
        >
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              aria-label="Email"
              aria-invalid={errors.email ? "true" : "false"}
              placeholder="vous@entreprise.com"
              {...register("email", {
                required: "L'email est requis.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Format d'email invalide.",
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

          <div className="form-row">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              aria-label="Mot de passe"
              aria-invalid={errors.password ? "true" : "false"}
              placeholder="••••••••"
              {...register("password", {
                required: "Le mot de passe est requis.",
                minLength: {
                  value: 3,
                  message: "Le mot de passe est trop court.",
                },
              })}
            />
            {errors.password ? (
              <span
                role="alert"
                style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
              >
                {errors.password.message}
              </span>
            ) : null}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            whileHover={isSubmitting ? {} : { y: -1 }}
            style={{
              marginTop: 4,
              background:
                "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(14,116,144,1) 100%)",
              boxShadow: "0 10px 22px rgba(37,99,235,0.32)",
            }}
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </motion.button>
        </motion.form>

        <motion.p
          custom={0.14}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="muted"
          style={{ margin: 0, fontSize: 13 }}
        >
          Compte de test: <strong>admin@test24h.com</strong> /{" "}
          <strong>password</strong>
        </motion.p>
      </motion.section>
    </main>
  );
}
