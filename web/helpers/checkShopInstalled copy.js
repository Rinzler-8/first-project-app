import { ShopInfoDB } from "../qr-codes-db.js";
import shopify from "@shopify/shopify-api";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import fetch from "node-fetch";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = await ShopInfoDB.list();
    const DB_PATH = `mongodb://localhost:27017/qr-codes`;
    const mongoDBSessionStorage = new MongoDBSessionStorage(DB_PATH);
    const shopSession = await mongoDBSessionStorage.findSessionsByShop(shop);
    const accessToken = shopSession[0].accessToken;
    const url = `https://${shop}/admin/api/2023-07/shop.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json(); // Get JSON data from the response

    console.log("res1 ", data);
    // Check if the shop already exists in the shops array
    const shopExists = shops.some((item) => item.shopDomain === shop);

    if (!shopExists) {
      await ShopInfoDB.create({ shopDomain: shop });
    }

    await next();
  } catch (error) {
    next(error);
  }
};
