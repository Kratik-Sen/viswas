export default function AboutPage() {
  return (
    <main className="page-wrap story-page">
      <section className="copy-panel">
        <p className="eyebrow">About</p>
        <h1>Cooking oil with source, care, and clarity.</h1>
        <p>
          Viswas Oils is built for homes that want reliable cooking oils without confusion. The catalogue focuses on familiar kitchen staples, clear categories, live stock, and a direct checkout experience.
        </p>
      </section>
      <section className="values-grid">
        <div>
          <strong>Fresh inventory</strong>
          <p>Every product shows the quantity available before a customer places an order.</p>
        </div>
        <div>
          <strong>Simple buying</strong>
          <p>Customers can browse freely, then sign up with delivery details when they are ready to order.</p>
        </div>
        <div>
          <strong>Admin control</strong>
          <p>The admin panel handles product photos, pricing, stock, categories, and Razorpay keys.</p>
        </div>
      </section>
    </main>
  );
}
