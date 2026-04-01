import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import App from "../src/App";

const getTokenMock = jest.fn();
const clearTokenMock = jest.fn();

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
  getToken: (...args: unknown[]) => getTokenMock(...args),
  clearToken: (...args: unknown[]) => clearTokenMock(...args),
  setToken: jest.fn(),
}));

jest.mock("../src/pages/LoginPage", () => ({
  __esModule: true,
  default: ({ onLoginSuccess }: { onLoginSuccess: () => void }) => (
    <div>
      <h1>Mock Login Page</h1>
      <button onClick={onLoginSuccess}>Mock Login</button>
    </div>
  ),
}));

jest.mock("../src/pages/CandidateListPage", () => ({
  __esModule: true,
  default: () => <h1>Mock Candidates List</h1>,
}));

jest.mock("../src/pages/CandidateDetailPage", () => ({
  __esModule: true,
  default: () => <h1>Mock Candidate Detail</h1>,
}));

jest.mock("../src/pages/CandidateFormPage", () => ({
  __esModule: true,
  default: ({ mode }: { mode: "create" | "edit" }) => (
    <h1>
      {mode === "create" ? "Mock Candidate Create" : "Mock Candidate Edit"}
    </h1>
  ),
}));

describe("App routes", () => {
  beforeEach(() => {
    getTokenMock.mockReset();
    clearTokenMock.mockReset();
    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users to login route", async () => {
    getTokenMock.mockReturnValue(null);

    render(<App />);

    expect(await screen.findByText("Mock Login Page")).toBeInTheDocument();
  });

  it("shows candidates route when user is authenticated", async () => {
    getTokenMock.mockReturnValue("fake-jwt-token");

    window.history.pushState({}, "", "/candidates");
    render(<App />);

    expect(await screen.findByText("Mock Candidates List")).toBeInTheDocument();
  });
});
