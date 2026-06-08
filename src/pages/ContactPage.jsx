import { useState } from "react";
import { api } from "../lib/api.js";
import { blockNumberInput, DIGITS_PATTERN, isDigits, isTextValue, TEXT_PATTERN } from "../lib/validation.js";

export default function ContactPage({ showToast }) {
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    if (!isTextValue(payload.name)) {
      showToast("Name can contain letters, numbers, spaces, and basic punctuation only.");
      return;
    }
    if (payload.phone && !isDigits(payload.phone)) {
      showToast("Phone number can contain numbers only.");
      return;
    }

    setBusy(true);
    try {
      await api("contact.php", {
        method: "POST",
        body: payload,
      });
      form.reset();
      showToast("Message sent.");
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap two-column">
      <section className="copy-panel">
        <p className="eyebrow">Contact</p>
        <h1>Talk to Viswas Oils</h1>
        <p>
          For bulk orders, delivery updates, product questions, or store partnerships, send a message and the team will get back to you.
        </p>
        <div className="contact-lines">
          <span>Phone: +91 99999 99999</span>
          <span>Email: care@viswasoils.test</span>
          <span>Address: Viswas Oils, Main Market Road, India</span>
        </div>
      </section>
      <form className="panel-form" onSubmit={submit}>
        <label>
          Name
          <input name="name" pattern={TEXT_PATTERN} title="Use letters, numbers, spaces, and basic punctuation only." required />
        </label>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" inputMode="numeric" pattern={DIGITS_PATTERN} onKeyDown={blockNumberInput} />
        </label>
        <label>
          Message
          <textarea name="message" rows="5" required />
        </label>
        <button className="primary-button full" disabled={busy}>
          {busy ? "Sending..." : "Send message"}
        </button>
      </form>
    </main>
  );
}
