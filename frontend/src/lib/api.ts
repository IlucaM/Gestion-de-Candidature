import type {
  ApiErrorItem,
  ApiResponse,
  Candidate,
  CandidateFormValues,
  CandidateListFilters,
  CandidateStatus,
  CandidateValidationPayload,
  LoginResponseData,
  PaginationMeta,
} from "./types";

function resolveApiBase(): string {
  // Vite remplace import.meta.env.VITE_API_URL au moment du build (production)
  const fromVite = import.meta.env.VITE_API_URL;

  return fromVite || "http://localhost:3001/api";
}

const API_BASE = resolveApiBase();

const TOKEN_KEY = "test24h_token";

export class ApiError extends Error {
  status?: number;
  details?: ApiErrorItem[];

  constructor(
    message: string,
    options?: { status?: number; details?: ApiErrorItem[] },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.details = options?.details;
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = "Votre session a expiré, veuillez vous reconnecter.") {
    super(message, { status: 401 });
    this.name = "SessionExpiredError";
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function parseApiErrorBody(body: unknown): {
  message: string;
  details?: ApiErrorItem[];
} {
  if (!body || typeof body !== "object") {
    return { message: "Erreur API" };
  }

  const b = body as Record<string, unknown>;
  const message =
    typeof b.message === "string" && b.message.trim()
      ? b.message
      : "Erreur API";

  const details = Array.isArray(b.errors)
    ? (b.errors.filter(
        (e): e is ApiErrorItem =>
          !!e &&
          typeof e === "object" &&
          typeof (e as Record<string, unknown>).path === "string" &&
          typeof (e as Record<string, unknown>).message === "string",
      ) as ApiErrorItem[])
    : undefined;

  return { message, details };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers ?? {});

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401) {
    clearToken();
    throw new SessionExpiredError();
  }

  const { message, details } = parseApiErrorBody(body);

  const declaredFailure =
    body &&
    typeof body === "object" &&
    "success" in body &&
    (body as Record<string, unknown>).success === false;

  if (!response.ok || declaredFailure) {
    throw new ApiError(message, {
      status: response.status,
      details,
    });
  }

  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiResponse<T>).data as T;
  }

  return body as T;
}

async function requestJsonWithMeta<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; pagination?: PaginationMeta; message?: string }> {
  const token = getToken();
  const headers = new Headers(init?.headers ?? {});

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401) {
    clearToken();
    throw new SessionExpiredError();
  }

  const { message, details } = parseApiErrorBody(body);

  const declaredFailure =
    body &&
    typeof body === "object" &&
    "success" in body &&
    (body as Record<string, unknown>).success === false;

  if (!response.ok || declaredFailure) {
    throw new ApiError(message, {
      status: response.status,
      details,
    });
  }

  if (body && typeof body === "object" && "data" in body) {
    const typed = body as ApiResponse<T>;
    return {
      data: typed.data as T,
      pagination: typed.pagination,
      message: typed.message,
    };
  }

  return { data: body as T };
}

function buildCandidatesQuery(filters: CandidateListFilters): string {
  const params = new URLSearchParams();

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return `?${params.toString()}`;
}

export const api = {
  auth: {
    async login(payload: {
      email: string;
      password: string;
    }): Promise<LoginResponseData> {
      const result = await requestJson<LoginResponseData>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!result?.token) {
        throw new ApiError("Réponse login invalide: token manquant.");
      }

      setToken(result.token);
      return result;
    },

    logout(): void {
      clearToken();
    },
  },

  candidates: {
    async list(filters: CandidateListFilters): Promise<{
      data: Candidate[];
      pagination?: PaginationMeta;
      message?: string;
    }> {
      const query = buildCandidatesQuery(filters);
      return requestJsonWithMeta<Candidate[]>(`/candidates${query}`);
    },

    async getById(id: string): Promise<Candidate> {
      return requestJson<Candidate>(`/candidates/${id}`);
    },

    async create(payload: CandidateFormValues): Promise<Candidate> {
      return requestJson<Candidate>("/candidates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async update(id: string, payload: CandidateFormValues): Promise<Candidate> {
      return requestJson<Candidate>(`/candidates/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    async remove(id: string): Promise<Candidate> {
      return requestJson<Candidate>(`/candidates/${id}`, {
        method: "DELETE",
      });
    },

    async validate(
      id: string,
      payload: CandidateValidationPayload,
    ): Promise<Candidate> {
      return requestJson<Candidate>(`/candidates/${id}/validate`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },

  health: {
    async check(): Promise<{
      success: boolean;
      message: string;
      timestamp: string;
      version: string;
    }> {
      const healthUrl = API_BASE.replace(/\/api\/?$/, "/health");
      const response = await fetch(healthUrl, { method: "GET" });

      if (!response.ok) {
        throw new ApiError(`Health check failed (${response.status})`, {
          status: response.status,
        });
      }

      return (await response.json()) as {
        success: boolean;
        message: string;
        timestamp: string;
        version: string;
      };
    },
  },

  utils: {
    mapStatusForValidation(status: "valid" | "invalid"): CandidateStatus {
      return status === "valid" ? "validated" : "rejected";
    },
  },
};

export default api;
