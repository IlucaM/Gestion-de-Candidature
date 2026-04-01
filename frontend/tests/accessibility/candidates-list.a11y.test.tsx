import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MemoryRouter } from "react-router-dom";

import CandidateListPage from "../../src/pages/CandidateListPage";
import { api } from "../../src/lib/api";

expect.extend(toHaveNoViolations);

jest.mock("../../src/lib/api", () => ({
  api: {
    candidates: {
      list: jest.fn(),
    },
  },
}));

describe("CandidateListPage accessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have no basic a11y violations (list loaded)", async () => {
    (api.candidates.list as jest.Mock).mockResolvedValue({
      data: [
        {
          _id: "1",
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@test.com",
          status: "pending",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    const { container, findByRole } = render(
      <MemoryRouter>
        <CandidateListPage />
      </MemoryRouter>,
    );

    await findByRole("table", { name: /liste des candidats/i });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders accessible shell controls", async () => {
    (api.candidates.list as jest.Mock).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(
      <MemoryRouter>
        <CandidateListPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByLabelText(/recherche nom ou email/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/filtre statut de validation/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /filtrer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nouveau candidat/i }),
    ).toBeInTheDocument();
  });
});
