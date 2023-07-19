import { ShopInfoDB } from "../qr-codes-db.js";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import shopify from "../shopify.js";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = await ShopInfoDB.list();
    const DB_PATH = `mongodb://localhost:27017`;
    const mongoDBSessionStorage = new MongoDBSessionStorage(DB_PATH);
    const session = await mongoDBSessionStorage.findSessionsByShop(shop);

    if (!session[0]) {
      throw new Error("Shop session not found.");
    }

    const shopConfig = await shopify.api.rest.Shop.all({
      session: session[0],
    });

    const { name, email: owner, country, phone } = shopConfig.data[0];

    const shopInfo = {
      shopDomain: shop,
      name,
      owner,
      country,
      phone,
    };

    const shopExists = shops.find((item) => item.shopDomain === shop);

    if (!shopExists) {
      await ShopInfoDB.create(shopInfo);
    } else {
      await ShopInfoDB.update(shopExists._id, shopInfo);
    }

    await next();
  } catch (error) {
    next(error);
  }
};
