"use client";

import { useEffect, useState,useRef } from "react";
import {
  getCard,
  getCardmarketPrice,
  getCardsFromSet,
  getPokemonSets,
  getTcgplayerPrice,
  searchCardsBySetAndNumber,
} from "./api/pokemonApi";
import { fetchMarktplaatsListings } from "./lib/marktplaatsApi";
import {
  addCardToCollection,
  getCollection,
  removeCardFromCollection,
} from "./lib/collectionStorage";
import {
  addSealedProduct,
  getSealedProducts,
  removeSealedProduct,
} from "./lib/sealedStorage";

type DashboardTab = "overview" | "collection" | "add-card" | "sealed" | "deals";

type PokemonSet = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    total?: number;
    official?: number;
  };
};

type PokemonCard = {
  id: string;
  name: string;
  image?: string;
  localId?: string;
  set?: PokemonSet;
};

type SealedProduct = {
  id: string;
  setId?: string;
  name: string;
  logo?: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentValue: number;
  status: "sealed" | "opened" | "sold";
  dateAdded: string;
};

function formatEuro(value: number) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function getSetLogoUrl(set?: PokemonSet | null) {
  if (!set?.logo) return "";

  if (set.logo.startsWith("http")) {
    return set.logo.endsWith(".webp") ? set.logo : `${set.logo}.webp`;
  }

  return set.logo;
}

function getCardImage(card: PokemonCard) {
  if (!card.image) return "";

  if (card.image.startsWith("http")) {
    return card.image.endsWith(".webp") ? card.image : `${card.image}/high.webp`;
  }

  return card.image;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="flex-1 p-8">
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

function Sidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}) {
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
      <p className="text-sm text-slate-400 mb-8">Collectie, waarde en deals</p>

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

function Overview() {
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Collection() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    setCards(getCollection());
  }, []);

  function deleteCard(cardId: string) {
    const updatedCollection = removeCardFromCollection(cardId);
    setCards(updatedCollection);
  }

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">Mijn collectie</h2>
      <p className="text-slate-400 mb-8">Overzicht van alle kaarten in je collectie.</p>

      {cards.length === 0 && <EmptyState text="Nog geen kaarten toegevoegd." />}

      {cards.length > 0 && (
        <div className="grid md:grid-cols-4 gap-5">
          {cards.map((card) => (
            <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              {card.image ? (
                <img src={card.image} alt={card.name} className="w-full h-64 object-contain mb-4" />
              ) : (
                <div className="w-full h-64 bg-slate-950 rounded-xl mb-4 flex items-center justify-center text-slate-500">
                  Geen afbeelding
                </div>
              )}

              <h3 className="font-bold mb-1">{card.name}</h3>
              <p className="text-sm text-slate-400">{card.setName}</p>
              <p className="text-sm text-slate-500 mb-3">#{card.number}</p>

              <p className="text-yellow-400 font-bold">Aantal: {card.quantity}</p>
              <p className="text-green-400 font-bold mt-2">
                Cardmarket: {formatEuro(Number(card.rawValue ?? 0))}
              </p>
              <p className="text-blue-400 font-bold">
                TCGPlayer: ${Number(card.tcgplayerValue ?? 0).toFixed(2)}
              </p>

              <button
                onClick={() => deleteCard(card.id)}
                className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl p-3"
              >
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AddCard() {
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [setSearch, setSetSearch] = useState("");
  const [showSetOptions, setShowSetOptions] = useState(false);

  const sortedSets = [...sets].sort((a, b) => a.name.localeCompare(b.name));

  const filteredSets = sortedSets.filter((set) =>
    set.name.toLowerCase().includes(setSearch.toLowerCase())
  );

  const setDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadSets() {
      setLoadingSets(true);

      try {
        const result = await getPokemonSets();
        setSets(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSets(false);
      }

      
    }

    loadSets();
  }, []);

  function handleClickOutside(event: MouseEvent) {
    if (
      setDropdownRef.current &&
      !setDropdownRef.current.contains(event.target as Node)
    ) {
      setShowSetOptions(false);
    }
  }

  useEffect(() => {
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

      const result = await searchCardsBySetAndNumber(selectedSetId, cardNumber);
      setResults(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCards(false);
    }
  }

  async function addToCollection(card: PokemonCard) {
    const selectedSet = sets.find((set) => set.id === selectedSetId);
    const fullCard = await getCard(card.id);

    const collectionCard = {
      id: crypto.randomUUID(),
      cardId: card.id,
      name: card.name,
      setName: card.set?.name ?? selectedSet?.name ?? "Onbekende set",
      image: getCardImage(card),
      number: card.localId ?? cardNumber,
      purchasePrice: 0,
      rawValue: getCardmarketPrice(fullCard),
      tcgplayerValue: getTcgplayerPrice(fullCard),
      psa8: 0,
      psa9: 0,
      psa10: 0,
      beckett8: 0,
      beckett9: 0,
      beckett10: 0,
      beckettBlackLabel: 0,
      condition: "Near Mint",
      quantity: 1,
      dateAdded: new Date().toISOString(),
    };

    addCardToCollection(collectionCard);
    alert(`${card.name} toegevoegd aan je collectie!`);
  }

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">Kaart toevoegen</h2>
      <p className="text-slate-400 mb-8">
        Kies een set. Laat kaartnummer leeg om alle kaarten uit die set te tonen.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
        <h3 className="text-xl font-bold mb-4">Zoeken binnen set</h3>

        <div className="grid md:grid-cols-3 gap-4">
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
                      <img src={getSetLogoUrl(set)} alt={set.name} className="h-8 w-12 object-contain" />
                    )}
                    <span>{set.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Kaartnummer</label>

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

          <div className="grid md:grid-cols-4 gap-5">
            {results.map((card) => (
              <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
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
                  {card.set?.name ?? sets.find((set) => set.id === selectedSetId)?.name}
                </p>
                <p className="text-sm text-slate-500 mb-4">Nummer: {card.localId ?? cardNumber}</p>

                <button
                  onClick={() => addToCollection(card)}
                  className="w-full bg-yellow-400 text-slate-950 font-bold rounded-xl p-3"
                >
                  Toevoegen aan collectie
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Sealed() {
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

  function deleteProduct(productId: string) {
    const updated = removeSealedProduct(productId);
    setProducts(updated);
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

function DealRadar() {
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  async function handleFetchListings() {
    setLoadingListings(true);

    try {
      const result = await fetchMarktplaatsListings();
      const listingsWithPrice = result.filter((listing: any) => listing.price > 0);
      setListings(listingsWithPrice);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingListings(false);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">Deal radar</h2>
      <p className="text-slate-400 mb-8">
        Haal Marktplaats advertenties op en vergelijk ze later met marktprijzen.
      </p>

      <button
        onClick={handleFetchListings}
        disabled={loadingListings}
        className="px-6 py-4 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 mb-8"
      >
        {loadingListings ? "Marktplaats ophalen..." : "Haal Marktplaats deals op"}
      </button>

      <div className="grid md:grid-cols-4 gap-5">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {listing.image && (
              <img src={listing.image} alt={listing.title} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}

            <h3 className="font-bold mb-2 line-clamp-2">{listing.title}</h3>
            <p className="text-green-400 font-bold text-xl mb-1">{formatEuro(listing.price)}</p>
            <p className="text-sm text-slate-400 mb-4">{listing.city}</p>

            <a
              href={listing.url}
              target="_blank"
              className="block text-center bg-yellow-400 text-slate-950 font-bold rounded-xl p-3"
            >
              Bekijk advertentie
            </a>
          </div>
        ))}
      </div>

      {!loadingListings && listings.length === 0 && (
        <EmptyState text="Nog geen Marktplaats listings opgehaald." />
      )}
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
      {text}
    </div>
  );
}