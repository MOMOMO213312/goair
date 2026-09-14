import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  COMPLIANCE_STATUS_BADGE_CLASS,
  COMPLIANCE_STATUS_LABEL,
  type ComplianceStatus,
} from "@/lib/compliance";
import { cn } from "@/lib/utils";

export function ComplianceBadge({
  status,
  className,
}: {
  status: ComplianceStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(COMPLIANCE_STATUS_BADGE_CLASS[status], "gap-1 font-bold", className)}>
      {status === "expired" || status === "expiring_soon" ? <AlertTriangle className="size-3" aria-hidden /> : null}
      {COMPLIANCE_STATUS_LABEL[status]}
    </Badge>
  );
}
