import {
  ArrowRight,
  Check,
  ClipboardList,
  Clock3,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavbar from "../components/layout/PublicNavbar";
import Footer from "../components/layout/Footer";

const features = [
  {
    icon: Clock3,
    title: "Real-time updates",
    text: "See where your equipment is in the repair journey without chasing the service desk.",
  },
  {
    icon: ShieldCheck,
    title: "Clear service",
    text: "Every request has a visible status, progress history, and delivery expectation.",
  },
  {
    icon: Wrench,
    title: "Expert operations",
    text: "A more organized workflow helps technicians focus on restoring your equipment.",
  },
];
const steps = [
  "Bring your product",
  "Technician diagnoses",
  "Repair in progress",
  "Ready for delivery",
];
const eyebrow =
  "text-[11px] font-extrabold uppercase tracking-[1.3px] text-tech-blue";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-tech-ink">
      <main>
        <section className="mx-auto grid max-w-[1180px] grid-cols-[1fr_440px] items-center gap-[92px] px-7 py-28 max-lg:grid-cols-1 max-lg:gap-14 max-lg:py-20 max-sm:px-5">
          <div>
            <span className={eyebrow}>Computer repair, made clear</span>
            <h1 className="my-5 text-[58px] font-bold leading-[1.06] tracking-[-2.4px] max-sm:text-[43px]">
              Reliable IT repair.
              <br />
              <em className="not-italic text-tech-blue">
                Simple service tracking.
              </em>
            </h1>
            <p className="max-w-[500px] text-[17px] leading-7 text-tech-muted">
              Submit a repair request, follow every meaningful update, and know
              exactly when your equipment is ready.
            </p>
            <div className="mt-8 flex gap-3 max-sm:flex-col">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-tech-blue px-[18px] py-3 text-sm font-bold !text-white shadow-lg shadow-tech-blue/15"
                to="/track"
              >
                Track your service <ArrowRight size={16} />
              </Link>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-tech-line bg-white px-[18px] py-3 text-sm font-bold"
                href="#how-it-works"
              >
                Learn more
              </a>
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-tech-muted">
              <span className="grid size-5 place-items-center rounded-full bg-green-50 text-green-700">
                <Check size={13} />
              </span>
              Built for customers and repair teams
            </div>
          </div>
          <div className="rotate-[1.5deg] rounded-[14px] border border-sky-100 bg-white p-6 shadow-2xl shadow-slate-900/10 max-lg:mx-auto max-lg:w-full max-lg:max-w-[470px] max-sm:rotate-0">
            <div className="flex justify-between border-b border-slate-100 pb-4 text-xs text-slate-400">
              <span>
                <i className="mr-1.5 inline-block size-1.5 rounded-full bg-green-500" />
                TechStar workspace
              </span>
              <span>•••</span>
            </div>
            <div className="flex items-center justify-between py-6">
              <div>
                <small className="block text-xs text-slate-400">
                  Service request
                </small>
                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  Live tracking
                </h2>
              </div>
              <span className="rounded-full bg-green-50 px-2.5 py-1.5 text-[10px] font-extrabold text-green-700">
                REPAIRING
              </span>
            </div>
            <div className="flex items-center gap-3 border-y border-slate-100 py-4">
              <span className="grid size-10 place-items-center rounded-lg bg-tech-blue-soft text-tech-blue">
                <ClipboardList size={19} />
              </span>
              <div>
                <strong className="block text-sm">Your IT equipment</strong>
                <small className="mt-1 block text-xs text-slate-400">
                  Repair progress and delivery updates
                </small>
              </div>
            </div>
            <div className="py-6">
              <div className="flex justify-between text-xs">
                <span>Repair progress</span>
                <strong className="text-tech-blue">
                  Updated by service team
                </strong>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <i className="block h-full w-3/5 rounded-full bg-tech-blue" />
              </div>
            </div>
            <div className="flex justify-start gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
              <span className="grid size-5 place-items-center rounded-full bg-green-50 text-green-700">
                <Check size={12} />
              </span>
              Service status access
            </div>
          </div>
        </section>
        <section className="grid grid-cols-[180px_1fr_1fr] items-center gap-6 border-y border-tech-line px-[max(28px,calc((100%-1124px)/2))] py-8 max-md:grid-cols-1 max-md:gap-2">
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400">
            ONE CLEAR WORKFLOW
          </span>
          <strong className="text-xl">
            From first report to final handoff
          </strong>
          <p className="m-0 text-sm leading-6 text-tech-muted">
            TechStar keeps the details together, so every repair feels
            predictable.
          </p>
        </section>
        <section
          className="mx-auto grid max-w-[1124px] grid-cols-[330px_1fr] gap-[86px] px-0 py-28 max-lg:grid-cols-1 max-lg:gap-12 max-lg:px-7 max-sm:px-5"
          id="services"
        >
          <div>
            <span className={eyebrow}>Why TechStar</span>
            <h2 className="my-4 text-[38px] font-bold leading-tight tracking-tight">
              Less uncertainty.
              <br />
              More confidence.
            </h2>
            <p className="text-sm leading-7 text-tech-muted">
              A calm, transparent repair experience for the equipment you rely
              on every day.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            {features.map(({ icon: Icon, title, text }) => (
              <article
                className="rounded-xl border border-tech-line bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                key={title}
              >
                <span className="mb-8 grid size-10 place-items-center rounded-lg bg-tech-blue-soft text-tech-blue">
                  <Icon size={19} />
                </span>
                <h3 className="mb-2 text-[15px] font-bold">{title}</h3>
                <p className="m-0 text-sm leading-6 text-tech-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="border-t border-tech-line px-[max(28px,calc((100%-1124px)/2))] py-28 max-sm:px-5"
          id="how-it-works"
        >
          <div className="text-center">
            <span className={eyebrow}>How it works</span>
            <h2 className="my-4 text-[38px] font-bold leading-tight tracking-tight">
              A straightforward path
              <br />
              back to work.
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-4 max-md:grid-cols-1 max-md:gap-6">
            {steps.map((step, index) => (
              <div
                className="relative flex flex-col gap-3 max-md:grid max-md:grid-cols-[30px_1fr]"
                key={step}
              >
                <span className="text-xs font-extrabold text-tech-blue">
                  0{index + 1}
                </span>
                <i className="absolute left-9 top-1.5 h-px w-[calc(100%-34px)] bg-tech-line max-md:left-2 max-md:top-7 max-md:h-6 max-md:w-px" />
                <strong className="text-sm">{step}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto grid max-w-[1124px] grid-cols-[1fr_390px] items-center gap-[120px] border-t border-tech-line px-0 py-28 max-lg:gap-12 max-lg:px-7 max-md:grid-cols-1 max-sm:px-5">
          <div>
            <span className={eyebrow}>Always in the know</span>
            <h2 className="my-4 text-[38px] font-bold leading-tight tracking-tight">
              Your repair,
              <br />
              at a glance.
            </h2>
            <p className="text-sm leading-7 text-tech-muted">
              Use the request ID and six-digit code printed at intake to see
              your own service status and timeline.
            </p>
            <Link
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-tech-blue"
              to="/track"
            >
              View your service <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <small className="block text-xs text-slate-400">
                  Your service request
                </small>
                <strong className="mt-1 block text-sm">
                  Service status timeline
                </strong>
              </div>
              <span className="rounded-full bg-tech-blue-soft px-2.5 py-1.5 text-[10px] font-extrabold text-tech-blue">
                MONITOR
              </span>
            </div>
            {[
              "Received",
              "Assigned",
              "Repairing",
              "Ready for delivery",
              "Completed",
            ].map((label, index) => (
              <div
                className={`relative flex items-center gap-3 py-4 text-sm ${index < 3 ? "text-tech-ink" : "text-slate-400"}`}
                key={label}
              >
                <span
                  className={`grid size-[22px] place-items-center rounded-full border text-[10px] ${index < 3 ? "border-sky-200 bg-tech-blue-soft text-tech-blue" : "border-slate-200"}`}
                >
                  {index < 2 ? <Check size={11} /> : index + 1}
                </span>
                <strong className={index === 2 ? "text-tech-blue" : ""}>
                  {label}
                </strong>
                {index === 2 && (
                  <small className="ml-auto text-xs text-slate-400">
                    Current status
                  </small>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto mb-24 flex max-w-[1124px] items-center justify-between gap-6 rounded-xl bg-tech-blue px-11 py-10 text-white max-sm:mx-5 max-sm:mb-16 max-sm:block max-sm:px-6">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-sky-200">
              Ready when you are
            </span>
            <h2 className="my-2 text-3xl font-bold">
              Need to repair your equipment?
            </h2>
            <p className="m-0 text-sm text-sky-100">
              Track your service from request to completion.
            </p>
          </div>
          <Link
            className="mt-0 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-[18px] py-3 text-sm font-bold !text-tech-blue max-sm:mt-6 max-sm:w-full"
            to="/track"
          >
            Track your service <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
