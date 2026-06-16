"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCard,
  getCardmarketPrice,
  getCardsFromSet,
  getPokemonSets,
  searchCardsBySetAndNumber,
} from "../../api/pokemonApi";
import { supabase } from "../../lib/supabaseClient";
import { getCardImage, getSetLogoUrl } from "../../lib/pokemonHelpers";
import type { PokemonCard, PokemonSet } from "../../types/pokemon";

export default function AddCard() {
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [addingCardId, setAddingCardId] = useState<string | null>(null);
  const [setSearch, setSetSearch] = useState("");
  const [showSetOptions, setShowSetOptions] = useState(false);

  const setDropdownRef = useRef<HTMLDivElement | null>(null);

  const sortedSets = [...sets].sort((a, b) => a.name.localeCompare(b.name));

  const filteredSets = sortedSets.filter((set) =>
    set.name.toLowerCase().includes(setSearch.toLowerCase())
  );

  useEffect(() => {
    async function loadSets() {
      setLoadingSets(true);

      try {
        const result = await getPokemonSets();
        setSets(result);
      } catch (error) {
        console.error("Sets laden mislukt:", error);
        alert("Sets laden mislukt.");
      } finally {
        setLoadingSets(false);
      }
    }

    loadSets();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        setDropdownRef.current &&
        !setDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSetOptions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleSearchBySetAndNumber() {
    if (!selectedSetId) {
      alert("Kies eerst een set.");
      return;
    }

    setLoadingCards(true);
    setResults([]);

    try {
      if (!cardNumber.trim()) {
        const allCardsFromSet = await getCardsFromSet(selectedSetId);
        setResults(allCardsFromSet);
        return;
      }

      const result = await searchCardsBySetAndNumber(
        selectedSetId,
        cardNumber.trim()
      );

      setResults(result);
    } catch (error) {
      console.error("Kaarten zoeken mislukt:", error);
      alert("Kaarten zoeken mislukt.");
    } finally {
      setLoadingCards(false);
    }
  }

  async function addToCollection(card: PokemonCard) {
    if (addingCardId) return;

    setAddingCardId(card.id);

    try {
      const selectedSet = sets.find((set) => set.id === selectedSetId);
      const setName = card.set?.name ?? selectedSet?.name ?? "Onbekende set";
      const setId = card.set?.id ?? selectedSet?.id ?? selectedSetId;
      const cardNr = card.localId ?? cardNumber.trim();

      const fullCard = await getCard(card.id);
      const marketPrice = getCardmarketPrice(fullCard);

      const { data: existingProduct, error: existingProductError } =
        await supabase
          .from("products")
          .select("id")
          .eq("card_id", card.id)
          .maybeSingle();

      if (existingProductError) {
        console.error("Bestaand product zoeken mislukt:", existingProductError);
        alert(existingProductError.message);
        return;
      }

      if (existingProduct) {
        const { data: existingInventory, error: existingInventoryError } =
          await supabase
            .from("inventory")
            .select("id, quantity")
            .eq("product_id", existingProduct.id)
            .maybeSingle();

        if (existingInventoryError) {
          console.error(
            "Bestaande inventory zoeken mislukt:",
            existingInventoryError
          );
          alert(existingInventoryError.message);
          return;
        }

        if (existingInventory) {
          const { error: updateError } = await supabase
            .from("inventory")
            .update({
              quantity: Number(existingInventory.quantity ?? 0) + 1,
            })
            .eq("id", existingInventory.id);

          if (updateError) {
            console.error("Aantal verhogen mislukt:", updateError);
            alert(updateError.message);
            return;
          }

          alert(`${card.name} aantal verhoogd!`);
          return;
        }

        const { error: inventoryInsertError } = await supabase
          .from("inventory")
          .insert({
            product_id: existingProduct.id,
            quantity: 1,
            purchase_price: 0,
          });

        if (inventoryInsertError) {
          console.error("Inventory aanmaken mislukt:", inventoryInsertError);
          alert(inventoryInsertError.message);
          return;
        }

        alert(`${card.name} toegevoegd aan je collectie!`);
        return;
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          type: "card",
          card_id: card.id,
          card_number: cardNr,
          name: card.name,
          set_name: setName,
          set_id: setId,
          image_url: getCardImage(card),
          market_price: marketPrice,
          source: "cardmarket",
        })
        .select("id")
        .single();

      if (productError) {
        console.error("Product opslaan mislukt:", productError);
        alert(productError.message);
        return;
      }

      const { error: inventoryError } = await supabase.from("inventory").insert({
        product_id: product.id,
        quantity: 1,
        purchase_price: 0,
      });

      if (inventoryError) {
        console.error("Inventory opslaan mislukt:", inventoryError);
        alert(inventoryError.message);
        return;
      }

      alert(`${card.name} opgeslagen in Supabase!`);
    } catch (error) {
      console.error("Onverwachte fout bij toevoegen:", error);
      alert("Er ging iets mis bij toevoegen.");
    } finally {
      setAddingCardId(null);
    }
  }

  return (
    <>
      <h2 className="text-3xl md:text-4xl font-bold mb-2">Kaart toevoegen</h2>
      <p className="text-slate-400 mb-8">
        Kies een set. Laat kaartnummer leeg om alle kaarten uit die set te tonen.
      </p>

      <div
        ref={setDropdownRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8"
      >
        <h3 className="text-xl font-bold mb-4">Zoeken binnen set</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm text-slate-400 mb-2">Set</label>

            <input
              value={setSearch}
              onFocus={() => setShowSetOptions(true)}
              onChange={(e) => {
                setSetSearch(e.target.value);
                setSelectedSetId("");
                setShowSetOptions(true);
              }}
              placeholder={loadingSets ? "Sets laden..." : "Zoek een set..."}
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

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Kaartnummer
            </label>

            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchBySetAndNumber();
              }}
              placeholder="Bijv. 056 of leeg laten"
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-yellow-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearchBySetAndNumber}
              disabled={loadingCards}
              className="w-full p-4 rounded-xl bg-yellow-400 text-slate-950 font-bold disabled:opacity-50"
            >
              {loadingCards ? "Zoeken..." : "Toon kaarten"}
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Resultaten</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {results.map((card) => {
              const isAdding = addingCardId === card.id;

              return (
                <div
                  key={card.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
                >
                  {getCardImage(card) ? (
                    <img
                      src={getCardImage(card)}
                      alt={card.name}
                      className="w-full h-64 object-contain mb-4"
                    />
                  ) : (
                    <div className="w-full h-64 bg-slate-950 rounded-xl mb-4 flex items-center justify-center text-slate-500">
                      Geen afbeelding
                    </div>
                  )}

                  <h3 className="font-bold mb-1">{card.name}</h3>

                  <p className="text-sm text-slate-400 mb-1">
                    {card.set?.name ??
                      sets.find((set) => set.id === selectedSetId)?.name}
                  </p>

                  <p className="text-sm text-slate-500 mb-4">
                    Nummer: {card.localId ?? cardNumber}
                  </p>

                  <button
                    onClick={() => addToCollection(card)}
                    disabled={isAdding}
                    className="w-full bg-yellow-400 text-slate-950 font-bold rounded-xl p-3 disabled:opacity-50"
                  >
                    {isAdding ? "Toevoegen..." : "Toevoegen aan collectie"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}