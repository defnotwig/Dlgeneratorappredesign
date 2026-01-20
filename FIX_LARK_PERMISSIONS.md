# 🔧 Fix Lark Permissions & Template Issues

## Current Errors

Based on the backend logs, there are **TWO** issues to fix:

### Error 1: Image Upload Permission Missing

```
⚠️ Failed to upload signature image: Access denied.
One of the following scopes is required: [im:resource:upload, im:resource]
```

### Error 2: Template Not Visible (if still occurring)

```
"template is not visible to app" (Error Code: 11310)
```

---

## 🛠️ Fix 1: Add Image Upload Permission (im:resource)

### Step 1: Open Lark Developer Console

1. Go to https://open.larksuite.com/app
2. Login and select your app: **cli_a8b6486fcb399029**

### Step 2: Add Permission Scope

1. Click **"Permissions & Scopes"** in the left sidebar
2. Search for: **im:resource**
3. Enable these permissions:
   - ✅ `im:resource` - Read images in messages
   - ✅ `im:resource:upload` - Upload images (REQUIRED)
4. Click **"Apply"** or **"Save"**

### Step 3: Publish Changes

1. Click **"Version Management"** or **"Release"**
2. Create a new version or update existing
3. Wait for approval (usually instant for custom apps)

### Step 4: Re-generate Access Token

After adding permissions, you may need to:

1. Go to DL Generator → Signature Config
2. Click **"Lark Setup"**
3. Re-enter your App ID and App Secret
4. Click **"Save Configuration"**

This forces a new access token with the updated permissions.

---

## 🛠️ Fix 2: Publish Message Card Template

### Step 1: Open Message Card Builder

1. In Lark Developer Console, click **"Message Card Builder"**
2. Find your template: **ctp_AAvmQNJxEOmf**

### Step 2: Configure Template (if needed)

Your template should have:

- **Image Component** (optional, for signature preview)
  - Source: Variable → `signature_image_key`
- **Text Fields** for:
  - `request_type` (e.g., "🤖 AUTO" or "📝 MANUAL")
  - `request_date`
  - `requested_by`
  - `validity_period`
  - `purpose`
- **Buttons** for approve/reject (optional)

### Step 3: Publish Template

1. Click **"Publish"** button (top right)
2. Select **"Publish Current Version"**
3. In Visibility settings:
   - ✅ Enable **"Visible to all apps"**
   - OR add App ID: `cli_a8b6486fcb399029`
4. Click **"Confirm"**

### Step 4: Wait & Test

- Wait 1-2 minutes for changes to propagate
- Test in DL Generator

---

## 🧪 Quick Test Without Image

If you want to test immediately without fixing image upload:

The system will still work! The message card will be sent without the signature image preview. You'll see:

```
⚠️ Failed to upload signature image: Access denied...
📨 Approval request result: {...}
```

The card is sent even if the image upload fails.

---

## 📋 Complete Permission List

For full functionality, your Lark app needs:

| Permission                   | Scope    | Purpose                |
| ---------------------------- | -------- | ---------------------- |
| **im:message:send**          | Required | Send messages to users |
| **im:resource**              | Required | Access image resources |
| **im:resource:upload**       | Required | Upload images          |
| **contact:user.id:readonly** | Optional | Get user info          |

---

## 🔄 After Fixing Permissions

1. **Restart Backend** (if using hot-reload, it auto-restarts)
2. **Re-save Lark Config** in DL Generator to refresh token
3. **Click "Send Test Approval Request"**
4. **Check Backend Logs** for:
   ```
   ✅ Signature image uploaded to Lark: img_v3_xxxxx
   📨 Approval request result: {"success": true, ...}
   ```

---

## 🎯 Expected Success Flow

After fixing both issues:

1. **User clicks "Send Test Approval Request"**
2. **Backend logs show:**
   ```
   📤 Triggering manual approval for signature ID: 1
   ✅ Signature image uploaded to Lark: img_v3_027t_xxxxx
   📨 Approval request result: {"success": true, "message_id": "om_xxxxx"}
   ```
3. **User receives message card in Lark app**
4. **Card shows signature preview and approve/reject buttons**

---

## 🆘 Troubleshooting

### "Unknown error" in frontend

- Check browser console (F12 → Console) for actual error
- Check backend terminal for detailed error message

### "Access denied" persists after adding permission

- Clear access token by re-saving Lark config
- Wait 5 minutes and try again
- Check if permissions are actually enabled in Developer Console

### "Template not visible" after publishing

- Verify template ID is correct: `ctp_AAvmQNJxEOmf`
- Ensure "Visible to all apps" is enabled
- Wait 2-3 minutes after publishing

### Message sent but no card appears in Lark

- Verify User ID is correct: `ou_945fd8b7130f2db31077c6e079b9986d`
- Check if you're logged into the correct Lark account
- Check Lark app notifications

---

## 📞 Current Configuration

```
App ID: cli_a8b6486fcb399029
Template ID: ctp_AAvmQNJxEOmf
User ID: ou_945fd8b7130f2db31077c6e079b9986d
```

All credentials are saved. Just need to fix permissions! 🚀
