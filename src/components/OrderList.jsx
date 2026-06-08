import { money } from "../lib/format.js";
import { PLACEHOLDER_IMAGE } from "../lib/constants.js";
import { apiUrl, publicAssetUrl } from "../lib/api.js";

export default function OrderList({ orders }) {
  return (
    <div className="orders-list">
      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <div className="order-head">
            <div>
              <span className="pill">{order.payment_status}</span>
              <h3>Order #{order.id}</h3>
              <p>{new Date(order.created_at).toLocaleString()}</p>
              <small>{order.payment_method === "cod" ? "Cash on delivery" : "Razorpay"}</small>
            </div>
            <div className="order-actions">
              <strong>{money(order.total)}</strong>
              {["paid", "cod_pending"].includes(order.payment_status) && (
                <a className="invoice-button" href={apiUrl(`invoice.php?id=${order.id}`)}>
                  Download invoice
                </a>
              )}
            </div>
          </div>
          <div className="order-items">
            {order.items.map((item) => (
              <div className="order-line" key={item.id}>
                <img src={publicAssetUrl(item.image_url || PLACEHOLDER_IMAGE)} alt={item.product_name} />
                <span>{item.product_name}{item.product_size ? ` (${item.product_size})` : ""}</span>
                <small>
                  {item.quantity} x {money(item.price)}
                </small>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
