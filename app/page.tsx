// Ensure this page is statically generated and doesn't require env vars
export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-5xl font-bold text-center mt-8">
        Welcome to WorkVouch
      </h1>
      <p className="text-lg mt-4 text-center max-w-xl">
        Verify your work history and get trusted references from your past employers.
      </p>
    </main>
  );
}
