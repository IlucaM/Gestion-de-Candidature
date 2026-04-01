import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MemoryRouter } from "react-router-dom";

// Mock API module to avoid evaluating import.meta in Jest environment
jest.mock("../../src/lib/api", () => ({
  api: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
  SessionExpiredError: class SessionExpiredError extends Error {},
  getToken: jest.fn(() => null),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

import LoginPage from "../../src/pages/LoginPage";

expect.extend(toHaveNoViolations);

describe("LoginPage accessibility", () => {
  it("should have no basic a11y violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage onLoginSuccess={jest.fn()} />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders accessible form controls", () => {
    render(
      <MemoryRouter>
        <LoginPage onLoginSuccess={jest.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /se connecter/i }),
    ).toBeInTheDocument();
  });
});
