import { ShopInfoDB } from "../qr-codes-db.js";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = await ShopInfoDB.list(); // Get all shop domains from the database

    if (!shops.includes(shop)) {
      // If the shop domain does not exist in the database, create it
      await ShopInfoDB.create({ shopDomain: shop });
    }

    await next();
  } catch (error) {
    next(error);
  }
};
