# Viswas Oils Ecommerce

Vite React frontend with a PHP/MySQL backend for a cooking oil store. It includes user signup, cart, Razorpay checkout, Cloudinary image upload, order history, contact messages, and an admin panel for adding products with multiple photos.

## Setup

1. Place this folder at `c:\xampp\htdocs\viswas`.
2. Start Apache and MySQL in XAMPP.
3. Run `npm install`.
4. Open `http://localhost/viswas/api/install.php` once to create the database and seed the admin account plus sample products.
5. Update `.env` with your database, admin, Cloudinary, and Razorpay keys.
6. Run `npm run dev` and open `http://localhost:5173/`.

For production frontend files, run `npm run build`. The compiled app is written to `dist/`.

Default admin login:

- Email: `admin@viswas.test`
- Password: `admin123`

Change these values in `.env` before running this as a real store.

## Pages

- Home
- Category
- About
- Privacy Policy
- Contact
- Cart
- Orders
- Admin panel

## Notes

- Product images upload to Cloudinary when Cloudinary credentials are configured.
- If Cloudinary is not configured, images are stored locally in `uploads/` so development can continue.
- Razorpay checkout requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.
- Users can browse every public page, but checkout requires signup or login with address details.





RAZORPAY_KEY_ID=rzp_test_SzRHvHgVlHAjza
RAZORPAY_KEY_SECRET=53E530dPYW2VMQ2RxM9jXTp3
