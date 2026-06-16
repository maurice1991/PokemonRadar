import {
  PokemonSet,
  PokemonCard,
  SealedProduct,
} from "../types/pokemon";

export  function formatEuro(value: number) {
  return `€${Number(value || 0).toFixed(2)}`;
}

export  function getSetLogoUrl(set?: PokemonSet | null) {
  if (!set?.logo) return "";

  if (set.logo.startsWith("http")) {
    return set.logo.endsWith(".webp") ? set.logo : `${set.logo}.webp`;
  }

  return set.logo;
}

export  function getCardImage(card: PokemonCard) {
  if (!card.image) return "";

  if (card.image.startsWith("http")) {
    return card.image.endsWith(".webp") ? card.image : `${card.image}/high.webp`;
  }

  return card.image;
}