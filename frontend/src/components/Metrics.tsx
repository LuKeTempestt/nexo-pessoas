type MetricsProps = {
  total: number;
  createdToday: number;
};

export function Metrics({ total, createdToday }: MetricsProps) {
  return (
    <section className="overview" aria-label="Resumo dos usuários">
      <div className="metric">
        <span className="metric__label">Total de usuários</span>
        <strong className="metric__value">{total}</strong>
      </div>
      <div className="metric">
        <span className="metric__label">Cadastrados hoje</span>
        <strong className="metric__value">{createdToday}</strong>
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
