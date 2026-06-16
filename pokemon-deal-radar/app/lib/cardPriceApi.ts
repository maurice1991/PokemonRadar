export type CardPrices = {
  cardmarketPrice: number;
  tcgplayerPrice: number;
};

export async function getCardPrices(cardName: string) {
  const response = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(cardName)}`
  );

  if (!response.ok) {
    return {
      cardmarketPrice: 0,
      tcgplayerPrice: 0,
    };
  }

  const result = await response.json();
  const card = result.data?.[0];

  return {
    cardmarketPrice:
      card?.cardmarket?.prices?.averageSellPrice ?? 0,

    tcgplayerPrice:
      card?.tcgplayer?.prices?.holofoil?.market ??
      card?.tcgplayer?.prices?.normal?.market ??
      card?.tcgplayer?.prices?.reverseHolofoil?.market ??
      0,
  };
}