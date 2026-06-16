"use client";

import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import { formatEuro } from "../../lib/pokemonHelpers";
import { fetchMarktplaatsListings } from "../../lib/marktplaatsApi";


export default function DealRadar() {
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
