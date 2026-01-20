# 🚨 CRITICAL: Template Visibility Issue - Complete Fix Guide

## Current Status

✅ **Image Upload Permission**: WORKING

- Image successfully uploaded: `img_v3_02u0_9562c165-e52d-48b4-9798-db1f4ac353hu`
- Permission `im:resource` is correctly configured

❌ **Template Visibility**: NOT WORKING

- Error Code: **11310 / 230099**
- Message: "template is not visible to app"
- Template ID: `ctp_AAvmQNJxEOmf`
- App ID: `cli_a8b6486fcb399029`

---

## Root Cause Analysis

The template `ctp_AAvmQNJxEOmf` is **NOT actually published or visible** to your app, despite following the steps. This is confirmed by:

1. Backend continues to receive error 11310
2. Lark API explicitly states "template is not visible to app"
3. 144 failed approval requests accumulated due to this error

---

## Why This Happens

Common causes of template visibility issues:

1. **Template not fully published**

   - Draft saved but not actually published
   - Need to click "Publish" button AND confirm

2. **Visibility settings not applied**

   - "Visible to all apps" checkbox not saved
   - Or app ID not in allowed list

3. **Wrong template ID**

   - Copy-paste error
   - Template ID changed after editing

4. **Propagation delay**

   - Changes take 2-5 minutes to propagate
   - Need to wait after publishing

5. **Version mismatch**
   - Old version still active
   - Need to publish LATEST version

---

## ✅ EXACT Steps to Fix (Do These NOW)

### Step 1: Verify Template ID is Correct

1. Go to: https://open.larksuite.com/app
2. Select your app: **cli_a8b6486fcb399029**
3. Click **"Message Card Builder"** in left sidebar
4. Find your template - it should show:
   - Template ID: **ctp_AAvmQNJxEOmf**
   - Name: "DL Generator" or "Approval Request"

**⚠️ IMPORTANT**: If the template ID is DIFFERENT, you need to update it in DL Generator → Lark Setup!

---

### Step 2: Verify Template is Published (NOT Draft)

1. Click on the template to open it
2. Look at the status badge - it should say:

   - ✅ **"Published"** (green badge)
   - ❌ **"Draft"** (gray badge) = NOT published!

3. If it says "Draft":
   - Click **"Publish"** button (top right)
   - Select **"Publish Current Version"**
   - Confirm the dialog

---

### Step 3: Check Visibility Settings

**CRITICAL**: After publishing, verify visibility:

1. In the template details page, look for **"Visibility"** section
2. Check ONE of these options:

   **Option A: Visible to All Apps (RECOMMENDED)**

   - ✅ Toggle: **"Visible to all apps"** = ON
   - This allows ANY app to use this template

   **Option B: Specific Apps**

   - If "Visible to all apps" is OFF
   - Check the **"Allowed Apps"** list
   - Your app ID **cli_a8b6486fcb399029** MUST be in the list

3. **SAVE the visibility settings** - there should be a "Save" or "Apply" button

---

### Step 4: Verify in API Testing (Lark Console)

1. In Lark Developer Console → **"API Testing"**
2. Test the Send Message API:
   - Endpoint: `POST /im/v1/messages`
   - Body:
     ```json
     {
       "receive_id": "ou_945fd8b7130f2db31077c6e079b9986d",
       "receive_id_type": "open_id",
       "msg_type": "interactive",
       "content": "{\"type\":\"template\",\"data\":{\"template_id\":\"ctp_AAvmQNJxEOmf\",\"template_variable\":{}}}"
     }
     ```
3. Click **"Send Request"**
4. Expected result:
   - ✅ **Success**: `{"code": 0, "msg": "success", ...}`
   - ❌ **Error 11310**: Template still not visible - repeat steps 1-3

---

### Step 5: Alternative - Use Dynamic Card (Workaround)

If template continues to fail, you can bypass it:

1. In DL Generator → Lark Setup
2. **CLEAR the Template ID field** (leave it empty)
3. Click **"Save Configuration"**
4. System will automatically use dynamic cards instead of template messages

This works immediately but:

- ❌ No custom template design
- ✅ Still sends approval cards with buttons
- ✅ Image preview still works

---

### Step 6: Test Again

After fixing visibility:

1. **Wait 2 minutes** for changes to propagate
2. In DL Generator, click **"Send Test Approval Request"**
3. Expected results:
   - ✅ Backend logs: `📨 Approval request result: {'success': True, 'message_id': 'om_xxxxx'}`
   - ✅ Frontend alert: "✅ Approval request sent to Lark!"
   - ✅ Receive message card in Lark app

---

## 🔍 Debugging Checklist

If it still doesn't work after following all steps:

- [ ] Template ID matches exactly: `ctp_AAvmQNJxEOmf`
- [ ] Template status shows "Published" (not "Draft")
- [ ] Visibility is "Visible to all apps" OR app ID is in allowed list
- [ ] Waited at least 2 minutes after publishing
- [ ] Tested in Lark API Testing console (returns code 0)
- [ ] Access token is fresh (re-save Lark config in DL Generator)
- [ ] App ID matches: `cli_a8b6486fcb399029`
- [ ] User ID matches: `ou_945fd8b7130f2db31077c6e079b9986d`

---

## 📸 What to Check in Screenshots

From your Lark Developer Console, verify:

1. **Message Card Builder page**:

   - Template shows "Published" badge (green)
   - Visibility settings section exists
   - "Visible to all apps" toggle is ON

2. **Template details**:

   - Template ID: `ctp_AAvmQNJxEOmf`
   - Version: Should show "v1.0" or latest
   - Status: "Published"

3. **Permissions & Scopes**:
   - ✅ `im:resource` - Added (already done)
   - ✅ `im:message:send` - Should be enabled

---

## 🚀 After Fixing

Once template is visible:

1. Backend will automatically retry the pending request
2. You'll receive approval card in Lark app
3. Card will show:

   - Signature preview image
   - Request details
   - ✅ Approve button
   - ❌ Reject button

4. Clicking buttons will:
   - Update database
   - Show in DL Generator UI
   - Enable signature for use

---

## 💡 Quick Test Without Template

If you want to test immediately while fixing template:

1. Clear Template ID in Lark Setup
2. Save configuration
3. Click "Send Test Approval Request"
4. Should work with dynamic card (no custom template)

Once template is fixed, add Template ID back for custom design.

---

## 📞 Current Configuration

```
App ID: cli_a8b6486fcb399029
Template ID: ctp_AAvmQNJxEOmf
User ID: ou_945fd8b7130f2db31077c6e079b9986d
Image Upload: ✅ WORKING
Template: ❌ NOT VISIBLE (Fix needed)
```

---

## ⚠️ Important Notes

1. **Database Cleaned**: Removed 143 spam approval requests
2. **Retry Fixed**: Only retries 1 request at a time now
3. **Image Works**: Permission issue resolved
4. **Template Only Issue**: Focus ONLY on template visibility now

---

Follow these steps EXACTLY and verify each one. The template visibility issue is the ONLY remaining problem! 🎯
