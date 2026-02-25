// top500_solana_coingecko_free.js
const axios = require("axios");
const fs = require("fs").promises;

const COINGECKO_API = "https://api.coingecko.com/api/v3";

async function fetchTopSolanaCoins(limit = 2000) {
  try {
    console.log(
      `Fetching top ${limit} Solana ecosystem coins by market cap (free API)...`,
    );

    const perPage = 250; // Max safe value on free tier
    const totalPages = Math.ceil(limit / perPage);
    let allCoins = [];

    for (let page = 1; page <= totalPages; page++) {
      console.log(`Fetching page ${page}/${totalPages}...`);

      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: "usd",
          category: "solana-ecosystem",
          order: "market_cap_desc",
          per_page: perPage,
          page: page,
          sparkline: false,
          locale: "en",
          precision: "full", // optional: more decimal places if needed
        },
        timeout: 10000, // prevent hanging
      });

      const pageCoins = response.data || [];
      allCoins = allCoins.concat(pageCoins);

      console.log(
        `Received ${pageCoins.length} coins from page ${page} (total: ${allCoins.length})`,
      );

      // Safety delay: free tier ~30 calls/min → ~2s between calls
      if (page < totalPages) {
        console.log(
          "Waiting 15 seconds to respect rate limit (~4 calls/min)...",
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    }

    // Trim to exact limit (in case last page has extras)
    allCoins = allCoins.slice(0, limit);

    if (allCoins.length === 0) {
      throw new Error(
        "No coins returned. API may be down or category changed.",
      );
    }

    // Format the result (no mint address available here)
    const result = allCoins.map((coin, index) => ({
      rank: index + 1,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      market_cap_usd: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
    }));

    console.log(`\nSuccessfully fetched ${result.length} coins`);

    // Save to JSON
    await fs.writeFile(
      "top500_solana_coins.json",
      JSON.stringify(result, null, 2),
    );
    console.log("Saved detailed data to top500_solana_coins.json");

    return result;
  } catch (error) {
    console.error("Error fetching from CoinGecko:");
    console.error(error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    console.log(
      "Tip: If rate-limited, wait a minute and retry. Free tier is limited to ~30 calls/min.",
    );
  }
}

// Run it
fetchTopSolanaCoins(2000);
