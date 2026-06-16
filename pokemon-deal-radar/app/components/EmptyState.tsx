type EmptyStateProps = {
  text: string;
};

export default function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
      {text}
    </div>
  );
}