import { useEffect, useState } from "react";

export default function Nav({ route, user, cartCount, openAuth, logout }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["home", "Home"],
    ["category", "Category"],
    ["about", "About"],
    ["privacy", "Privacy"],
    ["contact", "Contact"],
    ["orders", "Orders"],
    ["cart", `Cart ${cartCount ? `(${cartCount})` : ""}`],
    ["admin", "Admin"],
  ];

  useEffect(() => {
    setOpen(false);
  }, [route.page]);

  return (
    <header className={`site-header ${open ? "menu-open" : ""}`}>
      <a href="#/home" className="brand" aria-label="Viswas Oils home">
        <img className="brand-logo" src="images/logo.png" alt="" />
      </a>
      <button className="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav className="main-nav" aria-label="Primary navigation">
        {links.map(([key, label]) => (
          <a key={key} className={route.page === key ? "active" : ""} href={`#/${key}`}>
            {label}
          </a>
        ))}
      </nav>
      <div className="account-actions">
        {user ? (
          <>
            <span className="account-name">{user.name}</span>
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
              Sign up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
