export type PokemonSet = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    total?: number;
    official?: number;
  };
};

export type PokemonCard = {
  id: string;
  name: string;
  image?: string;
  localId?: string;
  set?: PokemonSet;
  pricing?: any;
};

export async function getPokemonSets(): Promise<PokemonSet[]> {
  const response = await fetch("https://api.tcgdex.net/v2/en/sets");

  if (!response.ok) {
    throw new Error("Kon Pokémon sets niet ophalen");
  }

  return response.json();
}

export async function getCardsFromSet(setId: string): Promise<PokemonCard[]> {
  const response = await fetch(`https://api.tcgdex.net/v2/en/sets/${setId}`);

  if (!response.ok) {
    throw new Error("Kon kaarten uit set niet ophalen");
  }

  const result = await response.json();

  return result.cards ?? [];
}

export async function searchCardsBySetAndNumber(
  setId: string,
  cardNumber: string
): Promise<PokemonCard[]> {
  const cards = await getCardsFromSet(setId);

const rawNumber = cardNumber.split("/")[0].trim();

const paddedNumber = rawNumber.padStart(3, "0");

return cards.filter((card) => {
  return card.localId === rawNumber || card.localId === paddedNumber;
});
}

export async function getCard(cardId: string): Promise<PokemonCard> {
  const response = await fetch(
    `https://api.tcgdex.net/v2/en/cards/${cardId}`
  );

  if (!response.ok) {
    throw new Error("Card ophalen mislukt");
  }

  return response.json();
}

export function getCardmarketPrice(card: PokemonCard) {
  return (
    card.pricing?.cardmarket?.trend ??
    card.pricing?.cardmarket?.avg30 ??
    card.pricing?.cardmarket?.avg7 ??
    card.pricing?.cardmarket?.avg1 ??
    0
  );
}

export function getTcgplayerPrice(card: PokemonCard) {
  return (
    card.pricing?.tcgplayer?.holo?.marketPrice ??
    card.pricing?.tcgplayer?.normal?.marketPrice ??
    card.pricing?.tcgplayer?.reverseHolo?.marketPrice ??
    card.pricing?.tcgplayer?.reverseHolofoil?.marketPrice ??
    0
  );
}