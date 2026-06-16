"use client";

import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import { formatEuro } from "../../lib/pokemonHelpers";
import { supabase } from "../../lib/supabaseClient";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  async function loadDashboard() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        quantity,
        purchase_price,
        products (
          id,
          type,
          market_price
        )
      `);

    if (error) {
      console.error("Dashboard error:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    let value = 0;
    let purchase = 0;
    let items = 0;

    (data ?? []).forEach((item: any) => {
      const quantity = Number(item.quantity ?? 1);
      const purchasePrice = Number(item.purchase_price ?? 0);
      const product = item.products;
      const marketPrice = Number(product?.market_price ?? 0);

      value += marketPrice * quantity;
      purchase += purchasePrice * quantity;
      items += quantity;
    });

    setTotalValue(value);
    setPurchaseTotal(purchase);
    setTotalItems(items);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const profit = totalValue - purchaseTotal;

  if (loading) {
    return <EmptyState text="Dashboard laden..." />;
  }

  return (
    <>
      <h2 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h2>
      <p className="text-slate-400 mb-8">
        Overzicht van je kaarten, sealed producten en potentiële winst.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Totale marktwaarde" value={formatEuro(totalValue)} />
        <StatCard title="Inkoop totaal" value={formatEuro(purchaseTotal)} />
        <StatCard title="Winst/verlies" value={formatEuro(profit)} />
        <StatCard title="Aantal producten" value={totalItems.toString()} />
      </div>
    </>
  );
}