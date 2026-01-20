# 🚀 QUICK START - Your Setup is Ready!

## ✅ What's Running:

- Backend: http://localhost:8000 ✅
- Frontend: http://localhost:3001 ✅
- Public Tunnel: https://kind-areas-push.loca.lt ✅

---

## 📋 FINAL STEPS (5 minutes):

### 1️⃣ Configure Lark Webhook

Go to: https://open.larksuite.com/

- Select your app
- Event Subscriptions → Request URL:
  ```
  https://kind-areas-push.loca.lt/api/lark/webhook/button-callback
  ```
- Enable: `card.action.trigger`
- Save ✅

### 2️⃣ Update Message Card Image URL (Optional)

If you want the signature image to show in Lark messages, update this line in:
`backend/app/services/lark_approval_service.py` around line 383:

Change:

```python
"signature_image_url": f"http://localhost:8000/uploads/signatures/..."
```

To:

```python
"signature_image_url": f"https://kind-areas-push.loca.lt/uploads/signatures/..."
```

### 3️⃣ Test!

1. Open: http://localhost:3001
2. Signature Config → "Send Test Approval Request"
3. Check Lark app
4. Click the button
5. Done! 🎉

---

## 🔍 Troubleshooting:

**Webhook verification fails?**

- Visit https://kind-areas-push.loca.lt in browser first
- Click "Continue" if you see a warning page
- Then try verification again

**Tunnel stopped?**

- Just run: `lt --port 8000` again
- Update webhook URL in Lark with new URL

**Button not working?**

- Check backend terminal for logs
- Look for: `📥 Received Lark webhook...`
- If no logs, webhook isn't configured correctly

---

## ⚠️ Important Notes:

1. **Keep terminal open** - Closing it stops the tunnel
2. **URL changes** - Each time you restart localtunnel, you get a new URL
3. **Update Lark** - After restart, update webhook URL in Lark console
4. **For permanent URL** - Consider ngrok paid plan or deploy to cloud

---

## 🎯 Your Webhook Endpoints:

All public via: `https://kind-areas-push.loca.lt`

- POST `/api/lark/webhook/button-callback` - Button clicks
- GET `/api/lark/approval/approve/{id}` - Direct approve
- GET `/api/lark/approval/reject/{id}` - Direct reject
- POST `/api/lark/approval/self-test` - Test messaging
- GET `/api/lark/scheduler/status` - Scheduler status

---

## ✨ Everything is ready! Just configure the webhook in Lark and test!
