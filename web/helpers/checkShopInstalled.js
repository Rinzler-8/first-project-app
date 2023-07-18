import { ShopInfoDB } from "../qr-codes-db.js";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = await ShopInfoDB.list();
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
