import { LogOut, Users, UsersRound } from "lucide-react";
import { Button } from "./Button";
import type { AppSection, Operator } from "../types/user";

type TopbarProps = {
  readonly operator: Operator;
  readonly section: AppSection;
  readonly onSectionChange: (section: AppSection) => void;
  readonly onLogout: () => void;
};

export function Topbar({ operator, section, onSectionChange, onLogout }: TopbarProps) {
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

        <nav className="product-nav" aria-label="Áreas do sistema">
          <button type="button" aria-current={section === "users" ? "page" : undefined} onClick={() => onSectionChange("users")}><Users size={16} />Usuários</button>
          {operator.role === "ADMIN" && <button type="button" aria-current={section === "team" ? "page" : undefined} onClick={() => onSectionChange("team")}><UsersRound size={16} />Equipe e acessos</button>}
        </nav>

        <div className="operator-menu">
          <span><strong>{operator.nome}</strong><small>{operator.role}</small></span>
          <Button variant="icon" type="button" title="Sair" aria-label="Sair" onClick={onLogout}><LogOut size={16} /></Button>
        </div>
      </div>
    </header>
  );
}
