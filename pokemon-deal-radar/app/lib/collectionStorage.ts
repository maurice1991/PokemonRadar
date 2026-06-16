export type CollectionCard = {
  id: string;
  cardId: string;
  name: string;
  setName: string;
  image: string;
  number: string;
  purchasePrice: number;
  rawValue: number;
  psa8: number;
  psa9: number;
  psa10: number;
  beckett8: number;
  beckett9: number;
  beckett10: number;
  beckettBlackLabel: number;
  condition: string;
  quantity: number;
  dateAdded: string;
};

const STORAGE_KEY = "pokemon-collection";

export function getCollection(): CollectionCard[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) return [];

  return JSON.parse(data);
}

export function saveCollection(collection: CollectionCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export function addCardToCollection(card: CollectionCard) {
  const currentCollection = getCollection();

  const updatedCollection = [card, ...currentCollection];

  saveCollection(updatedCollection);

  return updatedCollection;
}

export function removeCardFromCollection(cardId: string) {
  const currentCollection = getCollection();

  const updatedCollection = currentCollection.filter(
    (card) => card.id !== cardId
  );

  saveCollection(updatedCollection);

  return updatedCollection;
}