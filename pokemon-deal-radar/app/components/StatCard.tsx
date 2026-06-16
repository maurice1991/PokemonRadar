type StatCardProps = {
  title: string;
  value: string;
};

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}