export async function fetchMarktplaatsListings() {
  const response = await fetch("/api/marktplaats");

  if (!response.ok) {
    throw new Error("Kon Marktplaats listings niet ophalen");
  }

  return response.json();
}