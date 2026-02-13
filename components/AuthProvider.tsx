import { getCurrentUserProfile } from "@/lib/auth";
import { AuthContextProvider } from "./AuthContext";

export default async function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: string | null = null;

  try {
    const profile = await getCurrentUserProfile();
    role = profile?.role ?? null;
  } catch {
    role = null;
  }

  return (
    <AuthContextProvider role={role} loading={false}>
      {children}
    </AuthContextProvider>
  );
}
