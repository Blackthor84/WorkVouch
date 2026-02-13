/**
 * Mock dashboard data for sandbox mode ONLY.
 * Import only inside sandbox checks (e.g. getSandboxContext().enabled).
 */

export const MOCK_RECENT_ACTIVITY: { id: string; message: string; time: string }[] = [
  {
    id: "mock-1",
    message: "New reference from John Doe",
    time: "2 hours ago",
  },
  {
    id: "mock-2",
    message: "Coworker match found at ABC Security",
    time: "1 day ago",
  },
];

export const MOCK_PROFILE_COMPLETENESS = {
  percent: 85,
  references: 3,
  jobs: 5,
};
