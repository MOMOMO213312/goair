import { createFileRoute, redirect } from "@tanstack/react-router";

// The operator direct-sale channel has been closed on purpose: an operator
// selling directly to its own customer (attributed via its own
// partners.partner_type='operator' referral code) mixed fulfillment payout
// (transport_operators.payout_model) and sales commission on the same
// booking with no reconciliation between the two, risking the operator
// being paid twice for one trip. If a transport company is also a genuine
// sales source (e.g. it doubles as a travel agency), it should use its own
// separate account on the unified Partner Portal (/partner) instead — that
// path never touches sales_partner_id / operator_settlement_status.
// Kept only to redirect old bookmarks/links.
export const Route = createFileRoute("/operator/sell")({
  beforeLoad: () => {
    throw redirect({ to: "/operator" });
  },
});
