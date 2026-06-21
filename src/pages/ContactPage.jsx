import { useState } from "react";
import { api } from "../lib/api.js";
import {
  blockNumberInput,
  DIGITS_PATTERN,
  isDigits,
  isTextValue,
  TEXT_PATTERN,
} from "../lib/validation.js";

export default function ContactPage({ showToast }) {
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    if (!isTextValue(payload.name)) {
      showToast(
        "Name can contain letters, numbers, spaces, and basic punctuation only.",
      );
      return;
    }

    if (payload.phone && !isDigits(payload.phone)) {
      showToast("Phone number can contain numbers only.");
      return;
    }

    setBusy(true);

    try {
      await api("contact.php", { method: "POST", body: payload });
      form.reset();
      showToast("Message sent successfully!");
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <main className="page-wrap two-column">
        {/* Left: Info */}
        <section className="copy-panel">
          <p className="eyebrow">Get in Touch</p>
          <h1>
            Talk to
            <br />
            Vishwash Foods
          </h1>

          <p>
            For bulk orders, delivery updates, product questions, or store
            partnerships — send us a message and our team will get back to you
            within 24 hours.
          </p>

          <p>Vishwash Lakda Ghani - Vishwash Foods</p>

          <div className="contact-lines">
            <div className="contact-line-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +91 9106152801
            </div>

            <div className="contact-line-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              vishwashfoods22@gmail.com
            </div>

            <div className="contact-line-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              C/117, Amit Nagar, VIP Road, Karelibaugh, Vadodara, Gujarat -
              390018
            </div>
          </div>

          {/* Hours */}
          <div className="business-hours">
            <strong>🕐 Business Hours</strong>
            <p>
              Monday – Saturday: 9:00 AM – 6:00 PM
              <br />
              Sunday: Closed
            </p>
          </div>
        </section>

        {/* Right: Form */}
        <form className="panel-form" onSubmit={submit}>
          <h2>Send us a Message</h2>

          <p className="form-subtitle">We'll respond within 24 hours.</p>

          <div className="form-row">
            <label>
              Full Name *
              <input
                name="name"
                pattern={TEXT_PATTERN}
                title="Use letters, numbers, spaces, and basic punctuation only."
                required
                placeholder="Your name"
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern={DIGITS_PATTERN}
                onKeyDown={blockNumberInput}
                placeholder="10-digit number"
              />
            </label>
          </div>

          <label>
            Email *
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Message *
            <textarea
              name="message"
              rows="5"
              required
              placeholder="Tell us how we can help..."
            />
          </label>

          <button className="primary-button full" disabled={busy}>
            {busy ? "Sending..." : "Send Message →"}
          </button>
        </form>
      </main>

      {/* Map Section */}
      <section className="map-section">
        <div className="map-heading">
          <p className="eyebrow">Our Location</p>
          <h2>Visit Vishwash Foods</h2>
        </div>

        <div className="map-box">
          <iframe
             title="Vishwash Foods Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7381.28573279218!2d73.20492637450957!3d22.329342479665677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fcf9663d7d64f%3A0x1574e94b72300478!2sVishwash%20Foods!5e0!3m2!1sen!2sin!4v1782053101331!5m2!1sen!2sin"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>
    </>
  );
}
