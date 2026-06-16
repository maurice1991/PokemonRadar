"use client";

import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { formatEuro } from "../../lib/pokemonHelpers";
import { getCollection } from "../../lib/collectionStorage";
import { getSealedProducts } from "../../lib/sealedStorage";
import type { SealedProduct } from "../../types/pokemon";

export default function Overview() {
  const [cards, setCards] = useState<any[]>([]);
  const [sealedProducts, setSealedProducts] = useState<SealedProduct[]>([]);

  useEffect(() => {
    setCards(getCollection());
    setSealedProducts(getSealedProducts());
  }, []);

  const cardValue = cards.reduce((total, card) => {
    return total + Number(card.rawValue ?? 0) * Number(card.quantity ?? 1);
  }, 0);

  const sealedValue = sealedProducts.reduce((total, product) => {
    return total + Number(product.currentValue ?? 0) * Number(product.quantity ?? 1);
  }, 0);

  const purchaseTotal = [
    ...cards.map((card) => Number(card.purchasePrice ?? 0) * Number(card.quantity ?? 1)),
    ...sealedProducts.map(
      (product) => Number(product.purchasePrice ?? 0) * Number(product.quantity ?? 1)
    ),
  ].reduce((total, value) => total + value, 0);

  const totalValue = cardValue + sealedValue;
  const profit = totalValue - purchaseTotal;

  const totalItems =
    cards.reduce((total, card) => total + Number(card.quantity ?? 1), 0) +
    sealedProducts.reduce((total, product) => total + Number(product.quantity ?? 1), 0);

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
      <p className="text-slate-400 mb-8">
        Overzicht van je kaarten, sealed producten en potentiële winst.
      </p>

      <div className="grid md:grid-cols-4 gap-5">
        <StatCard title="Totale waarde" value={formatEuro(totalValue)} />
        <StatCard title="Inkoop totaal" value={formatEuro(purchaseTotal)} />
        <StatCard title="Winst/verlies" value={formatEuro(profit)} />
        <StatCard title="Aantal items" value={totalItems.toString()} />
      </div>
    </>
  );
}