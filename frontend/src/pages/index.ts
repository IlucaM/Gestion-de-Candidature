export { default as LoginPage } from "./LoginPage";
export { default as CandidateListPage } from "./CandidateListPage";
export { default as CandidateDetailPage } from "./CandidateDetailPage";
export { default as CandidateFormPage } from "./CandidateFormPage";

/**
 * Placeholder for future page-level modules.
 * This index keeps imports stable for tooling and incremental extensions.
 */
export const PAGE_MODULES = {
  login: "LoginPage",
  candidatesList: "CandidateListPage",
  candidateDetail: "CandidateDetailPage",
  candidateForm: "CandidateFormPage",
} as const;

export type PageModuleKey = keyof typeof PAGE_MODULES;
