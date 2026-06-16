"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Overview from "./features/overview/Overview";
import Collection from "./features/collection/Collection";
import AddCard from "./features/add-card/AddCard";
import Sealed from "./features/sealed/Sealed";
import DealRadar from "./features/deals/DealRadar";
import type { DashboardTab } from "./types/dashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row">
         <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <section className="flex-1 p-4 md:p-8">
          {activeTab === "overview" && <Overview />}
          {activeTab === "collection" && <Collection />}
          {activeTab === "add-card" && <AddCard />}
          {activeTab === "sealed" && <Sealed />}
          {activeTab === "deals" && <DealRadar />}
        </section>
      </div>
    </main>
  );
}



