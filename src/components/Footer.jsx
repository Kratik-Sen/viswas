export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        {/* Brand Column */}
        <div className="footer-brand">
          <div className="footer-brand-logo">
            <img className="footer-logo-img" src="images/logo.png" alt="Vishwash Foods" />
            <strong>Vishwash Foods</strong>
          </div>
          <p>
            Bringing you the finest Wood pressed/Cold pressed oils, sourced directly from Indian farms.
            Pure, natural, and full of goodness for your everyday cooking.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <span style={{ padding: "5px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
              🌿 Wood pressed/Cold pressed
            </span>
            <span style={{ padding: "5px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
              ✓ Lab Tested
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <nav>
            <a href="#/home">Home</a>
            <a href="#/category">Shop All Oils</a>
            <a href="#/about">About Us</a>
            <a href="#/orders">My Orders</a>
            <a href="#/cart">Cart</a>
          </nav>
        </div>

        {/* Policies */}
        <div className="footer-col">
          <h4>Policies</h4>
          <nav>
            <a href="#/privacy">Privacy Policy</a>
            <a href="#/contact">Contact Us</a>
            <a href="#/privacy">Terms of Service</a>
            <a href="#/privacy">Refund Policy</a>
          </nav>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contact</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +91 99999 99999
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              care@vishwashfoods.in
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Main Market Road, India
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <span>© {year} Vishwash Foods. All rights reserved. Made with 🌿 in India.</span>
        <nav>
          <a href="#/privacy">Privacy</a>
          <a href="#/privacy">Terms</a>
          <a href="#/contact">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
