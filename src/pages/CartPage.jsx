import { useState } from "react";
import { api } from "../lib/api.js";
import { PLACEHOLDER_IMAGE } from "../lib/constants.js";
import { money } from "../lib/format.js";
import { loadRazorpayCheckout } from "../lib/razorpay.js";
import { blockNumberInput, DIGITS_PATTERN } from "../lib/validation.js";

function cartKey(item) {
  return item.cart_key || `${item.product_id}:${item.variant_id || ""}`;
}

function cartStock(item) {
  const stock = Number(item.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}

function clampQuantity(quantity, stock) {
  const parsed = Math.floor(Number(quantity || 1));
  const safeQuantity = Number.isFinite(parsed) ? parsed : 1;
  return Math.max(1, Math.min(safeQuantity, Math.max(1, stock)));
}

function cartQuantity(item) {
  const stock = cartStock(item);
  return stock > 0 ? clampQuantity(item.quantity, stock) : 0;
}

function normalizedCart(cart) {
  return cart
    .map((item) => ({
      ...item,
      cart_key: cartKey(item),
      stock: cartStock(item),
      quantity: cartQuantity(item),
    }))
    .filter((item) => item.stock > 0 && item.quantity > 0);
}

function cartItems(cart) {
  return normalizedCart(cart).map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
  }));
}

async function markPaymentAttempt(order, paymentStatus, reason = "") {
  if (!order?.order_id) return;

  try {
    await api("payments.php?action=fail", {
      method: "POST",
      body: {
        app_order_id: order.order_id,
        razorpay_order_id: order.razorpay_order_id,
        payment_status: paymentStatus,
        reason,
      },
    });
  } catch (error) {
    // Best-effort only; unpaid attempts are still hidden from order lists.
  }
}

export default function CartPage({ cart, user, openAuth, updateCartQuantity, removeFromCart, showToast, setCart, loadProducts }) {
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const availableCart = normalizedCart(cart);
  const total = availableCart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const itemCount = availableCart.reduce((sum, item) => sum + Number(item.quantity), 0);

  function handleQuantityChange(item, quantity) {
    const stock = cartStock(item);
    if (stock <= 0) return;
    updateCartQuantity(cartKey(item), clampQuantity(quantity, stock));
  }

  async function checkout() {
    if (!cart.length) return;
    if (!availableCart.length) {
      showToast("Cart items are out of stock.");
      return;
    }
    const cartWasAdjusted =
      availableCart.length !== cart.length ||
      availableCart.some((item) => {
        const sourceItem = cart.find((cartItem) => cartKey(cartItem) === item.cart_key);
        return !sourceItem || Number(sourceItem.quantity) !== item.quantity || cartStock(sourceItem) !== item.stock;
      });
    if (cartWasAdjusted) {
      setCart(availableCart);
      showToast("Cart quantities were adjusted to available stock.");
      return;
    }
    if (!user) {
      openAuth("register", "Create an account with your delivery address to place the order.");
      return;
    }

    let createdOrder = null;
    try {
      setBusy(true);

      if (paymentMethod === "razorpay") {
        await loadRazorpayCheckout();
      }

      createdOrder = await api("payments.php?action=create", {
        method: "POST",
        body: {
          items: cartItems(cart),
          payment_method: paymentMethod,
        },
      });

      if (createdOrder.payment_method === "razorpay") {
        let paymentFinished = false;
        const releaseBusy = () => setBusy(false);

        const razorpay = new window.Razorpay({
          key: createdOrder.razorpay_key_id,
          amount: createdOrder.amount,
          currency: createdOrder.currency,
          name: "Vishwash Foods",
          description: "Cooking oil order",
          order_id: createdOrder.razorpay_order_id,
          retry: {
            enabled: true,
            max_count: 1,
          },
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
            paymentFinished = true;
            try {
              await api("payments.php?action=verify", {
                method: "POST",
                body: {
                  app_order_id: createdOrder.order_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });
              setCart([]);
              await loadProducts();
              showToast("Payment successful. Order placed.");
              window.location.hash = "#/orders";
            } catch (error) {
              showToast(error.message);
            } finally {
              releaseBusy();
            }
          },
          modal: {
            ondismiss: async () => {
              if (paymentFinished) return;
              await markPaymentAttempt(createdOrder, "cancelled", "Razorpay checkout closed");
              showToast("Payment was not completed.");
              releaseBusy();
            },
          },
        });

        razorpay.on("payment.failed", async function (response) {
          paymentFinished = true;
          const message = response.error?.description || "Payment failed.";
          await markPaymentAttempt(createdOrder, "failed", message);
          showToast(message);
          releaseBusy();
        });

        razorpay.open();
        return;
      }

      setCart([]);
      await loadProducts();
      showToast(createdOrder.message || "COD order placed successfully.");
      setBusy(false);
      window.location.hash = "#/orders";
    } catch (error) {
      if (paymentMethod === "razorpay") {
        await markPaymentAttempt(createdOrder, "failed", error.message);
      }
      showToast(error.message);
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
            {cart.map((item) => {
              const key = cartKey(item);
              const stock = cartStock(item);
              const quantity = cartQuantity(item);
              const outOfStock = stock <= 0;

              return (
                <article className="cart-item" key={key}>
                  <img src={item.image || PLACEHOLDER_IMAGE} alt={item.name} />
                  <div className="cart-info">
                    <span className="pill">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.size_label ? `${item.size_label} - ` : ""}{money(item.price)} each</p>
                    <small className={outOfStock ? "cart-stock out" : "cart-stock"}>
                      {outOfStock ? "Out of stock" : `${stock} in stock`}
                    </small>
                  </div>
                  <label className="cart-qty">
                    Qty
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern={DIGITS_PATTERN}
                      min={outOfStock ? "0" : "1"}
                      max={String(Math.max(1, stock))}
                      value={quantity}
                      disabled={outOfStock}
                      onKeyDown={blockNumberInput}
                      onChange={(event) => handleQuantityChange(item, event.target.value)}
                    />
                  </label>
                  <strong>{money(Number(item.price) * Number(quantity))}</strong>
                  <button className="ghost-button" onClick={() => removeFromCart(key)}>
                    Remove
                  </button>
                </article>
              );
            })}
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
                Razorpay card / UPI
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
