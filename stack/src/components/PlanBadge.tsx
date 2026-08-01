export default function PlanBadge({ badge }: { badge: string | null | undefined }) {
  if (!badge) return null;

  const styles: Record<string, string> = {
    bronze: "bg-orange-100 text-orange-700 border-orange-300",
    silver: "bg-gray-100 text-gray-700 border-gray-300",
    gold: "bg-yellow-100 text-yellow-700 border-yellow-400",
  };

  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[badge] || ""}`}
    >
      {badge.toUpperCase()}
    </span>
  );
}