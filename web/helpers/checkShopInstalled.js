import { ShopInfoDB } from "../qr-codes-db.js";
import shopify from "../shopify.js";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = await ShopInfoDB.list();
    const DB_PATH = `mongodb://localhost:27017`;
    const mongoDBSessionStorage = new MongoDBSessionStorage(DB_PATH);
    const shopSession = await mongoDBSessionStorage.findSessionsByShop(shop);
    const session = shopSession[0];

    const info = await shopify.api.rest.Shop.all({
      session: session,
    });
    console.log("Shop Info:", info);

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
