import { useEffect, useState } from "react";

export default function Nav({ route, user, cartCount, openAuth, logout }) {
  const [open, setOpen] = useState(false);

  const links = [
    ["home", "Home"],
    ["category", "Shop Oils"],
    ["about", "About Us"],
    ["contact", "Contact"],
    ["orders", "My Orders"],
    ["admin", "Admin"],
  ];

  useEffect(() => {
    setOpen(false);
  }, [route.page]);

  useEffect(() => {
    document.body.classList.toggle("nav-drawer-open", open);
    return () => document.body.classList.remove("nav-drawer-open");
  }, [open]);

  function renderLinks(className) {
    return (
      <nav className={className} aria-label="Primary navigation">
        {links.map(([key, label]) => (
          <a
            key={key}
            className={route.page === key ? "active" : ""}
            href={`#/${key}`}
          >
            {label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>🌿 <strong>Free shipping</strong> on orders above ₹499</span>
        <span>✦ <strong>100% Pure</strong> Wood pressed/Cold pressed Oils</span>
        <span>🏠 Farm to Doorstep Delivery</span>
      </div>

      {/* Main Header */}
      <header className={`site-header ${open ? "menu-open" : ""}`}>
        <div className="header-inner">
          <a href="#/home" className="brand" aria-label="Vishwash Foods home">
            <img className="brand-logo" src="images/logo.png" alt="Vishwash Foods Logo" />
            <div className="brand-text">
              <strong>Vishwash Foods</strong>
              <small>Wood pressed/Cold pressed · Pure · Natural</small>
            </div>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {renderLinks("main-nav desktop-nav")}

          <div className="account-actions desktop-actions">
            <a className="cart-nav-btn" href="#/cart" aria-label={`Cart, ${cartCount} items`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Cart{cartCount ? ` (${cartCount})` : ""}
            </a>

            {user ? (
              <>
                <span className="account-name" title={user.name}>👤 {user.name}</span>
                <button className="logout-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="ghost-button" onClick={() => openAuth("login")}>
                  Login
                </button>
                <button className="primary-button compact" onClick={() => openAuth("register")}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <button
        className={`mobile-menu-backdrop ${open ? "open" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />

      <aside className={`mobile-menu-panel ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="mobile-menu-head">
          <a href="#/home" className="brand" aria-label="Vishwash Foods home">
            <img className="brand-logo" src="images/logo.png" alt="Vishwash Foods Logo" />
            <div className="brand-text">
              <strong>Vishwash Foods</strong>
              <small>Wood pressed/Cold pressed &middot; Pure &middot; Natural</small>
            </div>
          </a>
          <button className="menu-close-button" type="button" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {renderLinks("mobile-menu-links")}

        <div className="mobile-menu-actions">
          <a className="cart-nav-btn" href="#/cart" aria-label={`Cart, ${cartCount} items`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart{cartCount ? ` (${cartCount})` : ""}
          </a>

          {user ? (
            <>
              <span className="account-name" title={user.name}>ðŸ‘¤ {user.name}</span>
              <button className="logout-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="ghost-button" onClick={() => { setOpen(false); openAuth("login"); }}>
                Login
              </button>
              <button className="primary-button compact" onClick={() => { setOpen(false); openAuth("register"); }}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
