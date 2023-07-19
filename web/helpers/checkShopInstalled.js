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
    const shopConfig = await shopify.api.rest.Shop.all({
      session: session,
    });
    const shopInfo = shopConfig.data[0];
    const shopOwner = shopInfo.email;
    const shopName = shopInfo.name;
    const shopCountry = shopInfo.country;
    const shopPhone = shopInfo.phone;

    console.log("shopPhone ", shopPhone);

    // Check if the shop already exists in the shops array
    // const shopExists = shops.some((item) => item.shopDomain === shop);
    const shopExists = shops.find((item) => item.shopDomain === shop);

    if (!shopExists) {
      await ShopInfoDB.create({
        shopDomain: shop,
        name: shopName,
        owner: shopOwner,
        country: shopCountry,
        phone: shopPhone,
      });
    } else {
      await ShopInfoDB.update(shopExists._id, {
        shopDomain: shop,
        name: shopName,
        owner: shopOwner,
        country: shopCountry,
        phone: shopPhone,
      });
    }

    await next();
  } catch (error) {
    next(error);
  }
};
