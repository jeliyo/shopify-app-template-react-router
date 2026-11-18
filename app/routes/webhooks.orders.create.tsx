import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { enqueueJob } from "../queue.server";

// orders/create: respond to Shopify right away and hand the work to the worker.
// To receive this from a real store, add read_orders to the app's scopes and an
// orders/create subscription in shopify.app.toml (orders are protected customer
// data, so public apps need Shopify's approval for it).
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const order = payload as {
    id: number;
    order_number?: number;
    total_price?: string;
    currency?: string;
    customer?: { id?: number } | null;
  };

  console.log(`Received ${topic} webhook for ${shop}, order #${order.order_number}`);

  await enqueueJob("award-loyalty-points", {
    shop,
    orderId: order.id,
    orderNumber: order.order_number,
    totalPrice: order.total_price,
    currency: order.currency,
    customerId: order.customer?.id ?? null,
  });

  return new Response();
};
