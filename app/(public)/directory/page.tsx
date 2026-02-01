import { DirectoryClient } from "./DirectoryClient";

export const metadata = {
  title: "Career Passport Directory",
  description: "Search verified Career Passports. Limited public search by name.",
};

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Career Passport Directory
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Search verified Career Passports. Public search is by name only.
        </p>
        <DirectoryClient />
      </div>
    </div>
  );
}
