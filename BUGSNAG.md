# Bugsnag Observability

This project uses [Bugsnag](https://www.bugsnag.com/) for error tracking and user journey monitoring. When something breaks, Bugsnag shows you the exact sequence of user actions that led to the error — across both the React frontend and the Node/Express backend.

**What it covers:** Login → Product Discovery → Cart → Checkout → Payment

---

## Quick Start

### 1. Create a Bugsnag account and projects

1. Sign up at [app.bugsnag.com](https://app.bugsnag.com)
2. Create **two projects** — one for the frontend (Browser), one for the backend (Node.js)
3. Copy the API key for each project (Settings → API Key)

### 2. Add the API keys to your `.env` files

**`backend/.env`** — add these lines:
```env
BUGSNAG_API_KEY=paste_your_backend_api_key_here
APP_VERSION=1.0.0
```

**`frontend/.env`** — add these lines:
```env
VITE_BUGSNAG_API_KEY=paste_your_frontend_api_key_here
VITE_NODE_ENV=development
VITE_APP_VERSION=1.0.0
```

> If `VITE_BUGSNAG_API_KEY` is not set, Bugsnag is silently disabled — the app still works normally.

### 3. Start the app

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

That's it. Errors will now appear in your Bugsnag dashboard within a few seconds of occurring.

---

## Which environment sends errors?

By default, errors are sent in **all environments** (development, staging, production). This is intentional so you can verify the integration immediately.

To disable Bugsnag in development, open both config files and remove `'development'` from the `enabledReleaseStages` array:

**`backend/config/bugsnag.js`** and **`frontend/src/config/bugsnag.jsx`**:
```js
enabledReleaseStages: ['production', 'staging']  // remove 'development' to silence it locally
```

---

## What gets tracked automatically

Once the API keys are set, the following happens with **no extra code**:

| What | How |
|------|-----|
| All unhandled JavaScript errors | Bugsnag global error handler |
| React component crashes (render errors) | `ErrorBoundary` wrapping the whole app |
| All Express route errors | `bugsnagMiddleware.errorHandler` in server.js |
| Every API request (method, path, status, duration) | Axios interceptors (frontend) + `res.on('finish')` (backend) |
| Page navigations | `useBugsnagPageTracking()` in App.jsx |
| Logged-in user identity | Redux auth slice sets `bugsnagManager.setUser()` on login/logout |

---

## How it works

### Key concepts

**Breadcrumbs** are a timestamped trail of events (up to 25 by default) attached to every error. When an error occurs, you see exactly what happened before it — which page the user was on, what they clicked, which API calls fired, what the cart contained.

**Flow context** labels the current stage of the user journey (e.g. `"Checkout Flow - Payment Step"`). Every error carries this label so you can filter the dashboard by flow.

**Session ID** is a UUID stored in `sessionStorage`. It persists across page navigations within a browser tab and is attached to every event, so you can filter the Bugsnag dashboard to see one user's complete journey.

### Data flow

```
User action
    │
    ├─ React hook (useBugsnagFlowContext, useBugsnagCartTracking, etc.)
    │       └─ leaveBreadcrumb()
    │
    ├─ Axios interceptor
    │       └─ trackAPICall() on every request/response
    │
    └─ Redux slice (authSlice)
            └─ setUser() on login/logout

When an error occurs:
    Bugsnag captures up to 25 breadcrumbs + sessionId + userId + flow context
    └─ Appears in dashboard as a correlated event
```

### Key files

| File | What it does |
|------|-------------|
| `frontend/src/config/bugsnag.jsx` | Initialises Bugsnag SDK, exports `getErrorBoundary()` |
| `frontend/src/utils/bugsnag.jsx` | `BugsnagManager` singleton — all tracking methods |
| `frontend/src/hooks/useBugsnag.jsx` | React hooks for component-level tracking |
| `frontend/src/components/ErrorBoundary.jsx` | Wraps the app; catches component render errors |
| `frontend/src/main.jsx` | Calls `initializeBugsnag()` before mounting the app |
| `backend/config/bugsnag.js` | Initialises Bugsnag with the Express plugin |
| `backend/utils/bugsnag.js` | `BugsnagManager` singleton for the backend |
| `backend/server.js` | Mounts Bugsnag request/error middleware |

---

## Testing the integration

Every tracked page has a yellow **Bugsnag Test** panel visible only in development (`import.meta.env.DEV`). Use these buttons to fire test errors directly into your dashboard without needing to break real functionality.

| Page | Button | What it sends |
|------|--------|--------------|
| `/login` | Simulate: Login API Failure | Handled error — type `login_error`, status not set (no real HTTP call) |
| `/products/:id` | Simulate: UI Crash | Unhandled error caught by `ErrorBoundary` (calls an undefined function) |
| `/cart` | Simulate: Cart Service Unavailable | Handled error — type `api_error`, status 503 |
| `/checkout` | Simulate: Payment Gateway Timeout | Handled error — type `payment_error`, status 504 |

**Prerequisites for the Cart and Checkout buttons:** you must be logged in and have at least one item in your cart.

After clicking a test button, open your Bugsnag dashboard and look for the new error. Click into it and check the **Breadcrumbs** tab to see the full trail of events.

---

## QA Scenarios

Run through these after setup to confirm end-to-end tracking works.

### Scenario 1 — Login failure
1. Go to `/login`, enter wrong credentials, click Login
2. In Bugsnag, find the `login_error` event
3. Verify: breadcrumbs show form submit → API call → login failed; no password visible in metadata

### Scenario 2 — UI crash (React Error Boundary)
1. Go to any product detail page
2. Click "Simulate: UI Crash" in the yellow panel
3. In Bugsnag: error is caught by ErrorBoundary, stack trace is present, flow = `Product View`

### Scenario 3 — Cart API failure
1. Add an item to cart, go to `/cart`
2. Click "Simulate: Cart Service Unavailable"
3. In Bugsnag: error type `api_error`, `statusCode: 503`, `testInjected: true` in metadata

### Scenario 4 — Payment timeout
1. Go through to `/checkout`
2. Click "Simulate: Payment Gateway Timeout"
3. In Bugsnag: error type `payment_error`, `statusCode: 504`, payment method and amount visible

### Scenario 5 — Session continuity
1. Open DevTools console, run: `sessionStorage.getItem('bugsnag_session_id')`
2. Note the value, then complete a full journey: login → browse → add to cart → checkout
3. In Bugsnag: filter by that session ID — all events from the journey appear together

---

## What a breadcrumb trail looks like

Illustrative example of what appears in the Bugsnag **Breadcrumbs** tab when an order fails at checkout:

```
[navigation] Navigated to: /cart
[state]      Cart Updated — 2 items, ₹1,249
[user]       Action: proceed_to_checkout
[navigation] Navigated to: /checkout
[user]       Action: payment_method_selected — COD
[user]       Order Placement Initiated — 2 items, ₹1,298
[request]    API: POST /api/orders — status 500, 1840ms
```

When `notifyError()` is called on failure, the error itself appears as the event in the Bugsnag dashboard — the breadcrumbs above are the trail attached to that event.

Breadcrumb types: `navigation` (page changes), `user` (clicks, form submits), `request` (API calls), `state` (cart/order state).

---

## Sensitive data masking

The following are automatically redacted before any data is sent to Bugsnag.

**String pattern matching** — applied to string values in breadcrumb data:

| Data type | Replaced with |
|-----------|--------------|
| Credit card numbers | `[CREDITCARD_REDACTED]` |
| Passwords | `[PASSWORD_REDACTED]` |
| Auth tokens | `[AUTHTOKEN_REDACTED]` |
| Bearer tokens | `[BEARERTOKEN_REDACTED]` |
| API keys | `[APIKEY_REDACTED]` |
| SSNs (`###-##-####`) | `[SSN_REDACTED]` |

**Field name matching** — any object key containing `password`, `token`, `apiKey`, `creditCard`, `cvv`, `ssn`, `email`, or `phone` is replaced with `[REDACTED]`.

To mask additional custom fields:
```js
import bugsnagManager from '../utils/bugsnag.jsx';

const safe = bugsnagManager.maskSensitiveFields(formData, ['cvv', 'pin', 'accountNumber']);
```

---

## Adding tracking to new code

### Frontend — tracking a new user action

```jsx
import bugsnagManager from '../utils/bugsnag.jsx';

// In any event handler:
bugsnagManager.trackActionClick('wishlist_add', { productId: product._id, price: product.price });
```

### Frontend — setting flow context on a new page

```jsx
import { useBugsnagFlowContext } from '../hooks/useBugsnag.jsx';

export default function WishlistPage() {
  useBugsnagFlowContext('Wishlist Flow'); // sets flow context when component mounts
  // ...
}
```

### Frontend — reporting a handled error

```jsx
bugsnagManager.notifyError(
  new Error('Promo code validation failed'),
  'promo_error',
  { code: promoCode, cartTotal }
);
```

### Backend — reporting a handled error

```js
const bugsnagManager = require('../utils/bugsnag');

bugsnagManager.notifyError(error, 'stock_check_failed', {
  productId: req.params.id,
  requestedQty: req.body.quantity,
});
```

---

## Dashboard tips

### Find all errors in a specific flow
In the Bugsnag dashboard go to **Errors**, click **Add filter**, and use:
```
context == "Checkout Flow"
```

### Trace a single user's full session
```
metadata.sessionId == "the-session-uuid"
```

### Recommended alerts to set up (Settings → Alerts)

| Alert | Condition | Suggested threshold |
|-------|-----------|-------------------|
| Payment failures | `context == "Checkout Flow - Payment Step"` | 2+ errors / 5 min |
| API timeouts | error message contains `timeout` | 5+ errors / 10 min |
| Login failures | `metadata.errorType == "login_error"` | 10+ errors / 5 min |

---

## Regression checklist

After any significant change, verify:

- [ ] App loads cleanly with no errors in browser console or backend logs
- [ ] Test errors from DEV panels appear in Bugsnag within ~5 seconds
- [ ] `sessionId` is consistent across all events in one browser session
- [ ] `userId` is present on events after login and absent after logout
- [ ] No passwords, tokens, or card numbers appear in breadcrumb metadata
- [ ] Error Boundary fallback UI renders when the UI Crash button is clicked

---

## Troubleshooting

**Errors not appearing in Bugsnag**
- Check the API key is correct and set in your `.env` file
- Check `enabledReleaseStages` in `backend/config/bugsnag.js` and `frontend/src/config/bugsnag.jsx` includes your current `NODE_ENV` value
- Look for `✅ Bugsnag initialized successfully` in the browser console — if it's missing, the key is not being read

**ErrorBoundary not catching crashes**
- This is a known ES module timing issue. The fix is already in place: `ErrorBoundary.jsx` uses lazy initialisation (`CachedBoundary`) so `getErrorBoundary()` is only called after `initializeBugsnag()` has run

**Breadcrumbs missing from an error**
- Breadcrumbs are capped at 25 by default — if you have a very long session, the oldest are dropped
- Ensure the breadcrumb call happens *before* the error is thrown, not inside a catch block

**Session ID changes between pages**
- `sessionStorage` is cleared when the browser tab is closed. This is expected — a new tab = a new session
- Private/incognito mode may block `sessionStorage` in some browsers

**Backend errors not appearing**
- Check `bugsnagMiddleware.requestHandler` is registered *before* your routes
- Check `bugsnagMiddleware.errorHandler` is registered *after* all routes but *before* the final `errorHandler` middleware (this order is already set in `server.js`)

---

## Official docs
- [Bugsnag Node.js / Express guide](https://docs.bugsnag.com/platforms/node/express/)
- [Bugsnag React guide](https://docs.bugsnag.com/platforms/browser/react/)
- [Breadcrumbs reference](https://docs.bugsnag.com/platforms/browser/breadcrumbs/)
- [Dashboard filters](https://docs.bugsnag.com/product/searching-and-filtering/)
