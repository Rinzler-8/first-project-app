import { ShopInfoDB } from "../qr-codes-db.js";
import shopify from "../shopify.js";

export const checkShopInstalled = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const session = await shopify.config.sessionStorage.findSessionsByShop(
      shop
    );

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
    if (!shopExists) {
      await ShopInfoDB.create(shopInfo);
    } else {
      await ShopInfoDB.update(shop, shopInfo);
    }

    await next();
  } catch (error) {
    next(error);
  }
};
