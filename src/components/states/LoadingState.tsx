interface LoadingStateProps {
  message: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <section role="status" aria-busy="true" className="glass-panel p-8 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-white/10 border-t-accent-400 motion-safe:animate-spin"
      />
      <p className="text-sm text-slate-300">{message}</p>
    </section>
  );
}
