import { Deal } from "../types/deal";

type DealCardProps = {
  deal: Deal;
};

export default function DealCard({ deal }: DealCardProps) {
  const profit = deal.marketValue - deal.price;
  const score = Math.min(100, Math.round((profit / deal.marketValue) * 150));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <img
      src={deal.image}
      alt={deal.title}
      className="rounded-lg mb-4 w-full h-64 object-contain bg-slate-950"/>

      <h2 className="text-xl font-bold mb-3">{deal.title}</h2>

      <div className="space-y-2 text-sm">
        <p>Vraagprijs: €{deal.price}</p>
        <p>Marktwaarde: €{deal.marketValue}</p>
        <p className="text-green-400 font-bold">Mogelijke winst: €{profit}</p>
      </div>

      <div className="mt-4 bg-slate-800 rounded-full h-3">
        <div
          className="bg-yellow-400 h-3 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-2 text-yellow-400 font-bold">
        Deal Score: {score}/100
      </p>
    </div>
  );
}