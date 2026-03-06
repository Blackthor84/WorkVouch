import { CredentialViewClient } from "../../c/[token]/CredentialViewClient";

export const metadata = {
  title: "WorkVouch Credential",
  description: "Verified employment credential",
};

export default async function CredentialPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CredentialViewClient token={token} />;
}
