import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConfidenceScoreByUserId } from "@/lib/db/queries/getConfidenceScoreByUserId";
import { getVerifiedJobCountByUserId } from "@/lib/db/queries/getVerifiedJobCountByUserId";
import { getTrustForProfile, getUserReferences } from "@/lib/actions/referenceFeedback";
import { getCoworkerReferencesForProfile } from "@/lib/actions/coworkerReferences";
import { getJobsWithVerifiedCoworkers } from "@/lib/actions/getJobsWithVerifiedCoworkers";
import { admin } from "@/lib/supabase-admin";
import { Star } from "lucide-react";
import { JobVerificationSection } from "@/components/profile/JobVerificationSection";
import { ProfileResumeActions } from "@/components/profile/ProfileResumeActions";
import { ProfileFetchDebug } from "@/components/profile/ProfileFetchDebug";
import { ProfileDisplayName } from "@/components/profile/ProfileDisplayName";
import { ensureProfileRowForUser } from "@/lib/profile/ensureUserProfile";
import { WvContainer, WvPageHeader, WvCard, WvButton, WvTrustScore } from "@/components/wv";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfileRowForUser(user);

  type ProfileRow = {
    id: string;
    full_name?: string | null;
    email?: string | null;
    state?: string | null;
    location?: string | null;
    headline?: string | null;
    role?: string | null;
    professional_summary?: string | null;
    public_slug?: string | null;
    resume_url?: string | null;
    resume_uploaded_at?: string | null;
  };

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, state, location, headline, role, professional_summary, public_slug, resume_url"
    )
    .eq("id", user.id)
    .single();

  const row = profileRow as ProfileRow | null;
  const profileIdMatches = !!row?.id && row.id === user.id;
  const profile = !profileError && profileIdMatches ? row : null;

  if (profileError) {
    console.warn("[profile] profiles lookup:", profileError.message, profileError);
  } else if (row && !profileIdMatches) {
    console.error("[profile] profiles.id !== auth user.id", {
      profilesId: row.id,
      userId: user.id,
    });
  }

  const [confidenceScore, verifiedJobCount, trustForProfile, references, coworkerRefs, jobsWithCoworkers] =
    await Promise.all([
      getConfidenceScoreByUserId(user.id),
      getVerifiedJobCountByUserId(user.id),
      getTrustForProfile(user.id),
      getUserReferences(user.id),
      getCoworkerReferencesForProfile(user.id),
      getJobsWithVerifiedCoworkers(user.id),
    ]);

  type ReviewItem = { id: string; rating: number; text: string | null; authorName: string | null; created_at: string };
  const recentReviews: ReviewItem[] = [
    ...references.map((r) => ({ id: r.id, rating: r.rating, text: r.feedback, authorName: r.author_name, created_at: r.created_at })),
    ...coworkerRefs.map((r) => ({
      id: r.id,
      rating: Math.round((r.rating + r.reliability + r.teamwork) / 3),
      text: r.comment,
      authorName: r.reviewer_name,
      created_at: r.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let verifiedCoworkerCount = 0;
  try {
    const { count } = await (admin as any)
      .from("user_references")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", user.id);
    verifiedCoworkerCount = count ?? 0;
  } catch {
    // ignore
  }

  const debugProfilePayload: Record<string, unknown> | null = profile
    ? {
        full_name: profile.full_name,
        email: profile.email,
        headline: profile.headline,
        location: profile.location,
        state: profile.state,
      }
    : null;

  const headline = profile?.headline?.trim() || null;
  const location = profile?.location?.trim() || profile?.state?.trim() || null;
  const email = profile?.email ?? user.email ?? "";
  const bio = profile?.professional_summary ?? null;
  const publicSlug = profile?.public_slug ?? null;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://workvouch.com");
  const publicProfileUrl = publicSlug ? `${baseUrl}/candidate/${publicSlug}` : null;
  const linkedInShareUrl = publicProfileUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}`
    : null;

  const trustScoreDisplay = trustForProfile.score > 0 ? (trustForProfile.score / 20).toFixed(1) : null;
  const trustScorePct = trustForProfile.score > 0 ? Math.min(100, Math.round(trustForProfile.score / 5)) : 0;

  return (
    <WvContainer size="narrow" className="py-8">
      <WvPageHeader
        eyebrow="Your profile"
        title="Profile"
        action={
          <WvButton href="/profile/edit" size="sm">
            Edit Profile
          </WvButton>
        }
      />

      <WvCard glow className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Full Name</h2>
          <div className="mt-1">
            <ProfileDisplayName />
          </div>
        </div>

        <ProfileFetchDebug
          userId={user.id}
          profile={debugProfilePayload}
          queryError={profileError?.message ?? null}
        />

        {headline && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Headline</h2>
            <p className="mt-1 text-wv-foreground">{headline}</p>
          </div>
        )}

        {location && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Location</h2>
            <p className="mt-1 text-wv-foreground">{location}</p>
          </div>
        )}

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Email</h2>
          <p className="mt-1">
            <a href={`mailto:${email}`} className="text-blue-400 hover:text-blue-300 hover:underline">
              {email}
            </a>
          </p>
        </div>

        {bio && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Bio</h2>
            <p className="mt-1 text-wv-muted whitespace-pre-wrap">{bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-wv-border">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Confidence Score</h2>
            <p className="mt-1 text-2xl font-bold text-wv-foreground tabular-nums">
              {confidenceScore ?? "—"}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Verified Jobs</h2>
            <p className="mt-1 text-2xl font-bold text-wv-foreground tabular-nums">{verifiedJobCount}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Verified Coworkers</h2>
            <p className="mt-1 text-2xl font-bold text-wv-foreground tabular-nums">{verifiedCoworkerCount}</p>
          </div>
        </div>
      </WvCard>

      <div className="mt-8">
        <ProfileResumeActions
          hasResume={!!profile?.resume_url}
          resumeUploadedAt={profile?.resume_uploaded_at ?? null}
        />
      </div>

      <div className="mt-8">
        <JobVerificationSection jobsWithCoworkers={jobsWithCoworkers} />
      </div>

      <WvCard glow className="mt-8">
        <h2 className="text-lg font-semibold text-wv-foreground mb-6">Trust & References</h2>
        <div className="flex flex-wrap items-center gap-8 mb-8">
          <WvTrustScore score={trustScorePct} size="md" />
          <div>
            <p className="text-sm font-medium text-wv-muted">Trust Score</p>
            <p className="text-4xl font-bold text-wv-foreground mt-0.5 tabular-nums">
              {trustScoreDisplay ?? "—"}
            </p>
            <p className="text-xs text-wv-subtle">out of 5 (from reviews)</p>
          </div>
          <div>
            <p className="text-sm font-medium text-wv-muted">Total Reviews</p>
            <p className="text-3xl font-bold text-wv-foreground mt-0.5 tabular-nums">
              {trustForProfile.totalReferences}
            </p>
          </div>
        </div>
        <h3 className="text-base font-semibold text-wv-foreground mb-3">Recent Reviews</h3>
        {recentReviews.length > 0 ? (
          <ul className="space-y-4">
            {recentReviews.map((ref) => (
              <li key={ref.id} className="rounded-xl border border-wv-border bg-wv-bg/50 p-4">
                <div className="flex items-center gap-0.5 text-amber-400 font-medium">
                  {Array.from({ length: Math.min(5, Math.max(1, ref.rating)) }, (_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" aria-hidden />
                  ))}
                </div>
                {ref.text && (
                  <p className="mt-2 text-wv-muted text-sm whitespace-pre-wrap">&ldquo;{ref.text}&rdquo;</p>
                )}
                <p className="mt-1 text-xs text-wv-subtle">
                  — {ref.authorName ?? "A coworker"} · {new Date(ref.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-wv-foreground">Land your first review with a vouch</p>
            <p className="text-sm text-wv-muted">
              After a coworker accepts your vouch request, they can leave a review from Coworker Matches.
            </p>
            <WvButton href="/coworker-matches" size="sm">
              Open coworker matches
            </WvButton>
          </div>
        )}
      </WvCard>

      {linkedInShareUrl && (
        <div className="mt-6">
          <WvButton href={linkedInShareUrl} variant="secondary" size="sm">
            Share on LinkedIn
          </WvButton>
        </div>
      )}
    </WvContainer>
  );
}
