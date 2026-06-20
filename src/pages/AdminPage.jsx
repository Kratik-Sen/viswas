import { useEffect, useRef, useState } from "react";
import OrderList from "../components/OrderList.jsx";
import { api, publicAssetUrl } from "../lib/api.js";
import { money } from "../lib/format.js";
import { productImage, productImages } from "../lib/products.js";
import { blockNumberInput, DECIMAL_PATTERN, DIGITS_PATTERN, isDecimal, isDigits, isTextValue, TEXT_PATTERN } from "../lib/validation.js";

function rowKey() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export default function AdminPage({ user, products, categories, openAuth, showToast, loadProducts }) {
  const [imageSlots, setImageSlots] = useState([Date.now()]);
  const [variantRows, setVariantRows] = useState([{ key: rowKey(), size: "1L", price: "", stock: "", imageUrl: "" }]);
  const [settings, setSettings] = useState(null);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    api("settings.php").then(setSettings).catch((error) => showToast(error.message));
    api("orders.php?all=1")
      .then((data) => setOrders(data.orders || []))
      .catch(() => {});
    api("contact.php")
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <main className="page-wrap">
        <div className="auth-required">
          <h1>Admin Panel</h1>
          <p>Admin login is required.</p>
          <button className="primary-button" onClick={() => openAuth("login")}>
            Login
          </button>
        </div>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="page-wrap">
        <div className="empty-state">Admin access required.</div>
      </main>
    );
  }

  async function submitProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name");

    if (!isTextValue(name)) {
      showToast("Product name can contain letters, numbers, spaces, and basic punctuation only.");
      return;
    }

    for (const row of variantRows) {
      const size = formData.get(`variants[${row.key}][size]`);
      const price = formData.get(`variants[${row.key}][price]`);
      const stock = formData.get(`variants[${row.key}][stock]`);
      if (!isTextValue(size)) {
        showToast("Each product size must use valid text.");
        return;
      }
      if (!isDecimal(price)) {
        showToast("Each size price can contain numbers only, with up to two decimals.");
        return;
      }
      if (!isDigits(stock)) {
        showToast("Each size quantity can contain numbers only.");
        return;
      }
    }

    setBusy(true);
    try {
      if (editingProduct) {
        formData.set("action", "update");
        formData.set("id", editingProduct.id);
      }

      const data = await api("products.php", {
        method: "POST",
        body: formData,
      });
      showToast(data.message);
      form.reset();
      setImageSlots([Date.now()]);
      setVariantRows([{ key: rowKey(), size: "1L", price: "", stock: "", imageUrl: "" }]);
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    try {
      const formData = new FormData();
      formData.set("action", "delete");
      formData.set("id", product.id);
      const data = await api("products.php", {
        method: "POST",
        body: formData,
      });
      showToast(data.message);
      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
        setImageSlots([Date.now()]);
        setVariantRows([{ key: rowKey(), size: "1L", price: "", stock: "", imageUrl: "" }]);
      }
      await loadProducts();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function removeProductImage(image) {
    if (!window.confirm("Remove this product image?")) return;

    try {
      const formData = new FormData();
      formData.set("action", "delete_image");
      formData.set("image_id", image.id);
      const data = await api("products.php", {
        method: "POST",
        body: formData,
      });
      showToast(data.message);
      const refreshedProducts = await loadProducts();
      if (editingProduct && refreshedProducts) {
        setEditingProduct(refreshedProducts.find((product) => product.id === editingProduct.id) || null);
      } else if (editingProduct) {
        setEditingProduct({
          ...editingProduct,
          images: editingProduct.images.filter((item) => item.id !== image.id),
        });
      }
    } catch (error) {
      showToast(error.message);
    }
  }

  function editProduct(product) {
    setEditingProduct(product);
    setImageSlots([Date.now()]);
    setVariantRows(
      (product.variants?.length ? product.variants : [{ size_label: "1L", price: product.price, stock: product.stock }]).map((variant) => ({
        key: variant.id || rowKey(),
        size: variant.size_label || "1L",
        price: variant.price ?? "",
        stock: variant.stock ?? "",
        imageUrl: variant.image_url || "",
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingProduct(null);
    formRef.current?.reset();
    setImageSlots([Date.now()]);
    setVariantRows([{ key: rowKey(), size: "1L", price: "", stock: "", imageUrl: "" }]);
  }

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0);

  return (
    <main className="page-wrap admin-page">
      <div className="page-title">
        <p className="eyebrow">Store Management</p>
        <h1>Admin Dashboard</h1>
      </div>

      {/* ---- Dashboard Stats ---- */}
      <div className="admin-stats">
        <div>
          <strong>{products.length}</strong>
          <span>Total Products</span>
        </div>
        <div>
          <strong>{totalStock.toLocaleString("en-IN")}</strong>
          <span>Units in Stock</span>
        </div>
        <div>
          <strong>{orders.length}</strong>
          <span>Total Orders</span>
        </div>
      </div>

      {/* ---- Product Form + Settings ---- */}
      <section className="admin-grid">
        <form className="panel-form" key={editingProduct?.id || "new"} ref={formRef} onSubmit={submitProduct}>
          <div className="form-title-row">
            <h2>{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
            {editingProduct && (
              <button type="button" className="ghost-button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
          <label>
            Product name
            <input name="name" pattern={TEXT_PATTERN} required defaultValue={editingProduct?.name || ""} placeholder="e.g. Groundnut Oil 1L" />
          </label>
          <label>
            Category
            <select name="category" required defaultValue={editingProduct?.category || categories[0]}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="banner-image-field">
            Category page banner image
            {editingProduct?.banner_image_url && (
              <img className="banner-image-preview" src={publicAssetUrl(editingProduct.banner_image_url)} alt={`${editingProduct.category} banner`} />
            )}
            <input type="file" name="banner_image" accept="image/*" />
          </label>
          <div className="variant-inputs">
            <span>Sizes, Prices and Bottle Images</span>
            {variantRows.map((row) => (
              <div className="variant-row" key={row.key}>
                <label>
                  Size
                  <input name={`variants[${row.key}][size]`} pattern={TEXT_PATTERN} required defaultValue={row.size} placeholder="200ml" />
                </label>
                <label>
                  Price (₹)
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={DECIMAL_PATTERN}
                    name={`variants[${row.key}][price]`}
                    onKeyDown={(event) => blockNumberInput(event, { decimal: true })}
                    required
                    defaultValue={row.price}
                    placeholder="0.00"
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern={DIGITS_PATTERN}
                    name={`variants[${row.key}][stock]`}
                    onKeyDown={blockNumberInput}
                    required
                    defaultValue={row.stock}
                    placeholder="0"
                  />
                </label>
                <label className="variant-image-field">
                  Bottle image
                  {row.imageUrl && (
                    <img className="variant-image-preview" src={publicAssetUrl(row.imageUrl)} alt={`${row.size || "Size"} bottle`} />
                  )}
                  <input type="file" name={`variant_images[${row.key}]`} accept="image/*" />
                </label>
                {variantRows.length > 1 && (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => setVariantRows((rows) => rows.filter((item) => item.key !== row.key))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="ghost-button"
              onClick={() => setVariantRows((rows) => [...rows, { key: rowKey(), size: "", price: "", stock: "", imageUrl: "" }])}
            >
              + Add size variant
            </button>
          </div>
          <label>
            Description
            <textarea name="description" rows="3" defaultValue={editingProduct?.description || ""} placeholder="Short product summary shown above the reviews..." />
          </label>
          <label>
            Product benefits
            <textarea
              name="product_benefits"
              rows="5"
              defaultValue={editingProduct?.product_benefits || ""}
              placeholder="Add one benefit per line. These appear in the Product Description list..."
            />
          </label>
          <div className="image-inputs">
            <span>Product Photos</span>
            {editingProduct?.images?.length > 0 && (
              <div className="existing-images">
                {productImages(editingProduct).map((image) => (
                  <div className="existing-image" key={image.id}>
                    <img src={image.url} alt="" />
                    <button type="button" className="image-remove-button" onClick={() => removeProductImage(image)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageSlots.map((slot) => (
              <div className="image-file-row" key={slot}>
                <input type="file" name="images[]" accept="image/*" />
                {imageSlots.length > 1 && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setImageSlots((slots) => slots.filter((item) => item !== slot))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="ghost-button" onClick={() => setImageSlots((slots) => [...slots, Date.now() + Math.random()])}>
              + Add another image
            </button>
          </div>
          <button className="primary-button full" disabled={busy}>
            {busy ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}
          </button>
        </form>

        <div style={{ display: "grid", gap: "18px", alignContent: "start" }}>
          <div className="panel-form">
            <h2>💳 Payment Settings</h2>

            {/* Razorpay status banner when both keys are saved */}
            {settings?.razorpay_configured && (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px", borderRadius: "8px",
                background: "var(--green-bg)", border: "1px solid var(--green-border)",
                color: "var(--green)", fontSize: "0.83rem", fontWeight: 600
              }}>
                Razorpay keys are loaded from .env
              </div>
            )}

            <p className="status-copy">
              Razorpay keys are read only from the .env file.
            </p>

            <p className="status-copy">
              Cloudinary:{" "}
              <strong style={{ color: settings?.cloudinary_configured ? "var(--green)" : "var(--coral)" }}>
                {settings?.cloudinary_configured ? "✓ Configured" : "⚠ Add keys in .env"}
              </strong>
            </p>
          </div>


          {/* Quick stats card */}
          <div className="panel-form" style={{ gap: "10px" }}>
            <h2>📊 Quick Stats</h2>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--green-bg)", borderRadius: "8px", border: "1px solid var(--green-border)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Products</span>
                <strong style={{ color: "var(--green)" }}>{products.length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--green-bg)", borderRadius: "8px", border: "1px solid var(--green-border)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Total Stock</span>
                <strong style={{ color: "var(--green)" }}>{totalStock.toLocaleString("en-IN")} units</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--green-bg)", borderRadius: "8px", border: "1px solid var(--green-border)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Messages</span>
                <strong style={{ color: "var(--green)" }}>{messages.length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--green-bg)", borderRadius: "8px", border: "1px solid var(--green-border)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Orders</span>
                <strong style={{ color: "var(--green)" }}>{orders.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Inventory Table ---- */}
      <section className="inventory-section">
        <div className="inventory-section-header">
          <span>📦 Inventory</span>
          <small>{products.length} products</small>
        </div>
        <div className="inventory-table">
          {products.length === 0 ? (
            <div className="empty-state">No products yet. Add your first product above.</div>
          ) : (
            products.map((product) => (
              <div className="inventory-row" key={product.id}>
                <img src={productImage(product)} alt={product.name} />
                <span>{product.name}</span>
                <small>{product.category}</small>
                <strong>{money(product.price)}</strong>
                <em>{product.stock} units</em>
                <small className="variant-summary">
                  {(product.variants || []).map((v) => `${v.size_label} ${money(v.price)}`).join(" · ")}
                </small>
                <div className="inventory-actions">
                  <button className="edit-button" onClick={() => editProduct(product)}>Edit</button>
                  <button className="danger-button" onClick={() => deleteProduct(product)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ---- Contact Messages ---- */}
      <section className="inventory-section">
        <div className="inventory-section-header">
          <span>💬 Contact Messages</span>
          <small>{messages.length} messages</small>
        </div>
        {!messages.length ? (
          <div className="empty-state">No contact messages yet.</div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <article className="message-card" key={message.id}>
                <div>
                  <strong>{message.name}</strong>
                  <small>{new Date(message.created_at).toLocaleString()}</small>
                </div>
                <p>{message.message}</p>
                <a href={`mailto:${message.email}`}>{message.email}</a>
                {message.phone && <span>📞 {message.phone}</span>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---- Recent Orders ---- */}
      <section className="inventory-section">
        <div className="inventory-section-header">
          <span>🛒 Recent Orders</span>
          <small>{orders.length} total</small>
        </div>
        <OrderList orders={orders.slice(0, 6)} />
      </section>
    </main>
  );
}
