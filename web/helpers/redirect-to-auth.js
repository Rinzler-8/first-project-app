import { shopify } from "@shopify/shopify-api";

export default async function redirectToAuth(req, res, app) {
  if (!req.query.shop) {
    res.status(500);
    return res.send("No shop provided");
  }

  if (shopify.context.isEmbeddedApp(req.query.host)) {
    console.log("APP EMBEDDED OR NOT ???", req.query.embedded);
    return clientSideRedirect(req, res);
  }

  return await serverSideRedirect(req, res, app);
}

function clientSideRedirect(req, res) {
  const shop = req.query.shop;
  const redirectUriParams = new URLSearchParams({
    shop,
    host: req.query.host,
  }).toString();
  const queryParams = new URLSearchParams({
    ...req.query,
    shop,
    redirectUri: `https://${shopify.context.HOST_NAME}/api/auth?${redirectUriParams}`,
  }).toString();

  return res.redirect(`/exitiframe?${queryParams}`);
}

async function serverSideRedirect(req, res, app) {
  const redirectUrl = await shopify.auth.beginAuth(
    req,
    res,
    req.query.shop,
    "/api/auth/callback",
    app.get("use-online-tokens")
  );

  return res.redirect(redirectUrl);
}
