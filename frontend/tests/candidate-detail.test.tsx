import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CandidateDetailPage from "../src/pages/CandidateDetailPage";
import { api } from "../src/lib/api";

jest.mock("../src/lib/api", () => ({
  api: {
    candidates: {
      getById: jest.fn(),
      validate: jest.fn(),
      remove: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
  SessionExpiredError: class SessionExpiredError extends Error {},
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("CandidateDetailPage behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/candidates/abc123"]}>
        <Routes>
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/candidates/:id/edit" element={<div>edit page</div>} />
          <Route path="/candidates" element={<div>list page</div>} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("shows loading first, then candidate details and actions", async () => {
    (api.candidates.getById as jest.Mock).mockResolvedValue({
      _id: "abc123",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@test.com",
      status: "pending",
      phone: "0601020304",
      birthDate: "1995-08-20T00:00:00.000Z",
      createdAt: "2025-01-10T12:00:00.000Z",
      updatedAt: "2025-01-12T12:00:00.000Z",
    });

    renderPage();

    expect(screen.getByText(/chargement du candidat/i)).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: /^jean\s+dupont$/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("jean.dupont@test.com")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /^actions de validation$/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^← retour à la liste$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^modifier$/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^valider$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^marquer non validé$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^supprimer \(soft delete\)$/i }),
    ).toBeInTheDocument();
  });

  it("keeps validation and delete actions visible after data is loaded", async () => {
    (api.candidates.getById as jest.Mock).mockResolvedValue({
      _id: "abc123",
      firstName: "Sofia",
      lastName: "Martin",
      email: "sofia.martin@test.com",
      status: "validated",
      notes: "Profil validé",
    });

    renderPage();

    await screen.findByRole("heading", { name: /^sofia\s+martin$/i });

    expect(
      screen.getByRole("button", { name: /^valider$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /marquer non validé/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /supprimer \(soft delete\)/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(api.candidates.getById).toHaveBeenCalledWith("abc123");
    });
  });
});
