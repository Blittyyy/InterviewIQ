import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = "https://www.demandbase.com/"; // Change to any test URL
  try {
    console.log('Testing scraping for:', url);
    const scrapeRes = await fetch(`http://localhost:3005/scrape?url=${encodeURIComponent(url)}`);
    const data = await scrapeRes.json();
    console.log('Scraping response:', JSON.stringify(data, null, 2));
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Scraping error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 