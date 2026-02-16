import Image from "next/image";
import Link from "next/link";
import { careers } from "@/data/careers";
import { notFound } from "next/navigation";

type WorkerSection = {
  intro: string[];
  problems: string[];
  howHelp: string[];
  closing: string;
};

const workerSectionByCareer: Record<string, WorkerSection> = {
  education: {
    intro: [
      "In education you move between schools, districts, and roles. Principals change, HR is overwhelmed, and substitute or short-term positions often fall through the cracks. When a new school wants to verify your experience, the person who knew you may be gone.",
      "Your time in the classroom and with students is real. You shouldn't have to rely on someone returning a call to prove it.",
    ],
    problems: [
      "Administrators or HR don't respond after you leave a school",
      "Sub or one-year positions don't get written into formal references",
      "Districts reorganize and records are hard to track down",
      "Fellow teachers and staff rotate, so nobody can confirm you were there",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Colleagues who worked with you verify your role and time at the school",
      "Your tenure, role, and reliability are confirmed by peers who were there",
      "Your work history stays with you across districts and roles",
      "You don't lose opportunities because someone won't answer the phone",
    ],
    closing:
      "Your experience shouldn't disappear just because a school restructures or a principal moves on. WorkVouch helps you keep proof of the work you actually did.",
  },
  "skilled-trades": {
    intro: [
      "In skilled trades you move from job to job and employer to employer. Foremen leave, companies get bought, and records disappear. When the next shop or contractor wants to verify you worked there, often nobody answers.",
      "Your trade and your time on the tools are real. Proving it shouldn't depend on a phone call that never gets returned.",
    ],
    problems: [
      "Supervisors or shop leads leave and your history goes with them",
      "Short jobs or subcontracts never make it onto a formal reference",
      "Companies merge or shut down and records are gone",
      "Crews change every job, so nobody can confirm you were there",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Coworkers and crew verify you actually worked on that site or for that employer",
      "Your role, schedule, and reliability are confirmed by people who were there",
      "Your work history stays with you from job to job",
      "You don't miss out because a former boss won't pick up the phone",
    ],
    closing:
      "What you built and where you showed up shouldn't vanish when a project ends. WorkVouch helps you keep proof of the work you actually did.",
  },
  construction: {
    intro: [
      "In construction you jump from project to project and employer to employer. Past supervisors move on, companies get bought, and jobsite records disappear. When the next GC or contractor wants to verify you worked there, often nobody answers.",
      "Your trade and your time on the tools are real. Proving it shouldn't depend on a phone call that never gets returned.",
    ],
    problems: [
      "Foremen or project managers leave and your history goes with them",
      "Short jobs or subcontracts never make it onto a formal reference",
      "Companies merge or shut down and records are gone",
      "Crews change every job, so nobody can confirm you were there",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Coworkers and crew verify you actually worked on that site or for that employer",
      "Your role, schedule, and reliability are confirmed by people who were there",
      "Your work history stays with you from job to job",
      "You don't miss out because a former boss won't pick up the phone",
    ],
    closing:
      "What you built and where you showed up shouldn't vanish when a project ends. WorkVouch helps you keep proof of the work you actually did.",
  },
  healthcare: {
    intro: [
      "In healthcare you move between facilities, agencies, and shifts. When you leave a job, HR often doesn't return calls. Your years of experience can disappear when the next employer tries to verify you.",
      "It's hard to prove where you really worked and who you worked with. WorkVouch gives you a way to carry that proof with you.",
    ],
    problems: [
      "Employers or HR don't respond after you leave",
      "Short-term or per-diem roles don't show up on a standard check",
      "Staffing agencies lose records or go out of business",
      "Charge nurses and coworkers rotate constantly, so nobody's left to vouch for you",
      "Your resume says one thing, but there's no way to prove it",
    ],
    howHelp: [
      "Coworkers who actually worked with you verify your role and overlap",
      "Your shifts, units, and reliability get confirmed by peers, not just your word",
      "Your work history stays with you even when a facility closes or a manager moves on",
      "You don't lose opportunities because someone won't answer the phone",
    ],
    closing:
      "Your experience shouldn't disappear just because a company restructures or a supervisor leaves. WorkVouch helps you keep proof of the work you actually did.",
  },
  "warehouse-logistics": {
    intro: [
      "In warehouse and logistics you move between facilities, carriers, and shifts. Temp agencies and employers often don't keep records long-term. When the next hiring manager wants to verify you worked there, the supervisor may be gone or the system may have no record of you.",
      "Your experience on the floor or on the road is real. You shouldn't have to rely on someone digging through old files to prove it.",
    ],
    problems: [
      "Supervisors or staffing agencies don't respond after you leave",
      "Short assignments or peak-season work don't show up on a standard check",
      "Facilities close or carriers merge and records disappear",
      "Crews and leads rotate, so nobody can confirm you were there",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Coworkers who worked with you verify your role and time at the facility",
      "Your schedule, reliability, and safety record are confirmed by people who were there",
      "Your work history stays with you from job to job",
      "You don't miss out because a former employer won't pick up the phone",
    ],
    closing:
      "Your experience shouldn't disappear just because a company shuts down or a manager moves on. WorkVouch helps you keep proof of the work you actually did.",
  },
  security: {
    intro: [
      "In security you move between sites, contracts, and agencies. Clients change vendors, posts get rebid, and when you leave, often nobody keeps a file on you. The next employer wants to verify your post history and reliability, but the supervisor who knew you may be gone or the contract may have ended.",
      "Your time on post and your track record are real. Proving it shouldn't depend on a phone call that never gets returned.",
    ],
    problems: [
      "Site supervisors or agencies don't respond after a contract ends",
      "Short-term or fill-in posts don't show up on a standard check",
      "Contracts get rebid and the new vendor has no record of you",
      "Shift partners rotate, so nobody can confirm you were there",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Coworkers who worked the same post verify your role and time on site",
      "Your schedule, reliability, and conduct are confirmed by people who were there",
      "Your work history stays with you from contract to contract",
      "You don't miss out because a former client or agency won't pick up the phone",
    ],
    closing:
      "Your experience shouldn't disappear just because a contract ended or a vendor changed. WorkVouch helps you keep proof of the work you actually did.",
  },
  retail: {
    intro: [
      "In retail you move between stores, brands, and managers. Turnover is high, HR is stretched, and when you leave, often nobody follows up. The next employer wants to verify your experience, but the manager who knew you may have left or the store may have closed.",
      "Your time on the floor and your reliability are real. Proving it shouldn't depend on a callback that never comes.",
    ],
    problems: [
      "Managers or HR don't respond after you leave",
      "Short stints or seasonal jobs disappear from reference checks",
      "Stores close or get rebranded and records are lost",
      "Teammates rotate constantly, so nobody can vouch for you",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Coworkers who worked with you verify your role and time at the store",
      "Your shifts, reliability, and teamwork are confirmed by people who were there",
      "Your work history stays with you as you move between brands and roles",
      "You don't lose opportunities because someone won't answer the phone",
    ],
    closing:
      "Your experience shouldn't disappear just because a manager moved or a store closed. WorkVouch helps you keep proof of the work you actually did.",
  },
  "law-enforcement": {
    intro: [
      "In law enforcement you move between agencies, units, and roles. When you leave a department, HR may be swamped or policy may limit what they can say. The next agency wants to verify your service and conduct, but the chain of command that knew you may have changed or the records may be hard to access.",
      "Your service record and your reliability are real. Proving it shouldn't depend on a callback that never comes or red tape that blocks the request.",
    ],
    problems: [
      "Departments or HR don't respond or are limited in what they can share",
      "Details about assignments or units don't show up on a standard check",
      "Agencies merge or restructure and records are hard to track down",
      "Partners and supervisors rotate, so the people who knew you may be gone",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Peers who served with you verify your role and time at the agency",
      "Your tenure, assignments, and reliability are confirmed by people who were there",
      "Your work history stays with you across departments and roles",
      "You don't lose opportunities because someone won't answer the phone or release information",
    ],
    closing:
      "Your experience shouldn't disappear just because a department restructures or a contact retires. WorkVouch helps you keep proof of the work you actually did.",
  },
  hospitality: {
    intro: [
      "In hospitality you move between hotels, restaurants, and seasons. Managers change, properties get sold, and when you leave, reference requests often go nowhere. The next employer wants to know you showed up and did the work, but the person who could say so may have moved on.",
      "Your experience with guests and your reliability are real. Proving it shouldn't depend on a callback that never comes.",
    ],
    problems: [
      "Managers or HR don't respond after you leave",
      "Seasonal or short-term roles don't show up on a standard check",
      "Properties change hands and records are lost",
      "Staff rotates constantly, so nobody can vouch for you",
      "Your resume doesn't reflect the work you actually did",
    ],
    howHelp: [
      "Coworkers who worked with you verify your role and time at the property",
      "Your shifts, reliability, and guest focus are confirmed by people who were there",
      "Your work history stays with you as you move between venues and roles",
      "You don't lose opportunities because someone won't answer the phone",
    ],
    closing:
      "Your experience shouldn't disappear just because a manager left or a property was sold. WorkVouch helps you keep proof of the work you actually did.",
  },
};

const defaultWorkerSection: WorkerSection = {
  intro: [
    "People in this field often move between jobs and employers. When you leave, the people who could verify your work may move on too. Proving your experience can depend on a phone call that never gets returned.",
    "Your experience is real. WorkVouch gives you a way to carry proof of it with you.",
  ],
  problems: [
    "Employers don't respond after you leave",
    "Short-term or contract work doesn't show up on a standard check",
    "Records get lost when companies merge or shut down",
    "Coworkers rotate, so nobody can vouch for you",
    "Your resume doesn't reflect the work you actually did",
  ],
  howHelp: [
    "Coworkers who worked with you verify your role and overlap",
    "Your schedule and reliability are confirmed by people who were there",
    "Your work history stays with you from job to job",
    "You don't lose opportunities because someone won't answer the phone",
  ],
  closing:
    "Your experience shouldn't disappear just because a company shuts down or a manager moves on. WorkVouch helps you keep proof of the work you actually did.",
};

export default async function CareerPage(props: { params: Promise<{ career: string }> }) {
  const { career: careerSlug } = await props.params;

  const career = careers.find(
    (c) => c.id === careerSlug || c.id.replace(/-/g, "_") === careerSlug.replace(/-/g, "_")
  );

  if (!career) {
    notFound();
  }

  const workerSection = workerSectionByCareer[career.id] ?? defaultWorkerSection;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-50 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-8">
        <Image
          src={career.image}
          alt={career.name}
          width={400}
          height={300}
          className="w-full h-full object-contain p-2"
          unoptimized
        />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{career.name}</h1>

      <p className="mb-4 text-slate-600 dark:text-slate-400">{career.heroText}</p>

      <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
          Why People in This Career Use WorkVouch
        </h2>
        {workerSection.intro.map((p, i) => (
          <p key={i} className="mb-4 text-slate-600 dark:text-slate-400">
            {p}
          </p>
        ))}
        <ul className="list-disc ml-6 space-y-2 mb-6 text-slate-600 dark:text-slate-400">
          {workerSection.problems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p className="font-medium mb-2 text-slate-800 dark:text-slate-200">How WorkVouch helps:</p>
        <ul className="list-disc ml-6 space-y-2 mb-6 text-slate-600 dark:text-slate-400">
          {workerSection.howHelp.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p className="text-slate-600 dark:text-slate-400">{workerSection.closing}</p>
      </section>

      <h2 className="text-xl font-semibold mt-8 mb-2 text-slate-900 dark:text-white">Why employers use WorkVouch</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-2">
        Trust, speed, and reduced risk. Verified overlap and peer validation so every hire is informed by data, not guesswork.
      </p>
      <ul className="list-disc ml-6 space-y-2 mb-6 text-slate-600 dark:text-slate-400">
        {career.whyForEmployers.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-slate-900 dark:text-white">Why people in this career use WorkVouch</h2>
      <ul className="list-disc ml-6 space-y-2 text-slate-600 dark:text-slate-400">
        {career.whyForEmployees.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
        <Link
          href="/signup"
          className="inline-block rounded-lg bg-slate-900 dark:bg-slate-100 px-6 py-3 font-semibold text-white dark:text-slate-900 hover:opacity-90"
        >
          Get Verified Work History
        </Link>
      </div>
    </div>
  );
}
