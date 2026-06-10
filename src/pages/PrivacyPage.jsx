export default function PrivacyPage() {
  return (
    <main className="page-wrap policy-page">
      <p className="eyebrow">Privacy Policy</p>
      <h1>Privacy Policy</h1>
      <p>
        Vishwash Foods collects customer details needed to create accounts, deliver orders, collect payments, and respond to contact messages.
      </p>
      <h2>Information We Collect</h2>
      <p>Name, email, phone number, address, city, state, pincode, order details, payment references, and contact form messages.</p>
      <h2>How We Use It</h2>
      <p>We use this information for account access, delivery, customer support, payment verification, stock management, and order history.</p>
      <h2>Payments</h2>
      <p>Payments are handled through Razorpay. Vishwash Foods stores payment IDs and verification status, not card or UPI credentials.</p>
      <h2>Data Security</h2>
      <p>Secrets such as Cloudinary and Razorpay credentials belong in the server .env file. Admin access should be limited to trusted store owners.</p>
      <h2>Contact</h2>
      <p>For privacy questions, contact care@vishwashfoods.test.</p>
    </main>
  );
}
