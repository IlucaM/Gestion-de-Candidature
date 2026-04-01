import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import CandidateFormPage from "../src/pages/CandidateFormPage";

jest.mock("../src/lib/api", () => ({
  api: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
    },
    candidates: {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      validate: jest.fn(),
    },
    health: {
      check: jest.fn(),
    },
    utils: {
      mapStatusForValidation: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
  SessionExpiredError: class SessionExpiredError extends Error {},
  getToken: jest.fn(() => "fake-jwt"),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("CandidateFormPage validation", () => {
  it("shows required field errors when submitting empty form in create mode", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CandidateFormPage mode="create" />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole("button", { name: /créer/i });
    await user.click(submitButton);

    expect(
      await screen.findByText(/le prénom est requis/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
    expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument();
  });

  it("shows email format error when email is invalid", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CandidateFormPage mode="create" />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/prénom/i), "Jean");
    await user.type(screen.getByLabelText(/^nom$/i), "Dupont");
    await user.type(screen.getByLabelText(/email candidat/i), "invalid-email");

    await user.click(screen.getByRole("button", { name: /créer/i }));

    expect(
      await screen.findByText(/format email invalide/i),
    ).toBeInTheDocument();
  });

  it("shows phone format error when phone is invalid", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CandidateFormPage mode="create" />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/prénom/i), "Jean");
    await user.type(screen.getByLabelText(/^nom$/i), "Dupont");
    await user.type(screen.getByLabelText(/email candidat/i), "jean@dupont.fr");
    await user.type(screen.getByLabelText(/téléphone/i), "abc");

    await user.click(screen.getByRole("button", { name: /créer/i }));

    expect(
      await screen.findByText(/format téléphone invalide/i),
    ).toBeInTheDocument();
  });
});
