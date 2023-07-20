import { ShopInfoDB } from "../qr-codes-db.js";
import shopify from "../shopify.js";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = await ShopInfoDB.list();
    const session = await shopify.config.sessionStorage.findSessionsByShop(shop);

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
      deleted: false,
    };

    const shopExists = await ShopInfoDB.readDomain(shop);
    //count

    const exists = shops.some((item) => item.shopDomain === shop);

    if (!exists) {
      await ShopInfoDB.create(shopInfo);
    } else {
      await ShopInfoDB.update(shopExists._id, shopInfo);
    }

    await next();
  } catch (error) {
    next(error);
  }
};
