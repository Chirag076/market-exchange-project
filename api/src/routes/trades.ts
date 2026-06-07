import { Router } from "express";

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
    const { symbol } = req.query;
    if (symbol !== "TATA_INR") {
        try {
            const response = await fetch(`https://api.backpack.exchange/api/v1/trades?symbol=${symbol}`);
            const data = await response.json();
            res.json(data);
        } catch (err) {
            console.error("Error fetching trades:", err);
            res.status(500).send(err);
        }
    } else {
        // get from DB
        res.json({});
    }
});
