// app/types/collection.ts

export type GradeCompany = "raw" | "psa" | "beckett";

export type CollectionCard = {
  id: string;
  cardId: string;
  name: string;
  setName: string;
  image: string;
  number: string;

  purchasePrice: number;
  rawValue: number;

  psa8?: number;
  psa9?: number;
  psa10?: number;

  beckett8?: number;
  beckett9?: number;
  beckett10?: number;
  beckettBlackLabel?: number;

  condition: string;
  quantity: number;
  dateAdded: string;
};