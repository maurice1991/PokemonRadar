export type MarketplaceListing = {
  id: string;
  title: string;
  askingPrice: number;
  platform: "Marktplaats";
  location: string;
  url: string;
  image?: string;
};