import { CredentialViewClient } from "./CredentialViewClient";

export const metadata = {
  title: "WorkVouch Credential",
  description: "Verified employment credential",
};

export default async function PublicCredentialPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CredentialViewClient token={token} />;
}
