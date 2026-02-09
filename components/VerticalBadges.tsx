export default function VerticalBadges({ profile }: {
  profile: {
    industry?: string | null;
    vertical?: string | null;
    role?: string | null;
  };
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {profile.industry && (
        <span className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white">
          {profile.industry}
        </span>
      )}
      {profile.vertical && (
        <span className="px-2 py-1 text-xs rounded-md bg-purple-600 text-white">
          {profile.vertical}
        </span>
      )}
      {profile.role && (
        <span className="px-2 py-1 text-xs rounded-md bg-green-600 text-white">
          {profile.role}
        </span>
      )}
    </div>
  );
}
