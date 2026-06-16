"use client";

import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import { getPokemonSets } from "../../api/pokemonApi";
import { formatEuro, getSetLogoUrl } from "../../lib/pokemonHelpers";
import {
  addSealedProduct,
  getSealedProducts,
  removeSealedProduct,
} from "../../lib/sealedStorage";
import type { PokemonSet, SealedProduct } from "../../types/pokemon";

export default function Sealed() {
  const [products, setProducts] = useState<SealedProduct[]>([]);
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [setSearch, setSetSearch] = useState("");
  const [showSetOptions, setShowSetOptions] = useState(false);

  const [type, setType] = useState("ETB");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [status, setStatus] = useState<"sealed" | "opened" | "sold">("sealed");

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPokemonSets();
        setSets(result);
      } catch (error) {
        console.error(error);
      }

      setProducts(getSealedProducts());
    }

    loadData();
  }, []);


  const sortedSets = [...sets].sort((a, b) => a.name.localeCompare(b.name));

  const filteredSets = sortedSets.filter((set) =>
    set.name.toLowerCase().includes(setSearch.toLowerCase())
  );

  function handleAddSealedProduct() {
    if (!setSearch.trim()) {
      alert("Vul een productnaam of setnaam in.");
      return;
    }

    const selectedSet = sets.find((set) => set.id === selectedSetId);

    const product: SealedProduct = {
      id: crypto.randomUUID(),
      setId: selectedSet?.id,
      logo: getSetLogoUrl(selectedSet),
      name: selectedSet?.name ?? setSearch,
      type,
      quantity: Number(quantity || 1),
      purchasePrice: Number(purchasePrice || 0),
      currentValue: Number(currentValue || 0),
      status,
      dateAdded: new Date().toISOString(),
    };

    const updated = addSealedProduct(product);
    setProducts(updated);

    setSelectedSetId("");
    setSetSearch("");
    setType("ETB");
    setQuantity("1");
    setPurchasePrice("");
    setCurrentValue("");
    setStatus("sealed");
  }

async function deleteCard(
  inventoryId: string,
  productId: string
) {
  const { error: inventoryError } = await supabase
    .from("inventory")
    .delete()
    .eq("id", inventoryId);

  if (inventoryError) {
    console.error(inventoryError);
    alert(inventoryError.message);
    return;
  }

  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (productError) {
    console.error(productError);
    alert(productError.message);
    return;
  }

  Collection();
}

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">Sealed collectie</h2>
      <p className="text-slate-400 mb-8">
        Voeg ETB’s, booster boxes, booster bundles en Japanse boxen toe.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
        <h3 className="text-xl font-bold mb-4">Sealed product toevoegen</h3>

        <div className="grid md:grid-cols-3 gap-4">
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
                      <img src={getSetLogoUrl(set)} alt={set.name} className="h-8 w-12 object-contain" />
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
            onChange={(e) => setStatus(e.target.value as "sealed" | "opened" | "sold")}
            className="p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
          >
            <option value="sealed">Sealed</option>
            <option value="opened">Geopend</option>
            <option value="sold">Verkocht</option>
          </select>
        </div>

        <button
          onClick={handleAddSealedProduct}
          className="mt-4 bg-yellow-400 text-slate-950 font-bold rounded-xl px-6 py-4"
        >
          Toevoegen
        </button>
      </div>

      {products.length === 0 && <EmptyState text="Nog geen sealed producten toegevoegd." />}

      {products.length > 0 && (
        <div className="grid md:grid-cols-3 gap-5">
          {products.map((product) => {
            const totalPurchase = Number(product.purchasePrice ?? 0) * Number(product.quantity ?? 1);
            const totalValue = Number(product.currentValue ?? 0) * Number(product.quantity ?? 1);
            const profit = totalValue - totalPurchase;

            return (
              <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                {product.logo && (
                  <img src={product.logo} alt={product.name} className="h-20 object-contain mb-4" />
                )}

                <h3 className="font-bold text-xl mb-1">{product.name}</h3>

                <p className="text-sm text-slate-400 mb-3">
                  {product.type} · {product.status}
                </p>

                <div className="space-y-1 text-sm">
                  <p>Aantal: {product.quantity}</p>
                  <p>Inkoop p/st: {formatEuro(product.purchasePrice)}</p>
                  <p>Waarde p/st: {formatEuro(product.currentValue)}</p>
                  <p className="text-yellow-400 font-bold">Totale waarde: {formatEuro(totalValue)}</p>
                  <p className={`font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    Winst/verlies: {formatEuro(profit)}
                  </p>
                </div>

                <button
                  onClick={() => deleteProduct(product.id)}
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