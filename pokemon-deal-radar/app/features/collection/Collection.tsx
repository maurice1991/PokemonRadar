"use client";

import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import { formatEuro } from "../../lib/pokemonHelpers";
import { supabase } from "../../lib/supabaseClient";

export default function Collection() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCollection() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        quantity,
        purchase_price,
        product_id,
        products (
          id,
          name,
          set_name,
          image_url,
          market_price
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCards(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCollection();
  }, []);

  async function deleteCard(productId: string) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    loadCollection();
  }

  if (loading) {
    return <EmptyState text="Collectie laden..." />;
  }

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">Mijn collectie</h2>
      <p className="text-slate-400 mb-8">
        Overzicht van alle kaarten in je collectie.
      </p>

      {cards.length === 0 && (
        <EmptyState text="Nog geen kaarten toegevoegd." />
      )}

      {cards.length > 0 && (
        <div className="grid md:grid-cols-4 gap-5">
          {cards.map((item) => {
            const product = item.products;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                {product?.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 object-contain mb-4"
                  />
                ) : (
                  <div className="w-full h-64 bg-slate-950 rounded-xl mb-4 flex items-center justify-center text-slate-500">
                    Geen afbeelding
                  </div>
                )}

                <h3 className="font-bold mb-1">
                  {product?.name}
                </h3>

                <p className="text-sm text-slate-400">
                  {product?.set_name}
                </p>

                <p className="text-yellow-400 font-bold mt-3">
                  Aantal: {item.quantity}
                </p>

                <p className="text-green-400 font-bold mt-2">
                  Waarde: {formatEuro(Number(product?.market_price ?? 0))}
                </p>

                <p className="text-blue-400 font-bold">
                  Inkoop: {formatEuro(Number(item.purchase_price ?? 0))}
                </p>

                <button
                  onClick={() => deleteCard(product.id)}
                  className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl p-3"
                >
                  Verwijderen
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}