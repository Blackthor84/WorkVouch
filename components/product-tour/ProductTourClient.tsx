"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Search,
  Users,
  MessageSquareQuote,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  WvCard,
  WvButton,
  WvInput,
  WvPageHeader,
  WvContainer,
  WvBadge,
  pageTransition,
} from "@/components/wv";
import { ProductTourShell } from "./ProductTourShell";
import { ProductTourNav } from "./ProductTourNav";
import { ProductTourEmployerChrome } from "./ProductTourEmployerChrome";
import {
  EmptyPassportPreview,
  FullPassportPreview,
  PassportView,
  ReferenceCard,
  StarRating,
} from "./ProductTourViews";
import {
  DEMO_EMPLOYEE,
  DEMO_EMPLOYER,
  DEMO_JOB,
  DEMO_REFERENCES,
  COWORKER_MATCHES,
  formatJobDates,
} from "@/lib/product-tour/data";
import { PRODUCT_TOUR_STEPS, type ProductTourStepId } from "@/lib/product-tour/steps";
import { ProductTourSearchResult } from "./ProductTourSearchResult";

type TourState = {
  employmentAdded: boolean;
  vouchesReceived: number;
  searchSubmitted: boolean;
  expandedRefId: string | null;
};

const INITIAL_TOUR_STATE: TourState = {
  employmentAdded: false,
  vouchesReceived: 0,
  searchSubmitted: false,
  expandedRefId: null,
};

export function ProductTourClient() {
  const [stepIndex, setStepIndex] = useState(0);
  const [tourState, setTourState] = useState<TourState>(INITIAL_TOUR_STATE);

  const current = PRODUCT_TOUR_STEPS[stepIndex];
  const totalSteps = PRODUCT_TOUR_STEPS.length;

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const canGoNext = stepAllowsNext(current.id, tourState, stepIndex, totalSteps);

  const handleNext = () => {
    if (current.id === "closing") {
      window.location.href = "/";
      return;
    }
    if (current.id === "add-employment" && !tourState.employmentAdded) {
      setTourState((s) => ({ ...s, employmentAdded: true }));
    }
    goNext();
  };

  return (
    <ProductTourShell section={current.section} stepLabel={current.label}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          {...pageTransition}
          transition={{ duration: 0.35 }}
          className="min-h-[calc(100vh-12rem)]"
        >
          {renderStep(current.id, {
            tourState,
            setTourState,
            goNext,
          })}
        </motion.div>
      </AnimatePresence>

      <ProductTourNav
        step={stepIndex}
        totalSteps={totalSteps}
        onBack={goBack}
        onNext={handleNext}
        canGoBack={stepIndex > 0}
        canGoNext={canGoNext}
        nextLabel={
          current.id === "landing"
            ? "Start"
            : current.id === "employer-transition"
              ? "Continue"
              : current.id === "closing"
                ? "Explore"
                : "Next"
        }
      />
    </ProductTourShell>
  );
}

function stepAllowsNext(
  id: ProductTourStepId,
  state: TourState,
  index: number,
  total: number,
): boolean {
  if (index >= total - 1 && id !== "closing") return false;
  if (id === "coworker-vouches" && state.vouchesReceived < DEMO_REFERENCES.length) return false;
  if (id === "employer-search" && !state.searchSubmitted) return false;
  if (id === "employer-vouches" && !state.expandedRefId) return false;
  return true;
}

type StepProps = {
  tourState: TourState;
  setTourState: React.Dispatch<React.SetStateAction<TourState>>;
  goNext: () => void;
};

function renderStep(id: ProductTourStepId, props: StepProps) {
  switch (id) {
    case "landing":
      return <LandingStep onStart={props.goNext} />;
    case "employee-signup":
      return <EmployeeSignupStep />;
    case "career-passport":
      return <CareerPassportStep />;
    case "add-employment":
      return (
        <AddEmploymentStep
          added={props.tourState.employmentAdded}
          onAdd={() => props.setTourState((s) => ({ ...s, employmentAdded: true }))}
        />
      );
    case "coworker-vouches":
      return (
        <CoworkerVouchesStep
          received={props.tourState.vouchesReceived}
          onReceive={() =>
            props.setTourState((s) => ({
              ...s,
              vouchesReceived: Math.min(s.vouchesReceived + 1, DEMO_REFERENCES.length),
            }))
          }
        />
      );
    case "employee-profile":
      return <EmployeeProfileStep />;
    case "employer-transition":
      return <EmployerTransitionStep onContinue={props.goNext} />;
    case "employer-signup":
      return <EmployerSignupStep />;
    case "employer-dashboard":
      return <EmployerDashboardStep />;
    case "employer-search":
      return (
        <EmployerSearchStep
          submitted={props.tourState.searchSubmitted}
          onSearch={() => props.setTourState((s) => ({ ...s, searchSubmitted: true }))}
        />
      );
    case "employer-passport":
      return <EmployerPassportStep />;
    case "employer-vouches":
      return (
        <EmployerVouchesStep
          expandedId={props.tourState.expandedRefId}
          onExpand={(id) => props.setTourState((s) => ({ ...s, expandedRefId: id }))}
        />
      );
    case "final-profile":
      return <FinalProfileStep />;
    case "closing":
      return <ClosingStep />;
    default:
      return null;
  }
}

function LandingStep({ onStart }: { onStart: () => void }) {
  return (
    <WvContainer className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">WorkVouch</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-wv-foreground sm:text-5xl">
        See WorkVouch in Action
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-wv-muted">
        Follow the journey from an employee building their professional profile to an employer
        discovering the experience of someone they&apos;ve worked with.
      </p>
      <WvButton size="lg" className="mt-10 px-8" onClick={onStart}>
        Start Product Tour
      </WvButton>
      <p className="mt-6 text-sm text-wv-subtle">
        Employee → Career Passport → Coworker Vouches → Employer Search
      </p>
    </WvContainer>
  );
}

function EmployeeSignupStep() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-12">
      <WvCard glow className="w-full max-w-md">
        <WvBadge variant="brand" className="mx-auto mb-3 block w-fit">
          Step 1 of 3
        </WvBadge>
        <h1 className="text-2xl font-bold text-center text-wv-foreground">Create account</h1>
        <p className="text-wv-muted text-sm text-center mt-4 mb-6">
          Full name, email, and password. Next you&apos;ll choose your role and complete setup.
        </p>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <WvInput label="Full name" value={DEMO_EMPLOYEE.full_name} readOnly />
          <WvInput label="Email" type="email" value={DEMO_EMPLOYEE.email} readOnly />
          <WvInput label="Password" type="password" value="••••••••••" readOnly />
          <WvButton type="button" className="w-full" size="lg">
            Continue
          </WvButton>
        </form>
        <p className="text-center mt-6 text-sm text-wv-muted">
          Demo account — fictional data for this tour only.
        </p>
      </WvCard>
    </div>
  );
}

function CareerPassportStep() {
  return (
    <WvContainer className="py-8">
      <WvPageHeader
        eyebrow="Career Passport"
        title="Your Career Passport"
        description="Your professional profile on WorkVouch — employment history, coworker references, and trust score."
      />
      <EmptyPassportPreview />
    </WvContainer>
  );
}

function AddEmploymentStep({
  added,
  onAdd,
}: {
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <WvContainer className="py-8">
      <WvPageHeader
        eyebrow="Employment"
        title="Work history"
        description="Add roles with accurate dates to enable coworker matches and verification requests."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <WvCard glow className="p-6">
          <h2 className="text-lg font-semibold text-wv-foreground">Add Verified Job</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onAdd();
            }}
          >
            <WvInput label="Company Name *" value={DEMO_JOB.company_name} readOnly />
            <WvInput label="Job Title *" value={DEMO_JOB.job_title} readOnly />
            <WvInput label="Start Date *" type="date" value="2022-01-01" readOnly />
            <WvInput label="End Date" type="date" value="2025-01-01" readOnly />
            <label className="flex items-center gap-2 text-sm text-wv-muted">
              <input type="checkbox" className="rounded border-wv-border" readOnly checked />
              Visible to employers searching Career Passports
            </label>
            <WvButton type="submit" className="w-full" disabled={added}>
              {added ? "Job added" : "Add job"}
            </WvButton>
          </form>
        </WvCard>

        <WvCard className="p-6">
          <h2 className="text-lg font-semibold text-wv-foreground">Your positions</h2>
          {added ? (
            <div className="mt-4 rounded-xl border border-wv-border p-4">
              <p className="font-medium">{DEMO_JOB.job_title}</p>
              <p className="text-sm text-wv-muted">{DEMO_JOB.company_name}</p>
              <p className="mt-1 text-xs text-wv-subtle">
                {formatJobDates(DEMO_JOB.start_date, DEMO_JOB.end_date)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-wv-muted">
              Complete your work history to find former coworkers.
            </p>
          )}
        </WvCard>
      </div>
    </WvContainer>
  );
}

function CoworkerVouchesStep({
  received,
  onReceive,
}: {
  received: number;
  onReceive: () => void;
}) {
  const visibleRefs = DEMO_REFERENCES.slice(0, received);

  return (
    <WvContainer className="py-8">
      <WvPageHeader
        eyebrow="Coworker matches"
        title="Connect with coworkers"
        description="Former coworkers who worked at the same employer can leave a reference — rating and written feedback."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WvCard className="p-6">
          <h2 className="text-lg font-semibold text-wv-foreground">Coworker matches</h2>
          <ul className="mt-4 space-y-3">
            {COWORKER_MATCHES.map((match, i) => {
              const done = i < received;
              return (
                <li
                  key={match.id}
                  className="flex items-center justify-between rounded-xl border border-wv-border p-4"
                >
                  <div>
                    <p className="font-medium text-wv-foreground">{match.name}</p>
                    <p className="text-sm text-wv-muted">{match.company}</p>
                    <p className="text-xs text-wv-subtle">Overlap: {match.overlap}</p>
                  </div>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-label="Reference received" />
                  ) : i === received ? (
                    <WvButton size="sm" onClick={onReceive}>
                      Request reference
                    </WvButton>
                  ) : (
                    <span className="text-xs text-wv-subtle">Pending</span>
                  )}
                </li>
              );
            })}
          </ul>
        </WvCard>

        <WvCard className="p-6">
          <h2 className="text-lg font-semibold text-wv-foreground">References received</h2>
          {visibleRefs.length === 0 ? (
            <p className="mt-4 text-sm text-wv-muted">
              Request references from coworkers who worked with you at Granite Hospitality Group.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {visibleRefs.map((ref) => (
                <div key={ref.id} className="rounded-xl border border-wv-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ref.reviewerName}</p>
                      <p className="text-sm text-wv-muted">{ref.roleLabel}</p>
                    </div>
                    <StarRating rating={ref.rating} size="sm" />
                  </div>
                  <p className="mt-2 text-sm text-wv-muted line-clamp-2">{ref.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </WvCard>
      </div>
    </WvContainer>
  );
}

function EmployeeProfileStep() {
  return (
    <WvContainer className="py-8">
      <WvPageHeader
        eyebrow="Career Passport"
        title="Your Career Passport"
        description="Employment history and coworker references together on your professional profile."
      />
      <FullPassportPreview />
    </WvContainer>
  );
}

function EmployerTransitionStep({ onContinue }: { onContinue: () => void }) {
  return (
    <WvContainer className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center py-16 text-center">
      <h2 className="text-3xl font-bold text-wv-foreground sm:text-4xl">
        Now let&apos;s look at WorkVouch from the employer&apos;s perspective.
      </h2>
      <WvButton size="lg" className="mt-10 gap-2" onClick={onContinue}>
        Continue to Employer Experience
        <ArrowRight className="h-4 w-4" aria-hidden />
      </WvButton>
    </WvContainer>
  );
}

function EmployerSignupStep() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-12">
      <WvCard glow className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-wv-foreground">Welcome back</h1>
        <p className="text-wv-muted text-sm text-center mt-2 mb-6">
          Sign in to your WorkVouch employer account.
        </p>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <WvInput label="Email" type="email" value={DEMO_EMPLOYER.email} readOnly />
          <WvInput label="Password" type="password" value="••••••••••" readOnly />
          <WvButton type="button" className="w-full" size="lg">
            Sign in
          </WvButton>
        </form>
        <p className="text-center mt-6 text-sm text-wv-muted">
          {DEMO_EMPLOYER.company_name} · Demo employer account
        </p>
      </WvCard>
    </div>
  );
}

function EmployerDashboardStep() {
  return (
    <ProductTourEmployerChrome highlight="dashboard">
      <WvPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Search verified candidates, manage verification requests, and monitor hiring activity."
        action={<WvBadge variant="brand">PRO</WvBadge>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <WvCard glow className="p-5">
          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h3 className="font-semibold text-wv-foreground">Search Career Passports</h3>
              <p className="mt-1 text-sm text-wv-muted">
                Find candidates by name, company, job title, industry, or trust score.
              </p>
            </div>
          </div>
        </WvCard>
        <WvCard className="p-5">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h3 className="font-semibold text-wv-foreground">Verified candidates</h3>
              <p className="mt-1 text-sm text-wv-muted">
                Browse coworker-verified profiles in the directory.
              </p>
            </div>
          </div>
        </WvCard>
      </div>

      <WvCard className="mt-6 p-5">
        <h3 className="font-semibold text-wv-foreground">Find better information about the people you&apos;re considering.</h3>
        <p className="mt-2 text-sm text-wv-muted">
          Use Search to open a candidate&apos;s Career Passport — work history and peer references
          from people they actually worked with.
        </p>
      </WvCard>
    </ProductTourEmployerChrome>
  );
}

function EmployerSearchStep({
  submitted,
  onSearch,
}: {
  submitted: boolean;
  onSearch: () => void;
}) {
  return (
    <ProductTourEmployerChrome highlight="search">
      <WvPageHeader
        eyebrow="Search"
        title="Search Career Passports"
        description="Search by name, company, job title, industry, state, or minimum trust score."
      />

      <WvCard glow className="p-6">
        <form
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          <div className="flex-1">
            <WvInput label="Name" value={DEMO_EMPLOYEE.full_name} readOnly />
          </div>
          <WvButton type="submit" disabled={submitted} className="shrink-0 gap-2">
            <Search className="h-4 w-4" aria-hidden />
            {submitted ? "Results" : "Search"}
          </WvButton>
        </form>
      </WvCard>

      {submitted && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-wv-muted">
            1 result for &ldquo;{DEMO_EMPLOYEE.full_name}&rdquo;
          </p>
          <ProductTourSearchResult />
        </div>
      )}
    </ProductTourEmployerChrome>
  );
}

function EmployerPassportStep() {
  return (
    <ProductTourEmployerChrome highlight="search">
      <WvPageHeader
        eyebrow="Candidate profile"
        title={DEMO_EMPLOYEE.full_name}
        description="Find an employee — open their Career Passport to review work history and references."
      />
      <PassportView jobs={[DEMO_JOB]} references={DEMO_REFERENCES} employerView />
    </ProductTourEmployerChrome>
  );
}

function EmployerVouchesStep({
  expandedId,
  onExpand,
}: {
  expandedId: string | null;
  onExpand: (id: string) => void;
}) {
  return (
    <ProductTourEmployerChrome highlight="search">
      <WvPageHeader
        eyebrow="Peer references"
        title="See coworker Vouches"
        description="Instead of relying only on what a candidate says about themselves, employers can see references connected to their work history."
      />

      <div className="space-y-4">
        {DEMO_REFERENCES.map((ref) => (
          <ReferenceCard
            key={ref.id}
            reference={ref}
            expanded={expandedId === ref.id}
            onClick={() => onExpand(ref.id)}
          />
        ))}
      </div>

      {expandedId && (
        <WvCard className="mt-6 border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex gap-3">
            <MessageSquareQuote className="h-5 w-5 shrink-0 text-blue-400" aria-hidden />
            <p className="text-sm text-wv-muted">
              References include a 1–5 star rating and optional written feedback from former
              coworkers and supervisors who worked at the same employer.
            </p>
          </div>
        </WvCard>
      )}
    </ProductTourEmployerChrome>
  );
}

function FinalProfileStep() {
  return (
    <WvContainer className="py-12">
      <div className="mb-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold uppercase tracking-wider text-wv-muted">
          <span className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-400" aria-hidden />
            Work history
          </span>
          <span className="text-wv-subtle">×</span>
          <span className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-blue-400" aria-hidden />
            Coworker Vouches
          </span>
          <span className="text-wv-subtle">×</span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" aria-hidden />
            Professional profile
          </span>
          <span className="text-wv-subtle">=</span>
          <span className="text-blue-400">WorkVouch</span>
        </div>
      </div>
      <FullPassportPreview />
    </WvContainer>
  );
}

function ClosingStep() {
  return (
    <WvContainer className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">WorkVouch</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-wv-foreground sm:text-5xl">
        Professional reputation should travel with the worker.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-wv-muted">
        A professional profile built around employment history and the people you&apos;ve actually
        worked with.
      </p>
      <WvButton size="lg" className="mt-10 px-8" href="/">
        Explore WorkVouch
      </WvButton>
      <p className="mt-8 text-sm text-wv-subtle">
        <Link href="/signup" className="text-blue-400 hover:text-blue-300">
          Create an account
        </Link>
        {" · "}
        <Link href="/employers" className="text-blue-400 hover:text-blue-300">
          For employers
        </Link>
      </p>
    </WvContainer>
  );
}
