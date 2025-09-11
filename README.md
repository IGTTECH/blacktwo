# Project


## Firebase & Firestore setup (added files)

This project was updated to include:
- `register.html`, `login.html`, `forgot.html`
- Six dashboard pages (restricted): `website-dev-dashboard.html`, `mobile-rep-dashoard.html`, `kujenga-tovuti-dashboard.html`, `ufundi-simu-dashboard.html`, `kubaka-imbuga-dashboard.html`, `gukora-phone-dashboard.html`
- `src/firebase-config.js` — placeholder file. Replace with your Firebase config.
- `src/auth.js` — client-side auth logic using Firebase Auth and Firestore.
- PayPal integration via client-side Smart Buttons for payment. Replace `YOUR_PAYPAL_CLIENT_ID` in the PayPal SDK script tag with your PayPal client id.

High-level flow:
1. User registers via `register.html`. The form creates a Firebase Auth user (email/password), saves profile in Firestore (collection `users`), and sends an email verification.
2. After account creation, user completes payment via PayPal. On successful payment the `users/{uid}` doc is updated with `paid: true`, `plan`, `planPrice`, and `paymentDetails`. User is redirected to the plan dashboard.
3. Dashboard pages are protected by a client-side guard that checks the `users/{uid}` document for `paid: true` OR that the user's UID exists in `admins/{uid}` (for admin access).

Security notes & production readiness:
- Payment verification should be confirmed server-side. The current implementation uses client-side PayPal SDK only. For reliable, secure payment handling, implement a server endpoint or webhook to verify PayPal orders and update Firestore from a trusted backend.
- Protect Firestore with security rules that only allow updates to `users/{uid}` by the corresponding authenticated user, and only allow writes to `admins` by authorized admins.
- Email verification is enforced in client-side checks, but you should also enforce verification via backend logic where possible.
- Do not commit your actual Firebase config or PayPal client secret to a public repo. Use environment variables or build-time injection for production.

Admin setup:
- Create a Firestore collection `admins` and add documents with document id equal to an admin's UID. The client code treats any existing doc in `admins/{uid}` as an admin and grants access to restricted pages.

Files added/updated:
- register.html, login.html, forgot.html
- website-dev-dashboard.html, mobile-rep-dashoard.html, kujenga-tovuti-dashboard.html, ufundi-simu-dashboard.html, kubaka-imbuga-dashboard.html, gukora-phone-dashboard.html
- src/firebase-config.js (placeholder)
- src/auth.js

After you update `src/firebase-config.js` and replace the PayPal client id in the script tag, the project should be ready to test locally.



## 🔒 Firestore Security Rules

This project includes a `firestore.rules` file that enforces:

- Users can only read/write their own profile under `/users/{uid}`
- Admins (UID exists in `/admins/{uid}`) can read all users and manage `/admins`
- All other access is denied by default

### Deploying rules

1. Install Firebase CLI if not already:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to Firebase:
   ```bash
   firebase login
   ```
3. Initialize Firestore if not already linked:
   ```bash
   firebase init firestore
   ```
   (choose "use existing project" and select your Firebase project)
4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Notes
- Ensure each new user gets a Firestore doc in `/users/{uid}` during registration.
- To grant admin rights, create a document in `/admins/{uid}` for that user’s UID.
- Do not store secrets or sensitive PayPal client IDs in Firestore.


## Final fixes
- Added `assets/styles.css` for styling and improved page layout.
- `src/auth.js` exports functions used by pages.
- Added `seed-admin.js` to seed admin UIDs (requires service account key).
