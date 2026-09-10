import { createFileRoute, redirect } from "@tanstack/react-router";

// The old standalone agency portal has been merged into the unified
// Partner Portal, which now serves both airline partners and travel
// agencies. Keep this route only to redirect old bookmarks/links.
export const Route = createFileRoute("/agency")({
  beforeLoad: () => {
    throw redirect({ to: "/partner" });
  },
});
