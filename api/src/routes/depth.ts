
import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_DEPTH } from "../types";

export const depthRouter = Router();

depthRouter.get("/", async (req, res) => {
    const { symbol } = req.query;
    if (symbol !== "TATA_INR") {
        try {
            const response = await fetch(`https://api.backpack.exchange/api/v1/depth?symbol=${symbol}`);
            const data = await response.json();
            res.json(data);
        } catch (err) {
            console.error("Error fetching depth:", err);
            res.status(500).send(err);
        }
    } else {
        const response = await RedisManager.getInstance().sendAndAwait({
            type: GET_DEPTH,
            data: {
                market: symbol as string
            }
        });

        res.json(response.payload);
    }
});
