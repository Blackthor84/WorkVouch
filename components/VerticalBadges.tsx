interface ProfileVerticalData {
  industry?: string | null;
  vertical?: string | null;
}

interface Props {
  profile: ProfileVerticalData;
}

export default function VerticalBadges({ profile }: Props) {
  const { industry, vertical } = profile;

  if (!industry && !vertical) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {industry && (
        <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">
          {industry}
        </span>
      )}

      {vertical && (
        <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-medium">
          {vertical}
        </span>
      )}
    </div>
  );
}
