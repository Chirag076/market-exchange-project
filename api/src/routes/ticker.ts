import { Router } from "express";

export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {    
    try {
        const response = await fetch("https://api.backpack.exchange/api/v1/tickers");
        const data: any[] = await response.json();
        
        // Add the local mock market TATA_INR
        data.push({
            symbol: "TATA_INR",
            firstPrice: "100.00",
            high: "105.00",
            lastPrice: "100.00",
            low: "95.00",
            priceChange: "0.00",
            priceChangePercent: "0.00",
            quoteVolume: "1000.00",
            trades: "10",
            volume: "10.00"
        });
        
        res.json(data);
    } catch (err) {
        console.error("Error fetching tickers:", err);
        res.json([
            { symbol: "SOL_USDC" },
            { symbol: "TATA_INR" }
        ]);
    }
});