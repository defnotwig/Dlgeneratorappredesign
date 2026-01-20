# 🤖 Step-by-Step Guide: Enable Lark Bot for DL Generator

## Prerequisites

- ✅ Lark Developer Account
- ✅ DL Generator app already created
- ✅ Admin access to your Lark workspace

---

## Step 1: Open Lark Developer Console (1 minute)

### 1.1 Navigate to Developer Portal

1. Open your browser
2. Go to: **https://open.larksuite.com/**
3. Log in with your Lark account credentials
4. You should see the **Developer Console** dashboard

### 1.2 Find Your App

1. On the dashboard, you'll see a list of apps
2. Find **"DL Generator"** in the list
3. **Click on it** to open the app settings

---

## Step 2: Enable Bot Capability (3 minutes)

### 2.1 Navigate to Bot Section

You'll see a left sidebar with several menu items. Look for one of these:

**Option A: If you see "Bot" directly in the menu**

```
📋 Menu Options:
├─ Overview
├─ Credentials & Basic Info
├─ Features & Capabilities
├─ 🤖 Bot                    ← CLICK HERE
├─ Permissions & Scopes
├─ Event Subscriptions
└─ ...
```

**Option B: If you see "Features" or "Capabilities"**

```
📋 Menu Options:
├─ Overview
├─ Credentials & Basic Info
├─ 🎯 Features & Capabilities  ← CLICK HERE
│   ├─ Bot
│   ├─ Message Card
│   ├─ Webhook
│   └─ ...
├─ Permissions & Scopes
└─ ...
```

### 2.2 Enable Bot Feature

Once you're on the Bot page, you'll see:

```
┌─────────────────────────────────────────────────┐
│  🤖 Bot                                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ○ Disabled        ● Enabled  ← Click this     │
│                                                 │
│  Add a bot to enable your app to:              │
│  • Send and receive messages                    │
│  • Interact with users                          │
│  • Post in group chats                          │
│                                                 │
│  Bot Information:                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Bot Name: DL Generator                  │   │
│  │ Bot Description: Approval bot for...    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Enable Bot]  ← If you see a button, click it │
└─────────────────────────────────────────────────┘
```

**What to do:**

1. Toggle the switch from **"Disabled"** to **"Enabled"**
   - OR click the **"Enable Bot"** button if you see one
2. Fill in bot details if asked:
   - **Bot Name**: `DL Generator Bot` (or keep default)
   - **Bot Description**: `Signature approval bot for DL Generator`
3. Click **"Save"** or **"Confirm"**

### 2.3 Verify Bot is Enabled

After enabling, you should see:

- ✅ Green checkmark or status showing **"Enabled"**
- 🤖 Bot information section is now visible
- A **Bot ID** or **Bot Open ID** displayed

---

## Step 3: Configure Bot Permissions (2 minutes)

### 3.1 Go to Permissions & Scopes

1. In the left sidebar, click **"Permissions & Scopes"**
2. You'll see a list of available scopes/permissions

### 3.2 Add Required Scopes

Make sure these scopes are **ENABLED** (checked):

**Message Scopes:**

- ✅ `im:message` - Send messages
- ✅ `im:message:send_as_bot` - Send messages as bot
- ✅ `im:chat` - Access chat information

**User Information Scopes:**

- ✅ `contact:user.base:readonly` - Get user basic info
- ✅ `contact:user.email:readonly` - Get user email
- ✅ `contact:user.employee_id:readonly` - Get user ID

**Image Upload Scope (for signature preview):**

- ✅ `im:image` - Upload images
- ✅ `im:resource` - Upload resources

### 3.3 Save Permissions

1. Scroll to bottom
2. Click **"Save"** or **"Apply Changes"**
3. If admin approval is required, click **"Request Approval"**

---

## Step 4: Enable Message Card Feature (2 minutes)

### 4.1 Navigate to Features

1. In the left sidebar, find **"Features & Capabilities"** or **"Features"**
2. Click on it

### 4.2 Enable Message Card

Look for these options and enable them:

```
┌─────────────────────────────────────────────┐
│  Features & Capabilities                    │
├─────────────────────────────────────────────┤
│                                             │
│  🤖 Bot                        [✅ Enabled] │
│                                             │
│  📋 Message Card              [○ Disabled]  │
│     Interactive cards with      ↑          │
│     buttons and forms      ENABLE THIS!    │
│                                             │
│  🔗 Webhook                   [○ Disabled]  │
│                                             │
│  📨 Notification              [○ Disabled]  │
│                                             │
└─────────────────────────────────────────────┘
```

**What to do:**

1. Find **"Message Card"** or **"Interactive Messages"**
2. Toggle it to **"Enabled"**
3. Click **"Save"**

---

## Step 5: Configure Event Subscriptions (3 minutes)

### 5.1 Navigate to Event Subscriptions

1. In the left sidebar, click **"Event Subscriptions"** or **"Event & Callback"**
2. You'll see a section for configuring webhooks

### 5.2 Add Request URL

```
┌─────────────────────────────────────────────────────┐
│  Event Subscriptions Configuration                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Request URL Configuration:                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ https://subdistichously-unexploitative-        │ │
│  │ benito.ngrok-free.dev/api/lark/webhook/        │ │
│  │ button-callback                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Encryption Key (Optional):                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Leave blank]                                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Verify]  ← Click to test connection              │
│  Status: ○ Not Verified                            │
└─────────────────────────────────────────────────────┘
```

**What to do:**

1. **Paste your ngrok URL** in the Request URL field:
   ```
   https://subdistichously-unexploitative-benito.ngrok-free.dev/api/lark/webhook/button-callback
   ```
2. Click **"Verify"** button
3. Wait for green checkmark: ✅ **Verified**
4. If verification fails:
   - Check that backend is running: `http://localhost:8000`
   - Check that ngrok is active
   - Try verification again

### 5.3 Subscribe to Events

Below the URL configuration, you'll see:

```
┌─────────────────────────────────────────────┐
│  Subscribed Events                          │
├─────────────────────────────────────────────┤
│                                             │
│  No events subscribed yet                   │
│                                             │
│  [+ Add Event]  ← Click here                │
│                                             │
└─────────────────────────────────────────────┘
```

**What to do:**

1. Click **"+ Add Event"** or **"Subscribe to Event"**
2. A modal/popup will appear

### 5.4 Find and Add Card Action Event

In the event selection modal:

```
┌─────────────────────────────────────────────────┐
│  Add Events                              [X]    │
├─────────────────────────────────────────────────┤
│  Search: [card                           ] 🔍  │
├─────────────────────────────────────────────────┤
│  Tenant Token-Based (1)   User Token (0)       │
├─────────────────────────────────────────────────┤
│                                                 │
│  □ Replacement card approval                    │
│    remedy_approval                              │
│    Version: v1.0                                │
│    Push message after card approval             │
│                                                 │
│  OR look for one of these:                      │
│                                                 │
│  □ Card action triggered                        │
│    im.message.message_card_action_trigger_v1    │
│    Triggered when user interacts with card      │
│                                                 │
│  □ Interactive card clicked                     │
│    card.action.trigger                          │
│    Button click on message card                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**What to do:**

1. Type **"card"** in the search box
2. Look for events with descriptions like:
   - "Card action triggered"
   - "Interactive card action"
   - "Message card button clicked"
3. **Common event names:**
   - `card.action.trigger`
   - `im.message.message_card_action_trigger_v1`
   - `message.card.action`
4. **Check the box** next to the event
5. Click **"Confirm"** or **"Add"**

### 5.5 Verify Event is Subscribed

Back on the Event Subscriptions page:

```
┌─────────────────────────────────────────────┐
│  Subscribed Events                          │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ card.action.trigger                     │
│     Triggered when user clicks button       │
│     Status: Active                          │
│     [Remove]                                │
│                                             │
└─────────────────────────────────────────────┘
```

You should see:

- ✅ Event listed
- Status: **Active** or **Enabled**

---

## Step 6: Publish/Release Your App (1 minute)

### 6.1 Check App Status

Some Lark setups require you to "publish" changes:

1. Look at the **top of the page** for buttons like:

   - **"Publish"**
   - **"Release Version"**
   - **"Apply Changes"**
   - **"Version Unavailable"** (yellow warning)

2. If you see any of these, **click the button**

3. Follow prompts:
   - Select **"Current organization"** or **"Internal users"**
   - Add version notes: "Enabled bot for approval system"
   - Click **"Publish"** or **"Release"**

### 6.2 Verify Publication

Wait 10-30 seconds for changes to take effect.

---

## Step 7: Test Bot Connection (2 minutes)

### 7.1 Test from DL Generator

1. Open: http://localhost:3001
2. Go to **Signature Config** page
3. Scroll to **"Auto-Approval Scheduler"** section
4. Click **"Lark Setup"** button
5. Click **"Test Connection"** button

### 7.2 Expected Results

**✅ SUCCESS - You should see:**

1. Alert: "✅ Connection successful! Check your Lark app for the test message."
2. **Open your Lark app** (desktop or mobile)
3. You should have a message from **"DL Generator"** bot
4. Message text: "🧪 Test message from DL Generator. Connection successful!"

**❌ IF IT FAILS:**

- Check error message in alert
- Common errors and fixes below

---

## Step 8: Test Approval Card (2 minutes)

### 8.1 Send Test Approval Request

1. Still in DL Generator → Signature Config
2. Click **"Send Test Approval Request"** button
3. Wait a few seconds

### 8.2 Check Lark App

You should receive a **Message Card** with:

- 📋 Header: "Approval Request for Signature on DL Generator"
- Request Type, Date, Requested By, etc.
- **Signature image preview** (if signature exists in database)
- ✅ **Approve** button (green)
- ❌ **Reject** button (red)

### 8.3 Test Button Click

1. Click **✅ Approve** button
2. **Check DL Generator** - status should change to "Approved"
3. **Check backend logs** - should show:
   ```
   📥 Received Lark webhook: card.action.trigger
   🎯 Processing approve for signature_id=1
   ✅ Signature approved!
   ```

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] Bot is **Enabled** in Developer Console
- [ ] All required **Permissions/Scopes** are added
- [ ] **Message Card** feature is enabled
- [ ] **Webhook URL** is verified (green checkmark)
- [ ] **card.action.trigger** event is subscribed
- [ ] App is **Published** (if required)
- [ ] **Test Connection** works (receives message)
- [ ] **Test Approval Card** received in Lark
- [ ] **Buttons work** (Approve/Reject updates database)

---

## 🔧 Troubleshooting

### Error: "Bot ability is not activated"

**Cause:** Bot feature not enabled in Developer Console

**Fix:**

1. Go to Developer Console → DL Generator
2. Enable **Bot** in Features/Capabilities
3. Save and publish changes
4. Wait 30 seconds
5. Try "Test Connection" again

---

### Error: "Failed to get access token"

**Cause:** Wrong App ID or App Secret

**Fix:**

1. Go to Developer Console → DL Generator → **Credentials & Basic Info**
2. Copy **App ID**: `cli_xxxxx`
3. Click **Show** next to App Secret, copy the value
4. Paste both in DL Generator → Lark Setup
5. Click "Save Configuration"
6. Try again

---

### Error: "No recipient configured"

**Cause:** User ID (open_id) not set or wrong

**Fix:**

1. Get your open_id (see previous guide)
2. Make sure it starts with `ou_`
3. Paste in DL Generator → Lark Setup → **User ID** field
4. Save configuration
5. Try again

---

### Buttons Don't Work

**Cause 1:** Event not subscribed

**Fix:**

1. Developer Console → Event Subscriptions
2. Make sure `card.action.trigger` is listed and **Active**
3. If not, add it (see Step 5)

**Cause 2:** Webhook URL not verified

**Fix:**

1. Check backend is running: `http://localhost:8000`
2. Check ngrok is active
3. Re-verify webhook URL
4. Try clicking button again

**Cause 3:** ngrok URL changed

**Fix:**

1. Check current ngrok URL in terminal
2. Update webhook URL in Event Subscriptions
3. Re-verify
4. Try button again

---

### Image Not Showing in Card

**Cause:** Image key not generated or wrong variable name

**Fix:**

1. Make sure Message Card Builder has image with variable: `signature_image_key`
2. Not `signature_image_url` (old method)
3. Backend will automatically upload signature and get image_key
4. Check backend logs for: "✅ Signature image uploaded to Lark"

---

## 📞 Need More Help?

If you're still stuck:

1. **Check backend logs** - Look for error messages
2. **Check Lark Developer Console** - Look for red warnings/errors
3. **Take screenshots** of:
   - Bot configuration page
   - Event Subscriptions page
   - Error messages
4. Share screenshots and I'll help you fix it!

---

## 🎉 Success!

Once everything is working:

- ✅ Bot sends messages
- ✅ Approval cards display with signature preview
- ✅ Buttons update database when clicked
- ✅ Auto-scheduler will send requests every Sunday at 9 AM

**Your DL Generator Lark integration is now complete!** 🚀
