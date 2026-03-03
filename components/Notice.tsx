export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const className = tone === "error" ? "dangerButton" : tone === "success" ? "chip" : "secondaryButton";
  return <div className={className}>{children}</div>;
}
