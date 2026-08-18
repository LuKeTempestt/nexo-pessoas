type MetricsProps = {
  readonly total: number;
  readonly active: number;
};

export function Metrics({ total, active }: MetricsProps) {
  return (
    <section className="overview" aria-label="Resumo dos usuários">
      <div className="metric">
        <span className="metric__label">Total de usuários</span>
        <strong className="metric__value">{total}</strong>
      </div>
      <div className="metric">
        <span className="metric__label">Usuários ativos</span>
        <strong className="metric__value">{active}</strong>
      </div>
      <div className="metric metric--status">
        <span className="metric__label">Disponibilidade</span>
        <strong className="metric__value metric__value--status">
          <span className="status-dot" aria-hidden="true" />
          Operação normal
        </strong>
      </div>
    </section>
  );
}
