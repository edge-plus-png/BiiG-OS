import { SpeakerStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function StatusPill({
  status,
  late,
}: {
  status?: SpeakerStatus | null;
  late?: boolean;
}) {
  let className = "chip";
  let label: string = status ?? "AWAITING";

  if (status === SpeakerStatus.CONFIRMED) {
    className = cn("chip", "statusConfirmed");
    label = "Confirmed";
  } else if (status === SpeakerStatus.COVER_REQUIRED) {
    className = cn("chip", "statusCoverRequired");
    label = "Cover required";
  } else {
    className = cn("chip", "statusAwaiting");
    label = "Awaiting";
  }

  if (late) {
    className = cn("chip", "statusLate");
    label = "Late";
  }

  return <span className={className}>{label}</span>;
}
