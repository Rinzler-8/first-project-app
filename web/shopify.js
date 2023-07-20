import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-07";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { QRCodesDB } from "./qr-codes-db.js";

const shopify = shopifyApp({
  api: {
    apiKey: "47d82d2e6027eebe39ad9bc6ce901190",
    apiSecretKey: "48fe58e6466a3ef66fbad90002eecc8f",
    apiVersion: LATEST_API_VERSION,
    restResources,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
    // Register the "app/uninstalled" webhook
  },
  sessionStorage: new MongoDBSessionStorage("mongodb://localhost:27017"),
});
// shopify.api.session.getCurrentId
export default shopify;
