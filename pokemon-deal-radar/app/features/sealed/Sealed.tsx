"use client";

import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import { getPokemonSets } from "../../api/pokemonApi";
import { formatEuro, getSetLogoUrl } from "../../lib/pokemonHelpers";
import { supabase } from "../../lib/supabaseClient";
import type { PokemonSet } from "../../types/pokemon";

type SealedInventoryItem = {
  id: string;
  quantity: number;
  purchase_price: number;
  products: {
    id: string;
    name: string;
    set_name: string | null;
    image_url: string | null;
    market_price: number | null;
    sealed_type: string | null;
    status: string | null;
  } | null;
};

export default function Sealed() {
  const [products, setProducts] = useState<SealedInventoryItem[]>([]);
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSetId, setSelectedSetId] = useState("");
  const [setSearch, setSetSearch] = useState("");
  const [showSetOptions, setShowSetOptions] = useState(false);

  const [type, setType] = useState("ETB");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [status, setStatus] = useState<"sealed" | "opened" | "sold">("sealed");

  const sortedSets = [...sets].sort((a, b) => a.name.localeCompare(b.name));

  const filteredSets = sortedSets.filter((set) =>
    set.name.toLowerCase().includes(setSearch.toLowerCase())
  );

  async function loadSealedProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        quantity,
        purchase_price,
        products (
          id,
          name,
          set_name,
          image_url,
          market_price,
          sealed_type,
          status
        )
      `)
      .eq("products.type", "sealed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Sealed laden mislukt:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    const sealedOnly = (data ?? []).filter((item: any) => item.products !== null);
    setProducts(sealedOnly as unknown as SealedInventoryItem[]);
    setLoading(false);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPokemonSets();
        setSets(result);
      } catch (error) {
        console.error("Sets laden mislukt:", error);
      }

      await loadSealedProducts();
    }

    loadData();
  }, []);

  async function handleAddSealedProduct() {
    if (!setSearch.trim()) {
      alert("Vul een productnaam of setnaam in.");
      return;
    }

    setSaving(true);

    try {
      const selectedSet = sets.find((set) => set.id === selectedSetId);
      const productName = selectedSet?.name ?? setSearch.trim();
      const productType = type;
      const qty = Math.max(1, Number(quantity || 1));
      const purchase = Number(purchasePrice || 0);
      const market = Number(currentValue || 0);

      const { data: existingProduct, error: existingError } = await supabase
        .from("products")
        .select("id")
        .eq("type", "sealed")
        .eq("name", productName)
        .eq("sealed_type", productType)
        .maybeSingle();

      if (existingError) {
        console.error("Bestaand sealed product zoeken mislukt:", existingError);
        alert(existingError.message);
        return;
      }

      if (existingProduct) {
        const { data: existingInventory, error: inventoryFindError } =
          await supabase
            .from("inventory")
            .select("id, quantity")
            .eq("product_id", existingProduct.id)
            .maybeSingle();

        if (inventoryFindError) {
          console.error("Inventory zoeken mislukt:", inventoryFindError);
          alert(inventoryFindError.message);
          return;
        }

        if (existingInventory) {
          const { error: updateError } = await supabase
            .from("inventory")
            .update({
              quantity: Number(existingInventory.quantity ?? 0) + qty,
              purchase_price: purchase,
            })
            .eq("id", existingInventory.id);

          if (updateError) {
            console.error("Aantal verhogen mislukt:", updateError);
            alert(updateError.message);
            return;
          }

          await supabase
            .from("products")
            .update({
              market_price: market,
              status,
              image_url: getSetLogoUrl(selectedSet),
            })
            .eq("id", existingProduct.id);

          alert(`${productName} aantal verhoogd!`);
          resetForm();
          await loadSealedProducts();
          return;
        }
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          type: "sealed",
          name: productName,
          set_name: productName,
          set_id: selectedSet?.id,
          image_url: getSetLogoUrl(selectedSet),
          market_price: market,
          sealed_type: productType,
          status,
          source: "manual",
        })
        .select("id")
        .single();

      if (productError) {
        console.error("Sealed product opslaan mislukt:", productError);
        alert(productError.message);
        return;
      }

      const { error: inventoryError } = await supabase.from("inventory").insert({
        product_id: product.id,
        quantity: qty,
        purchase_price: purchase,
      });

      if (inventoryError) {
        console.error("Inventory opslaan mislukt:", inventoryError);
        alert(inventoryError.message);
        return;
      }

      alert(`${productName} toegevoegd!`);
      resetForm();
      await loadSealedProducts();
    } catch (error) {
      console.error("Onverwachte fout:", error);
      alert("Er ging iets mis bij opslaan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(inventoryId: string, productId: string) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Verwijderen mislukt:", error);
      alert(error.message);
      return;
    }

    await loadSealedProducts();
  }

  function resetForm() {
    setSelectedSetId("");
    setSetSearch("");
    setType("ETB");
    setQuantity("1");
    setPurchasePrice("");
    setCurrentValue("");
    setStatus("sealed");
  }

  return (
    <>
      <h2 className="text-3xl md:text-4xl font-bold mb-2">Sealed collectie</h2>
      <p className="text-slate-400 mb-8">
        Voeg ETB’s, booster boxes, booster bundles en Japanse boxen toe.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
        <h3 className="text-xl font-bold mb-4">Sealed product toevoegen</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              value={setSearch}
              onFocus={() => setShowSetOptions(true)}
              onChange={(e) => {
                setSetSearch(e.target.value);
                setSelectedSetId("");
                setShowSetOptions(true);
              }}
              placeholder="Zoek een set..."
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
            />

            {showSetOptions && filteredSets.length > 0 && !selectedSetId && (
              <div className="absolute z-20 mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {filteredSets.map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => {
                      setSelectedSetId(set.id);
                      setSetSearch(set.name);
                      setShowSetOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-200 text-left"
                  >
                    {getSetLogoUrl(set) && (
                      <img
                        src={getSetLogoUrl(set)}
                        alt={set.name}
                        className="h-8 w-12 object-contain"
                      />
                    )}
                    <span>{set.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
          >
            <option value="ETB">ETB</option>
            <option value="Booster Box">Booster Box</option>
            <option value="Booster Bundle">Booster Bundle</option>
            <option value="Japanse Box">Japanse Box</option>
            <option value="Collection Box">Collection Box</option>
            <option value="Overig">Overig</option>
          </select>

          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Aantal"
            type="number"
            min="1"
            className="p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
          />

          <input
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="Inkoopprijs per stuk"
            type="number"
            min="0"
            step="0.01"
            className="p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
          />

          <input
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="Huidige waarde per stuk"
            type="number"
            min="0"
            step="0.01"
            className="p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "sealed" | "opened" | "sold")
            }
            className="p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
          >
            <option value="sealed">Sealed</option>
            <option value="opened">Geopend</option>
            <option value="sold">Verkocht</option>
          </select>
        </div>

        <button
          onClick={handleAddSealedProduct}
          disabled={saving}
          className="mt-4 bg-yellow-400 text-slate-950 font-bold rounded-xl px-6 py-4 disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Toevoegen"}
        </button>
      </div>

      {loading && <EmptyState text="Sealed producten laden..." />}

      {!loading && products.length === 0 && (
        <EmptyState text="Nog geen sealed producten toegevoegd." />
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((item) => {
            const product = item.products;
            if (!product) return null;

            const totalPurchase =
              Number(item.purchase_price ?? 0) * Number(item.quantity ?? 1);
            const totalValue =
              Number(product.market_price ?? 0) * Number(item.quantity ?? 1);
            const profit = totalValue - totalPurchase;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-20 object-contain mb-4"
                  />
                )}

                <h3 className="font-bold text-xl mb-1">{product.name}</h3>

                <p className="text-sm text-slate-400 mb-3">
                  {product.sealed_type} · {product.status}
                </p>

                <div className="space-y-1 text-sm">
                  <p>Aantal: {item.quantity}</p>
                  <p>Inkoop p/st: {formatEuro(Number(item.purchase_price ?? 0))}</p>
                  <p>Waarde p/st: {formatEuro(Number(product.market_price ?? 0))}</p>
                  <p className="text-yellow-400 font-bold">
                    Totale waarde: {formatEuro(totalValue)}
                  </p>
                  <p
                    className={`font-bold ${
                      profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    Winst/verlies: {formatEuro(profit)}
                  </p>
                </div>

                <button
                  onClick={() => deleteProduct(item.id, product.id)}
                  className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl p-3"
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