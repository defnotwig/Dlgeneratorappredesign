# 🎯 Lark Message Card Button Setup Guide

## Why Aren't Buttons Working?

Your buttons aren't working because **Lark cannot reach localhost:8000**. Here's what happens:

```
❌ CURRENT FLOW:
You click button → Lark tries to send webhook to localhost:8000 → FAILS (Lark servers can't reach your computer)

✅ CORRECT FLOW:
You click button → Lark sends webhook to public URL → ngrok tunnels to localhost:8000 → Your backend processes
```

---

## 🚀 Complete Setup (Follow Exactly)

### **STEP 1: Download and Install ngrok**

1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok`)
4. Optional: Sign up for free account and run `ngrok authtoken YOUR_TOKEN`

### **STEP 2: Expose Your Backend**

Open a **NEW PowerShell terminal** and run:

```powershell
cd C:\ngrok  # Or wherever you extracted ngrok.exe
.\ngrok http 8000
```

You'll see output like this:

```
Session Status                online
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8000
```

**✅ COPY THE HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

⚠️ **KEEP THIS TERMINAL OPEN!** If you close it, the tunnel stops.

---

### **STEP 3: Configure Lark Webhook**

1. **Go to Lark Developer Console**: https://open.larksuite.com/
2. **Select Your App** (the DL Generator app)
3. **Click "Event Subscriptions"** in the left menu
4. **Configure Request URL**:

   ```
   https://abc123.ngrok-free.app/api/lark/webhook/button-callback
   ```

   (Replace `abc123.ngrok-free.app` with YOUR ngrok URL)

5. **Enable These Events**:

   - ✅ `card.action.trigger` (Card button click)
   - ✅ `im.message.receive_v1` (Optional, for message events)

6. **Lark will verify the URL** by sending a challenge request
   - If successful, you'll see ✅ "Verified"
   - If failed, check:
     - Is ngrok running?
     - Is backend server running on port 8000?
     - Is the URL correct?

---

### **STEP 4: Update Message Card JSON**

In Lark Message Card Builder, make sure your buttons look like this:

```json
{
  "tag": "action",
  "actions": [
    {
      "tag": "button",
      "text": {
        "tag": "plain_text",
        "content": "✅ Approve"
      },
      "type": "primary",
      "value": {
        "action": "approve",
        "signature_id": "{{signature_id}}"
      }
    },
    {
      "tag": "button",
      "text": {
        "tag": "plain_text",
        "content": "❌ Reject"
      },
      "type": "danger",
      "value": {
        "action": "reject",
        "signature_id": "{{signature_id}}"
      }
    }
  ]
}
```

**IMPORTANT**:

- ❌ DO NOT include `"url"` in the button value
- ✅ Only include `"action"` and `"signature_id"`

---

### **STEP 5: Test the Complete Flow**

1. **Make sure everything is running**:

   - ✅ Backend server: `localhost:8000`
   - ✅ Frontend: `localhost:3001`
   - ✅ ngrok: Tunnel running
   - ✅ Lark webhook: Configured and verified

2. **Send a test approval request**:

   - Open DL Generator app: http://localhost:3001
   - Go to Signature Config
   - Click "Send Test Approval Request"

3. **Check Lark**:

   - You should receive the message card
   - All variables should be filled (not {{template}})
   - Image should show

4. **Click a button**:
   - Click "✅ Approve" or "❌ Reject"
   - Watch your backend terminal for logs
   - You should see: `📥 Received Lark webhook...`

---

## 🔍 Troubleshooting

### **Problem: URL Verification Failed**

**Check:**

```powershell
# Test if ngrok is working
Invoke-RestMethod -Uri "https://YOUR_NGROK_URL/api/lark/scheduler/status"
# Should return: {"running": true, ...}
```

**Solution:**

- Make sure backend is running: `http://localhost:8000`
- Make sure ngrok is running
- Try restarting ngrok

---

### **Problem: Button Click Does Nothing**

**Check backend logs** - You should see:

```
📥 Received Lark webhook: {...}
📌 Event type: card.action.trigger
🎯 Processing approve for signature ID: 123
✅ Signature 123 activated
```

**If you see nothing**:

- Lark webhook is not configured correctly
- ngrok tunnel is down
- Backend server crashed

**If you see errors**:

- Check the error message in terminal
- Make sure database has pending approval requests

---

### **Problem: Variables Show as {{template}}**

This means the template variables aren't being replaced.

**Solution:**

1. Check that you're using the correct Template ID in Lark Setup
2. Make sure all variables are defined in Message Card Builder → Variables tab
3. Variables must match exactly (case-sensitive)

---

### **Problem: Image Doesn't Show**

The signature image URL must be:

- Publicly accessible (use ngrok URL)
- Valid image format (PNG/JPG)
- HTTPS (ngrok provides this)

**Update the image URL in your service**:

```python
"signature_image_url": f"https://YOUR_NGROK_URL/uploads/signatures/{signature.file_path.split('/')[-1]}"
```

---

## 📋 Quick Checklist

Before testing, verify:

- [ ] Backend running on localhost:8000
- [ ] Frontend running on localhost:3001
- [ ] ngrok running and shows "online" status
- [ ] Lark webhook configured with ngrok URL
- [ ] Lark webhook shows "Verified" ✅
- [ ] Event `card.action.trigger` is enabled
- [ ] Message Card saved with correct button structure
- [ ] Template ID copied and configured in DL Generator
- [ ] Test message sent and received in Lark
- [ ] Terminal shows backend logs when button clicked

---

## 🎯 Expected Flow

```
1. User clicks button in Lark
   ↓
2. Lark sends POST to: https://abc123.ngrok-free.app/api/lark/webhook/button-callback
   ↓
3. ngrok tunnels to: http://localhost:8000/api/lark/webhook/button-callback
   ↓
4. Backend receives webhook event
   ↓
5. Backend parses button value: {"action": "approve", "signature_id": "123"}
   ↓
6. Backend updates database (approve/reject signature)
   ↓
7. Backend returns: {"success": true, "message": "✅ Approved!"}
   ↓
8. Lark shows success (optional: you can update the card to show status)
```

---

## 💡 Pro Tips

1. **ngrok Free Tier**: URL changes every time you restart ngrok

   - You'll need to update the webhook URL in Lark each time
   - Consider upgrading for a permanent URL

2. **Debugging**: Add this to your backend to see all requests:

   ```python
   @router.post("/webhook/button-callback")
   async def handle_button_callback(payload: dict):
       print(f"📥 WEBHOOK PAYLOAD: {json.dumps(payload, indent=2)}")
       # ... rest of code
   ```

3. **Testing Without Lark**: Test the webhook endpoint directly:

   ```powershell
   $body = @{
       header = @{ event_type = "card.action.trigger" }
       event = @{
           action = @{
               value = @{
                   action = "approve"
                   signature_id = "1"
               }
           }
       }
   } | ConvertTo-Json -Depth 10

   Invoke-RestMethod -Uri "http://localhost:8000/api/lark/webhook/button-callback" -Method POST -Body $body -ContentType "application/json"
   ```

---

## 📞 Still Not Working?

Check backend logs for specific errors and paste them here for help.

Common issues:

- Database not initialized (no pending approval requests)
- Template variables not replaced (using wrong template ID)
- ngrok tunnel expired (free tier has time limit)
- Backend crashed (check terminal for Python errors)
