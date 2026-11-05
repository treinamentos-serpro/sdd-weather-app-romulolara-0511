interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section role="alert" className="glass-panel border-rose-300/20 p-8 text-center">
      <h2 className="text-lg font-semibold">Não foi possível carregar os dados</h2>
      <p className="mt-3 text-sm text-slate-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold transition hover:bg-accent-500 motion-reduce:transition-none"
      >
        Tentar novamente
      </button>
    </section>
  );
}
