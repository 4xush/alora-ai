import React from "react";
import { render, screen, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "../store/store";
import IntervieweePage from "../pages/Interviewee/IntervieweePage";

/**
 * Test file to verify that the IntervieweePage and its hooks are working properly
 * Run with: npm test
 */
describe("IntervieweePage Component", () => {
  test("renders without crashing", () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <IntervieweePage step="dashboard" />
        </BrowserRouter>
      </Provider>
    );

    // Component should render without throwing the "destroy is not a function" error
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test("handles step prop correctly", () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <IntervieweePage step="pre-interview" />
        </BrowserRouter>
      </Provider>
    );

    // Should render the pre-interview step
    expect(screen.getByText(/resume/i)).toBeInTheDocument();
  });

  test("uses interview navigation hook properly", () => {
    // Mock the navigation hook to test its integration
    const mockUseInterviewNavigation = jest.fn();
    jest.mock("../../hooks/interviewee/useInterviewNavigation", () => ({
      __esModule: true,
      default: () => mockUseInterviewNavigation(),
    }));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <IntervieweePage step="dashboard" />
        </BrowserRouter>
      </Provider>
    );

    // Hook should be called with the correct step
    expect(mockUseInterviewNavigation).toHaveBeenCalledWith("dashboard");
  });
});
