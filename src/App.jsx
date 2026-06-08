import { useEffect, useMemo, useRef, useState } from "react";
import AuthModal from "./components/AuthModal.jsx";
import Footer from "./components/Footer.jsx";
import Nav from "./components/Nav.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import { api } from "./lib/api.js";
import { CATEGORIES, CART_KEY } from "./lib/constants.js";
import { productImage } from "./lib/products.js";
import { getRoute } from "./lib/routing.js";

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [authNotice, setAuthNotice] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const toastTimerRef = useRef(null);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) {
      window.location.hash = "#/home";
    }
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    Promise.all([loadProducts(), loadUser()]).finally(() => setLoading(false));
  }, []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 3600);
  }

  async function loadProducts() {
    const data = await api("products.php");
    setProducts(data.products || []);
    setCategories(data.categories || CATEGORIES);
    return data.products || [];
  }

  async function loadUser() {
    const data = await api("auth.php?action=me");
    setUser(data.user || null);
  }

  function openAuth(mode = "login", notice = "") {
    setAuthNotice(notice);
    setAuthMode(mode);
  }

  async function logout() {
    await api("auth.php?action=logout", { method: "POST", body: { action: "logout" } });
    setUser(null);
    showToast("Logged out.");
  }

  function addToCart(product, quantity, variant = null) {
    const selectedVariant = variant || product.variants?.[0] || {
      id: "",
      size_label: "Default",
      price: product.price,
      stock: product.stock,
    };
    const qty = Math.max(1, Math.min(Number(quantity || 1), Number(selectedVariant.stock || 0)));
    if (qty <= 0) {
      showToast("This product is out of stock.");
      return;
    }

    setCart((items) => {
      const variantId = selectedVariant.id || "";
      const cartKey = `${product.id}:${variantId}`;
      const existing = items.find((item) => item.cart_key === cartKey);
      if (existing) {
        return items.map((item) => {
          if (item.cart_key !== cartKey) return item;
          const nextQty = Math.min(item.quantity + qty, selectedVariant.stock);
          return {
            ...item,
            quantity: nextQty,
            stock: selectedVariant.stock,
            price: selectedVariant.price,
            size_label: selectedVariant.size_label,
          };
        });
      }
      return [
        ...items,
        {
          cart_key: cartKey,
          product_id: product.id,
          variant_id: selectedVariant.id || null,
          size_label: selectedVariant.size_label,
          name: product.name,
          category: product.category,
          price: selectedVariant.price,
          stock: selectedVariant.stock,
          quantity: qty,
          image: productImage(product),
        },
      ];
    });
    showToast("Added to cart.");
  }

  function updateCartQuantity(cartKey, quantity) {
    setCart((items) =>
      items
        .map((item) => {
          const key = item.cart_key || `${item.product_id}:${item.variant_id || ""}`;
          if (key !== cartKey) return item;
          const liveProduct = products.find((product) => product.id === item.product_id);
          const liveVariant =
            liveProduct?.variants?.find((variant) => String(variant.id) === String(item.variant_id)) ||
            liveProduct?.variants?.[0];
          const stock = Number(liveVariant?.stock ?? liveProduct?.stock ?? item.stock);
          return {
            ...item,
            cart_key: key,
            stock,
            price: liveVariant?.price ?? liveProduct?.price ?? item.price,
            size_label: liveVariant?.size_label ?? item.size_label,
            quantity: Math.max(1, Math.min(Number(quantity), stock || 1)),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(cartKey) {
    setCart((items) => items.filter((item) => (item.cart_key || `${item.product_id}:${item.variant_id || ""}`) !== cartKey));
  }

  const hydratedCart = useMemo(
    () =>
      cart.map((item) => {
        const liveProduct = products.find((product) => product.id === item.product_id);
        if (!liveProduct) return item;
        const liveVariant =
          liveProduct.variants?.find((variant) => String(variant.id) === String(item.variant_id)) ||
          liveProduct.variants?.[0] || {
            id: item.variant_id || "",
            size_label: item.size_label || "Default",
            price: item.price,
            stock: item.stock,
          };
        return {
          ...item,
          cart_key: item.cart_key || `${item.product_id}:${liveVariant.id || ""}`,
          variant_id: liveVariant.id || item.variant_id || null,
          size_label: liveVariant.size_label || item.size_label,
          name: liveProduct.name,
          category: liveProduct.category,
          price: liveVariant.price,
          stock: liveVariant.stock,
          image: productImage(liveProduct),
        };
      }),
    [cart, products]
  );

  const pageProps = {
    route,
    products,
    categories,
    user,
    cart: hydratedCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    openAuth,
    showToast,
    loadProducts,
    setCart,
  };

  return (
    <div className="app-shell">
      <Nav route={route} user={user} cartCount={hydratedCart.length} openAuth={openAuth} logout={logout} />
      {toast && <div className="toast">{toast}</div>}
      {loading ? <main className="loading-page">Loading Viswas Oils...</main> : <Router pageProps={pageProps} />}
      <Footer />
      {authMode && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          notice={authNotice}
          onClose={() => setAuthMode(null)}
          onAuthed={(nextUser) => {
            setUser(nextUser);
            setAuthMode(null);
            showToast("Welcome to Viswas Oils.");
          }}
        />
      )}
    </div>
  );
}

function Router({ pageProps }) {
  const page = pageProps.route.page;

  if (page === "category") return <CategoryPage {...pageProps} />;
  if (page === "about") return <AboutPage />;
  if (page === "privacy") return <PrivacyPage />;
  if (page === "contact") return <ContactPage showToast={pageProps.showToast} />;
  if (page === "cart") return <CartPage {...pageProps} />;
  if (page === "orders") return <OrdersPage user={pageProps.user} openAuth={pageProps.openAuth} />;
  if (page === "admin") return <AdminPage {...pageProps} />;

  return <HomePage {...pageProps} />;
}
