import { useEffect, useState } from "react";
import OrderList from "../components/OrderList.jsx";
import { api } from "../lib/api.js";

export default function OrdersPage({ user, openAuth }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api("orders.php")
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <main className="page-wrap">
        <div className="auth-required">
          <h1>Orders</h1>
          <p>Log in or create an account to view your orders.</p>
          <button className="primary-button" onClick={() => openAuth("login")}>
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">Order history</p>
        <h1>Your Orders</h1>
      </div>
      {loading && <div className="empty-state">Loading orders...</div>}
      {error && <div className="empty-state">{error}</div>}
      {!loading && !orders.length && <div className="empty-state">No orders yet.</div>}
      <OrderList orders={orders} />
    </main>
  );
}
