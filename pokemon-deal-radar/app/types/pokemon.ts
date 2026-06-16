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
};

export type SealedProduct = {
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