export default function AboutPage() {
  return (
    <main className="page-wrap story-page">
      <section className="copy-panel">
        <p className="eyebrow">ABOUT US</p>
        <h1>Vishwash Foods</h1>
        <p>
          Vishwash Foods is manufacturer of 100% Natural Food products <br />
          Fssai Lic. no. : 10722032001193
        </p>

        <p>
          We manufactur "Ghani Drop Oil" - 100% Natural Wood Pressed/Cold
          Pressed - Lakda Ghani oil by our Indian Tradition Method
        </p>
        <p>GST No : 24AINPC6748C1ZE</p>
        <p>Our wood Pressed Ghani Drop Oil consists wide range of varities</p>
        <ul>
          <li>Wood Pressed Ground nut oil</li>
          <li>Wood Pressed Coconut oil</li>
          <li>Wood Pressed Sunflower oil</li>
          <li>Wood Pressed Black Sesame oil</li>
          <li>Wood Pressed White Sesame oil</li>
          <li>Wood Pressed Black Mustard</li>
          <li>Wood Pressed Yellow Mustard</li>
          <li>Wood Pressed Almond oil</li>
          <li>Wood Pressed Flaxseed oil</li>
        </ul>
      </section>

      <section  className="copy-panel">
        <p>We procure Best Quality of raw material, clean it before further process. Then raw material is crushed in Wood Pressed/ Lakda Ghani machine at very low speed (RPM). Due to low speed, it'temperature not exceed more than 49degree celsius. As it's temperature remains low, oil nutrition remains in its 100% original form. After oil extraction, it is allowed to settled down in vessels for next 72hrs. During this period It's sediments are settled down at bottom of vessel.After this oil is sieve filtered, it is packed in cleaned bottles and labeling are done. And then after dispatched to stores for the our valuable customers.</p>
        <p>During whole process we maintain hygiene and quality, because we believe in quality for our valuable customers.We are bound to provide our Quality Products at Best Rates.</p>
        <p>Vishwash Wood Pressed Ghani Drop Oil benefits :</p>
         <ul>
          <li>100% Natural</li>
          <li>100% Pure</li>
          <li>No Chemical, No Preservatives, No color</li>
          <li>Free from Trans fat</li>
          <li>Free from Cholesterol</li>
          <li>Good for Heart and overall health</li>
        </ul>
        <p>Use 100% Natural Ghani Drop Oil in your recipe and keep your family healthy. It will give daily nutrition to your children for their over all growth.We never compromise in quality.</p>
        <p>Available in 100ml,200ml,500ml,1ltr,5ltr and 15ltr variants</p>
        <p><b>"Suddh Khao, Swasth Raho"</b></p>
        <p><b>Visit to our center and See Live Oil Extraction process and buy FRESH Oil for your family</b></p>
        <p><b>* HOME DELIVERY FACILITY IN VADODARA AVAILABLE</b></p>
        <p>Our Mission is <b> "To Provide Best QUATILY Product at Best RATE to our Society and make our society and India Healty"</b></p>
        <p>Our Mission is <b> Our Vision "To Provide Best QUALITY product world wide"</b></p>
      </section>

      {/* <section className="values-grid">
        <div>
          <div className="value-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <strong>Live Inventory</strong>
          <p>
            Every product shows real-time stock counts. You always know what's
            available before placing an order.
          </p>
        </div>
        <div>
          <div className="value-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <strong>Simple Buying</strong>
          <p>
            Browse freely, then sign up with your delivery details when you're
            ready to order. No forced accounts.
          </p>
        </div>
        <div>
          <div className="value-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <strong>Purity Guaranteed</strong>
          <p>
            All our oils are Wood Pressed/Cold Pressed with zero additives, no
            heat processing, and independently lab certified.
          </p>
        </div>
      </section> */}

      <section>
        <div
          style={{
            padding: "36px 32px",
            background: "linear-gradient(135deg, #1a4d2e 0%, #2d6a4f 100%)",
            borderRadius: "18px",
            color: "#fff",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "24px",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.6rem",
                margin: "0 0 8px",
                color: "#fff",
              }}
            >
              Ready to experience the difference?
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                margin: 0,
                fontSize: "0.95rem",
              }}
            >
              Shop our full range of Wood Pressed/Cold Pressed oils and taste
              the Vishwash Foods difference.
            </p>
          </div>
          <a
            href="#/category"
            className="primary-button"
            style={{
              background: "#c8963e",
              boxShadow: "0 4px 16px rgba(200,150,62,0.4)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Shop Now →
          </a>
        </div>
      </section>
    </main>
  );
}
