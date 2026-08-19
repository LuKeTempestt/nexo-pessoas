import { LogOut } from "lucide-react";
import { Button } from "./Button";
import type { Operator } from "../types/user";

export function Topbar({ operator, onLogout }: { readonly operator: Operator; readonly onLogout: () => void }) {
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

        <div className="operator-menu">
          <span><strong>{operator.nome}</strong><small>{operator.role}</small></span>
          <Button variant="icon" type="button" title="Sair" aria-label="Sair" onClick={onLogout}><LogOut size={16} /></Button>
        </div>
      </div>
    </header>
  );
}
