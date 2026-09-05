import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mx-auto grid max-w-[1124px] grid-cols-[1fr_auto] gap-5 border-t border-tech-line py-8 text-sm text-tech-muted max-sm:mx-5 max-sm:grid-cols-1">
      <div>
        <Link
          className="flex items-center gap-2 text-[17px] font-extrabold tracking-tight text-tech-ink"
          to="/"
        >
          <span className="grid size-6 place-items-center rounded-lg bg-tech-blue text-[9px] text-white">
            TS
          </span>
          TechStar
        </Link>
        <p className="mt-2.5 text-xs">
          Computer & IT equipment repair service management.
        </p>
      </div>
      <nav className="flex items-center gap-5 text-xs max-sm:row-start-2">
        <Link to="/">Home</Link>
        <a href="#services">Services</a>
        <Link to="/login">Login</Link>
      </nav>
      <small className="col-span-full text-xs max-sm:row-start-3">
        © 2026 TechStar. All rights reserved.
      </small>
    </footer>
  );
}
