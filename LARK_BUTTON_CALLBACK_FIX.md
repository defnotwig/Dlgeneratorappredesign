# CRITICAL FIX: Lark Button Callbacks (Error 200340)

## Root Cause

Error code **200340** means: "Card callback URL not configured in Lark Developer Console"

For interactive card buttons (Approve/Reject) to work, you MUST configure the **Request URL** in your Lark app settings. This is a Lark platform requirement - buttons in cards route to this centralized URL.

---

## EXACT STEPS TO FIX

### Step 1: Open Lark Developer Console

1. Go to: https://open.larksuite.com/app
2. Select your app: **cli_a8b6486fcb399029**
3. Click on the app to enter settings

### Step 2: Enable Event Subscriptions

1. In the left sidebar, find **"Events & Callbacks"** or **"Event Subscriptions"**
2. Click to expand the section
3. Look for **"Callback configuration"** or **"Request URL"**

### Step 3: Configure Card Callback URL

1. Find the section: **"Message Card Request URL"** or **"Card Callback"**
2. Enter your ngrok URL with the endpoint:

```
https://subdistichously-unexploitative-benito.ngrok-free.dev/api/lark/webhook/button-callback
```

3. Click **"Verify"** - Lark will send a verification request
4. Our backend will respond with the challenge token
5. Once verified, click **"Save"**

### Step 4: Add Required Event Permission

1. Go to **"Permissions & Scopes"** or **"Permissions"**
2. Add these permissions if not already added:

   - `im:message` - Read and send messages
   - `im:message:send_as_bot` - Send messages as bot
   - `im:message.card_action` - Receive card action callbacks

3. Click **"Save and Request Approval"** if needed

### Step 5: Verify Callback Works

1. Send a test approval request from DL Generator
2. Click Approve or Reject in Lark
3. The button should now work without error

---

## What Happens When Configured

1. User clicks "APPROVE" or "REJECT" button in Lark card
2. Lark sends POST request to your configured Request URL
3. Our backend receives the webhook at `/api/lark/webhook/button-callback`
4. Backend processes the action and updates database
5. Backend returns a card update response showing result

---

## Verification Test

Run this command to test the webhook endpoint directly:

```bash
curl -X POST http://localhost:8000/api/lark/webhook/button-callback \
  -H "Content-Type: application/json" \
  -d '{"type": "url_verification", "challenge": "test123"}'
```

Expected response: `{"challenge": "test123"}`

---

## Common Issues

| Error              | Cause                             | Fix                               |
| ------------------ | --------------------------------- | --------------------------------- |
| 200340             | Card callback URL not configured  | Follow steps above                |
| Connection timeout | Ngrok not running                 | Start ngrok on port 8000          |
| 403 Forbidden      | IP whitelist                      | Add ngrok IP or disable whitelist |
| Invalid challenge  | Backend not handling verification | Restart backend                   |
