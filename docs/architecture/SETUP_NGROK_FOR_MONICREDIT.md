# Setup ngrok for Monicredit Webhook (Local Testing)

## Quick Start

### 1. Install ngrok

**macOS:**

```bash
brew install ngrok
```

**Or download:**

- Visit: https://ngrok.com/download
- Extract and add to PATH

### 2. Start ngrok Tunnel

```bash
ngrok http 5000
```

**Output:**

```
Forwarding: https://abc123def456.ngrok.io -> http://localhost:5000
```

### 3. Copy Public URL

Copy the `https://abc123def456.ngrok.io` URL.

### 4. Update Monicredit Webhook URL

In Monicredit merchant dashboard:

- Go to **Settings** → **Webhooks** (or similar)
- Update webhook URL to:
  ```
  https://abc123def456.ngrok.io/api/monicredit/webhook/payment
  ```
- Save

### 5. Test

1. Make a payment through Monicredit
2. Watch ngrok terminal for incoming requests
3. Watch backend terminal for webhook processing logs
4. Verify payment status updates

## ngrok Dashboard

While ngrok is running, visit:

```
http://localhost:4040
```

This shows:

- All incoming requests
- Request/response details
- Replay requests for testing

## Important Notes

### Free Tier Limitations:

- Random URL each time you restart ngrok
- URL changes on restart
- Limited requests per minute

### For Production:

- Use production backend URL: `https://api.app.contrezz.com/api/monicredit/webhook/payment`
- Don't use ngrok in production

### For Persistent Local Testing:

- Sign up for ngrok account (free)
- Get static domain (paid feature)
- Or use production environment for testing

---

**Last Updated:** December 17, 2025  
**Status:** Guide for setting up ngrok for local webhook testing
