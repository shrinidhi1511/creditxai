export default function StatusBadge({ status }) {
  const cls = {
    APPROVED: "badge-approved",
    REJECTED: "badge-rejected",
    PENDING:  "badge-pending",
  }[status] || "badge-pending";

  const dot = {
    APPROVED: "bg-emerald-500",
    REJECTED: "bg-red-500",
    PENDING:  "bg-amber-500",
  }[status] || "bg-amber-500";

  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${dot}`} />
      {status}
    </span>
  );
}
