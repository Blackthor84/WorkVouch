import { redirect } from "next/navigation";

/** Canonical employer candidate profile lives at /employer/profile/[id]. */
export default async function CandidateProfileRedirect(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/employer/profile/${id}`);
}
