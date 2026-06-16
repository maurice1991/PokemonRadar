export async function GET() {
  const response = await fetch(
    "https://www.marktplaats.nl/q/pokemon+kaarten/",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  const html = await response.text();

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json"[^>]*>(.*?)<\/script>/
  );

  if (!match) {
    return Response.json([]);
  }

  const data = JSON.parse(match[1]);

  const listings =
    data.props.pageProps.searchRequestAndResponse.listings;

  const mapped = listings.map((listing: any) => ({
    id: listing.itemId,
    title: listing.title,
    price:
      (listing.priceInfo?.priceCents ?? 0) / 100,
    city:
      listing.location?.cityName ?? "Onbekend",
    image:
      listing.pictures?.[0]?.mediumUrl ?? null,
    url:
      "https://www.marktplaats.nl" +
      listing.vipUrl,
  }));

  return Response.json(mapped);
}