import { Activity } from "lucide-react";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="shell topbar__content">
        <a className="brand" href="/" aria-label="Nexo Pessoas — página inicial">
          <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 8h8v8H7zM17 16h8v8h-8z" />
            <path className="brand__rail" d="M15 12h6v4M11 16v4h6" />
          </svg>
          <span>Nexo Pessoas</span>
        </a>

        <div className="service-status" aria-label="Status do sistema">
          <Activity size={15} aria-hidden="true" />
          <span>Sistema disponível</span>
        </div>
      </div>
    </header>
  );
}
