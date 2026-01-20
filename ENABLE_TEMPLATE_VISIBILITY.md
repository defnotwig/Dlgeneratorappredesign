# 🚨 CRITICAL FIX: Enable Template Visibility

## ❌ Current Error

```
ErrCode: 11310
ErrMsg: template is not visible to app, please confirm whether the app is allowed to use this template
```

**Template IS published, but visibility NOT configured!**

---

## ✅ EXACT FIX: Enable Visibility

### Step 1: Go to Template Settings

1. **In Message Card Builder**, click on your template "DL Generator"
2. Look for **"Settings"** or **"More Options"** (⋮ icon) at the top right
3. Click to open template settings

### Step 2: Find Visibility Section

Look for one of these sections:

- **"Visibility"**
- **"App Permissions"**
- **"Availability"**
- **"App Access"**

It's usually in:

- Template settings panel (right side)
- OR Template details page
- OR "More" → "Visibility Settings"

### Step 3: Enable Visibility

**Option A: Visible to All Apps (RECOMMENDED)**

Toggle ON: **"Visible to all apps"** or **"All apps can use this template"**

**Option B: Specific Apps**

If you don't see "Visible to all apps":

1. Find **"Allowed Apps"** or **"App List"**
2. Click **"+ Add App"**
3. Add your app ID: `cli_a8b6486fcb399029`
4. Click **"Save"**

### Step 4: Save Changes

1. Click **"Save"** or **"Apply"** button
2. **IMPORTANT:** May need to click "Publish" again after changing visibility
3. Wait **2 minutes** for changes to propagate

---

## 🔍 Where to Find Visibility Settings

### Location 1: Template Editor (Most Common)

1. Open template in Message Card Builder
2. Look at **right sidebar** under template settings
3. Scroll down to find **"Visibility"** section
4. Enable "Visible to all apps"

### Location 2: Template List View

1. In Message Card Builder, hover over template name
2. Click **⋮ (three dots)** icon
3. Select **"Settings"** or **"Permissions"**
4. Enable "Visible to all apps"

### Location 3: Template Details Page

1. Click on template to open details
2. Look for **"Visibility"** tab at the top
3. Click the tab
4. Enable "Visible to all apps"

---

## 📸 What You Should See

After enabling visibility, you should see:

- ✅ **"Visible to all apps: ON"** (green toggle)
- OR ✅ **"Allowed apps: 1"** (your app listed)
- ✅ Status badge still shows "Published"

---

## 🎯 After Enabling Visibility

1. **Wait 2 minutes** (Lark needs time to propagate changes)

2. **Restart backend** (to clear cache):

   - Stop the minimized PowerShell window
   - Or run: `Ctrl+C` in backend terminal
   - Restart: `python main.py`

3. **In DL Generator**, click **"Send Test Approval Request"**

4. **Expected result:**
   - ✅ Success message appears
   - ✅ No error 11310
   - ✅ Approval card appears in Lark app

---

## 🚨 If You Can't Find Visibility Settings

**Alternative 1: Check Lark Documentation**

The visibility setting location varies by Lark version. Check:

- Lark Developer Console help docs
- Or search for "template visibility" in Lark docs

**Alternative 2: Use Dynamic Cards (Workaround)**

If you absolutely cannot find the visibility setting:

1. In **DL Generator → Lark Setup**
2. **DELETE** the Template ID field (remove `ctp_AAvmQNJxEOmf`)
3. Click **"Save Configuration"**
4. System will use **dynamic interactive cards** instead
5. Works immediately, no template visibility issues!

---

## ✅ Quick Checklist

Before testing again:

- [ ] Template shows "Published" badge
- [ ] **"Visible to all apps" is ON** ← CRITICAL!
- [ ] Waited 2 minutes after enabling visibility
- [ ] Backend restarted (optional but recommended)
- [ ] Clicked "Send Test Approval Request" in DL Generator

---

## 🎯 Summary

The issue is NOT the template content or variables anymore. It's **ONLY** the visibility permission.

**The template is published but not visible to your app.**

Find the "Visible to all apps" toggle and turn it ON!

---

**Next Step: Look for "Visibility", "App Access", or "Permissions" section in the template settings!**
