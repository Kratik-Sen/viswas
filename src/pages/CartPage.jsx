import { useState } from "react";
import { api } from "../lib/api.js";
import { PLACEHOLDER_IMAGE } from "../lib/constants.js";
import { money } from "../lib/format.js";
import { blockNumberInput, DIGITS_PATTERN } from "../lib/validation.js";

export default function CartPage({ cart, user, openAuth, updateCartQuantity, removeFromCart, showToast, setCart, loadProducts }) {
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  async function checkout() {
    if (!cart.length) return;
    if (!user) {
      openAuth("register", "Create an account with your delivery address to place the order.");
      return;
    }
    if (paymentMethod === "razorpay" && !window.Razorpay) {
      showToast("Razorpay checkout is not loaded.");
      return;
    }

    try {
      setBusy(true);
      const created = await api("payments.php?action=create", {
        method: "POST",
        body: {
          items: cart.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
          payment_method: paymentMethod,
        },
      });

      if (created.payment_method === "cod") {
        setCart([]);
        await loadProducts();
        showToast("COD order placed successfully.");
        window.location.hash = "#/orders";
        return;
      }

      const checkoutOptions = {
        key: created.razorpay_key_id,
        amount: created.amount,
        currency: created.currency,
        name: "Viswas Oils",
        description: "Cooking oil order",
        order_id: created.razorpay_order_id,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        notes: {
          address: `${user.address}, ${user.city}, ${user.state} ${user.pincode}`,
        },
        theme: { color: "#176c4f" },
        handler: async function (response) {
          try {
            await api("payments.php?action=verify", {
              method: "POST",
              body: {
                app_order_id: created.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            setCart([]);
            await loadProducts();
            showToast("Order placed successfully.");
            window.location.hash = "#/orders";
          } catch (error) {
            showToast(error.message);
          }
        },
        modal: {
          ondismiss: () => showToast("Payment was not completed."),
        },
      };

      const razorpay = new window.Razorpay(checkoutOptions);
      razorpay.on("payment.failed", function (response) {
        showToast(response.error?.description || "Payment failed.");
      });
      razorpay.open();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap">
      <div className="page-title page-title-row">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Your Cart</h1>
        </div>
        <span className="result-count">{itemCount} items</span>
      </div>
      {!cart.length ? (
        <div className="empty-state">
          Your cart is empty. <a href="#/category">Shop oils</a>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item) => (
              <article className="cart-item" key={item.cart_key || `${item.product_id}:${item.variant_id || ""}`}>
                <img src={item.image || PLACEHOLDER_IMAGE} alt={item.name} />
                <div className="cart-info">
                  <span className="pill">{item.category}</span>
                  <h3>{item.name}</h3>
                  <p>{item.size_label ? `${item.size_label} - ` : ""}{money(item.price)} each</p>
                </div>
                <label className="cart-qty">
                  Qty
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern={DIGITS_PATTERN}
                    min="1"
                    max={Math.max(1, Number(item.stock))}
                    value={item.quantity}
                    onKeyDown={blockNumberInput}
                    onChange={(event) => updateCartQuantity(item.cart_key || `${item.product_id}:${item.variant_id || ""}`, event.target.value)}
                  />
                </label>
                <strong>{money(Number(item.price) * Number(item.quantity))}</strong>
                <button className="ghost-button" onClick={() => removeFromCart(item.cart_key || `${item.product_id}:${item.variant_id || ""}`)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
          <aside className="summary-panel">
            <span>Order total</span>
            <strong>{money(total)}</strong>
            <p>{user ? `${user.address}, ${user.city}, ${user.state} ${user.pincode}` : "Signup required for checkout."}</p>
            <div className="payment-options" role="radiogroup" aria-label="Payment method">
              <label className={paymentMethod === "razorpay" ? "selected" : ""}>
                <input
                  type="radio"
                  name="payment_method"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                Razorpay
              </label>
              <label className={paymentMethod === "cod" ? "selected" : ""}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                Cash on delivery
              </label>
            </div>
            <button className="primary-button full" disabled={busy} onClick={checkout}>
              {busy ? "Placing order..." : paymentMethod === "cod" ? "Place COD order" : "Pay with Razorpay"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
