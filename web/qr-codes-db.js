/*
  This file interacts with the app's database and is used by the app's REST APIs.
*/

import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import shopify from "./shopify.js";

const uri = "mongodb://localhost:27017"; // Replace with your MongoDB URI
const client = new MongoClient(uri);
const DEFAULT_PURCHASE_QUANTITY = 1;
let db;

async function connectToDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    db = client.db("qr_db");
    const collections = {
      qrCodesCollection: db.collection("qr_codes"),
      shopInfoCollection: db.collection("shop_info"),
      // Add more collections as needed
    };
    return collections;
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

let connect = await connectToDB();

export const ShopInfoDB = {
  shopInfoTableName: "shop_info",
  shopInfoCollection: connect.shopInfoCollection,

  create: async function ({ shopDomain, name, country, phone, owner }) {
    await this.ready;

    const document = {
      shopDomain,
      name,
      country,
      phone,
      owner,
    };

    const result = await this.shopInfoCollection.insertOne(document);
    return result.insertedId;
  },

  read: async function (id) {
    await this.ready;

    const query = { _id: new ObjectId(id) };
    const shop = await this.shopInfoCollection.findOne(query);

    return shop;
  },

  list: async function () {
    await this.ready;
    const results = await this.shopInfoCollection.find().toArray();

    return results;
  },

  update: async function (id, { shopDomain, name, country, phone, owner }) {
    await this.ready;

    const query = { _id: new ObjectId(id) };
    const updateDocument = {
      $set: {
        shopDomain,
        name,
        country,
        phone,
        owner,
      },
    };

    await this.shopInfoCollection.updateOne(query, updateDocument);
    return true;
  },
};

export const QRCodesDB = {
  qrCodesTableName: "qr_codes",
  db: null,
  ready: null,
  qrCodesCollection: connect.qrCodesCollection,

  create: async function ({
    shopDomain,
    title,
    productId,
    variantId,
    handle,
    discountId,
    discountCode,
    destination,
  }) {
    await this.ready;

    const document = {
      shopDomain,
      title,
      productId,
      variantId,
      handle,
      discountId,
      discountCode,
      destination,
      scans: 0,
      createdAt: new Date(),
    };

    const result = await this.qrCodesCollection.insertOne(document);
    return result.insertedId;
  },

  read: async function (id) {
    await this.ready;

    const query = { _id: new ObjectId(id) };
    const qrcode = await this.qrCodesCollection.findOne(query);
    return qrcode ? this.__addImageUrl(qrcode) : undefined;
  },

  update: async function (
    id,
    {
      title,
      productId,
      variantId,
      handle,
      discountId,
      discountCode,
      destination,
    }
  ) {
    await this.ready;

    const query = { _id: new ObjectId(id) };
    const updateDocument = {
      $set: {
        title,
        productId,
        variantId,
        handle,
        discountId,
        discountCode,
        destination,
      },
    };

    await this.qrCodesCollection.updateOne(query, updateDocument);
    return true;
  },

  list: async function (shopDomain) {
    await this.ready;

    const query = { shopDomain };
    const results = await this.qrCodesCollection.find(query).toArray();

    return results.map((qrcode) => this.__addImageUrl(qrcode));
  },

  delete: async function (id) {
    await this.ready;

    const query = { _id: new ObjectId(id) };
    await this.qrCodesCollection.deleteOne(query);
    return true;
  },

  /* The destination URL for a QR code is generated at query time */
  generateQrcodeDestinationUrl: function (qrcode) {
    return `${shopify.api.config.hostScheme}://${shopify.api.config.hostName}/qrcodes/${qrcode._id}/scan`;
  },

  /* The behavior when a QR code is scanned */
  handleCodeScan: async function (qrcode) {
    if (!qrcode.shopDomain) {
      throw "Missing host query argument";
    }

    /* Log the scan in the database */
    await this.__increaseScanCount(qrcode);

    try {
      const url = new URL(qrcode.shopDomain);
      switch (qrcode.destination) {
        /* The QR code redirects to the product view */
        case "product":
          return this.__goToProductView(url, qrcode);

        /* The QR code redirects to checkout */
        case "checkout":
          return this.__goToProductCheckout(url, qrcode);

        default:
          throw `Unrecognized destination "${qrcode.destination}"`;
      }
    } catch (error) {
      console.error("Error handling code scan:", error);
      throw error;
    }
  },

  /* Private */

  /*
    Used to check whether to create the collection.
    Also used to make sure the collection is set up before the server starts.
  */

  __hasQrCodesCollection: async function () {
    const collections = await db
      .listCollections({ name: this.qrCodesTableName })
      .toArray();
    return collections.length > 0;
  },

  init: async function () {
    try {
      this.ready = Promise.resolve();

      const hasQrCodesCollection = await this.__hasQrCodesCollection();

      if (!hasQrCodesCollection) {
        const indexes = [
          { key: { shopDomain: 1 } },
          { key: { createdAt: 1 }, expireAfterSeconds: 86400 }, // Auto-delete documents after 24 hours
        ];
        await connect.createCollection(this.qrCodesTableName);
        await connect.createIndexes(this.qrCodesTableName, indexes);
        await connect.createCollection(this.shopInfoTableName);
        await connect.createIndexes(this.shopInfoTableName, indexes);
      }
    } catch (err) {
      console.error("Error initializing MongoDB:", err);
    }
  },

  __addImageUrl: function (qrcode) {
    try {
      qrcode.imageUrl = this.__generateQrcodeImageUrl(qrcode);
    } catch (err) {
      console.error(err);
    }

    return qrcode;
  },

  __generateQrcodeImageUrl: function (qrcode) {
    return `${shopify.api.config.hostScheme}://${shopify.api.config.hostName}/qrcodes/${qrcode._id}/image`;
  },

  __increaseScanCount: async function (qrcode) {
    const query = { _id: ObjectId(qrcode._id) };
    const updateDocument = {
      $inc: { scans: 1 },
    };
    await this.db.updateOne(query, updateDocument);
  },

  __goToProductView: function (url, qrcode) {
    return productViewURL({
      discountCode: qrcode.discountCode,
      host: url.toString(),
      productHandle: qrcode.handle,
    });
  },

  __goToProductCheckout: function (url, qrcode) {
    return productCheckoutURL({
      discountCode: qrcode.discountCode,
      host: url.toString(),
      variantId: qrcode.variantId,
      quantity: DEFAULT_PURCHASE_QUANTITY,
    });
  },
};

/* Generate the URL to a product page */
function productViewURL({ host, productHandle, discountCode }) {
  const url = new URL(host);
  const productPath = `/products/${productHandle}`;

  /* If this QR Code has a discount code, then add it to the URL */
  if (discountCode) {
    url.pathname = `/discount/${discountCode}`;
    url.searchParams.append("redirect", productPath);
  } else {
    url.pathname = productPath;
  }

  return url.toString();
}

/* Generate the URL to checkout with the product in the cart */
function productCheckoutURL({ host, variantId, quantity = 1, discountCode }) {
  const url = new URL(host);
  const id = variantId.replace(
    /gid:\/\/shopify\/ProductVariant\/([0-9]+)/,
    "$1"
  );

  /* The cart URL resolves to a checkout URL */
  url.pathname = `/cart/${id}:${quantity}`;

  if (discountCode) {
    url.searchParams.append("discount", discountCode);
  }

  return url.toString();
}
