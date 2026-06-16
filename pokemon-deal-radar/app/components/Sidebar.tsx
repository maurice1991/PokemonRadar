import type { DashboardTab } from "../types/dashboard";

type SidebarProps = {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const items: { id: DashboardTab; label: string }[] = [
    { id: "overview", label: "Dashboard" },
    { id: "collection", label: "Mijn collectie" },
    { id: "add-card", label: "Kaart toevoegen" },
    { id: "sealed", label: "Sealed producten" },
    { id: "deals", label: "Deal radar" },
  ];

  return (
    <aside className="w-72 min-h-screen bg-slate-900 border-r border-slate-800 p-6">
      <h1 className="text-2xl font-bold mb-1">Poké Portfolio</h1>
      <p className="text-sm text-slate-400 mb-8">
        Collectie, waarde en deals
      </p>

      <nav className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold ${
              activeTab === item.id
                ? "bg-yellow-400 text-slate-950"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}