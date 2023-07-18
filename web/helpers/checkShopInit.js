// import shopify from "../shopify.js";

import { QRCodesDB } from "../qr-codes-db.js";

// import { AppInstall } from "../app-installed.js"

export const checkShopInit = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const shops = [];
    await QRCodesDB.find.then(async (res) => {
      res?.map((shop) => {
        shops.push(shop.shopDomain);
      });
      if (!shops.includes(shop)) {
        await QRCodesDB.create({ shopDomain: shop });
      }
    });
    await next();
  } catch (error) {
    next(error);
  }
};
