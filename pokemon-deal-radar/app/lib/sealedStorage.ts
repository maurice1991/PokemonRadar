export type SealedProduct = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  logo?: string;
  currentValue: number;
  status: "sealed" | "opened" | "sold";
  dateAdded: string;
};

const STORAGE_KEY = "pokemon-sealed-products";

export function getSealedProducts(): SealedProduct[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  return JSON.parse(data);
}

export function saveSealedProducts(products: SealedProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function addSealedProduct(product: SealedProduct) {
  const current = getSealedProducts();
  const updated = [product, ...current];

  saveSealedProducts(updated);

  return updated;
}

export function removeSealedProduct(productId: string) {
  const current = getSealedProducts();

  const updated = current.filter((product) => product.id !== productId);

  saveSealedProducts(updated);

  return updated;
}