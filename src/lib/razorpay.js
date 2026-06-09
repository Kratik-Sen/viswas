const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let checkoutScriptPromise = null;

export function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (checkoutScriptPromise) {
    return checkoutScriptPromise;
  }

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    const script = existingScript || document.createElement("script");
    let settled = false;

    function finish(error = null) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (error) {
        checkoutScriptPromise = null;
        reject(error);
        return;
      }
      if (!window.Razorpay) {
        checkoutScriptPromise = null;
        reject(new Error("Razorpay checkout could not start."));
        return;
      }
      resolve(window.Razorpay);
    }

    const timeout = window.setTimeout(() => {
      finish(new Error("Razorpay checkout took too long to load."));
    }, 15000);

    script.addEventListener("load", () => finish(), { once: true });
    script.addEventListener("error", () => finish(new Error("Razorpay checkout failed to load.")), { once: true });

    if (!existingScript) {
      script.src = RAZORPAY_CHECKOUT_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return checkoutScriptPromise;
}
