import { useState } from "react";
import { api } from "../lib/api.js";
import { blockNumberInput, DIGITS_PATTERN, isDigits, isTextValue, TEXT_PATTERN } from "../lib/validation.js";

export default function AuthModal({ mode, setMode, notice, onClose, onAuthed }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    if (isRegister) {
      for (const field of ["name", "city", "state"]) {
        if (!isTextValue(payload[field])) {
          setError(`${field.replace("_", " ")} can contain letters, numbers, spaces, and basic punctuation only.`);
          setBusy(false);
          return;
        }
      }
      for (const field of ["phone", "pincode"]) {
        if (!isDigits(payload[field])) {
          setError(`${field.replace("_", " ")} can contain numbers only.`);
          setBusy(false);
          return;
        }
      }
    }

    try {
      const data = await api(`auth.php?action=${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: payload,
      });
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="auth-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
        <p className="auth-desc">
          {isRegister
            ? "Sign up with your delivery details to place orders."
            : "Login to your Vishwash Foods account."}
        </p>
        {notice && <p className="notice">{notice}</p>}
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={submit}>
          {isRegister && (
            <>
              <label>
                Full name
                <input name="name" pattern={TEXT_PATTERN} autoComplete="name" required />
              </label>
              <label>
                Phone
                <input name="phone" type="tel" inputMode="numeric" pattern={DIGITS_PATTERN} onKeyDown={blockNumberInput} autoComplete="tel" required />
              </label>
              <label>
                Address
                <textarea name="address" rows="3" autoComplete="street-address" required />
              </label>
              <div className="form-row">
                <label>
                  City
                  <input name="city" pattern={TEXT_PATTERN} autoComplete="address-level2" required />
                </label>
                <label>
                  State
                  <input name="state" pattern={TEXT_PATTERN} autoComplete="address-level1" required />
                </label>
              </div>
              <label>
                Pincode
                <input name="pincode" type="tel" inputMode="numeric" pattern={DIGITS_PATTERN} onKeyDown={blockNumberInput} autoComplete="postal-code" required />
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" minLength="6" autoComplete={isRegister ? "new-password" : "current-password"} required />
          </label>
          <button className="primary-button full" disabled={busy}>
            {busy ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </button>
        </form>
        <button className="switch-auth" onClick={() => setMode(isRegister ? "login" : "register")}>
          {isRegister ? "Already have an account? Login" : "New customer? Create account"}
        </button>
      </div>
    </div>
  );
}
