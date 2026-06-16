import type { ComponentType } from "react";
import type { DashboardTab } from "../types/dashboard";
import {
  LayoutDashboard,
  Library,
  PlusCircle,
  Package,
  Search,
  type LucideProps,
} from "lucide-react";

type SidebarItem = {
  id: DashboardTab;
  label: string;
  icon: ComponentType<LucideProps>;
};

type SidebarProps = {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const items: SidebarItem[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "collection", label: "Collectie", icon: Library },
    { id: "add-card", label: "Kaart toevoegen", icon: PlusCircle },
    { id: "sealed", label: "Sealed", icon: Package },
    { id: "deals", label: "Deal Radar", icon: Search },
  ];

  return (
    <aside className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-1">Poké Portfolio</h1>

      <p className="text-sm text-slate-400 mb-4 md:mb-8">
        Collectie, waarde en deals
      </p>

      <nav className="grid grid-cols-2 gap-2 md:block md:space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-start md:justify-start gap-2 px-4 py-3 rounded-xl font-semibold transition ${
                activeTab === item.id
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}