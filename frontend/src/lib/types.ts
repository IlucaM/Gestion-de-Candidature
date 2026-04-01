export type CandidateStatus =
  | "pending"
  | "reviewing"
  | "validated"
  | "rejected"
  | "archived";

export type UiValidationStatus = "pending" | "valid" | "invalid";

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  resume?: string;
  resumeUrl?: string;
  skills?: string[];
  experience?: number;
  education?: "high_school" | "bachelor" | "master" | "phd" | "other";
  status: CandidateStatus;
  notes?: string;
  validatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiErrorItem {
  path: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ApiErrorItem[];
  pagination?: PaginationMeta;
}

export interface LoginUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponseData {
  token: string;
  user: LoginUser;
}

export interface CandidateListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: CandidateStatus | "";
}

export interface CandidateFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  resume?: string;
  skills: string[];
  experience: number;
  education: "high_school" | "bachelor" | "master" | "phd" | "other";
}

export interface CandidateValidationPayload {
  status: "validated" | "rejected";
  notes?: string;
}

export type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
}
