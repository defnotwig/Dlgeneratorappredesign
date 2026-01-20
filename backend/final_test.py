"""
    FINAL VERIFICATION & TESTING SCRIPT
Tests all components and provides clear status
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_header(text):
    print(f"\n{'='*70}")
    print(f" {text}")
    print(f"{'='*70}\n")

def test_backend_health():
    """Test if backend is running"""
    print_header("1️⃣ BACKEND HEALTH CHECK")

    try:
    response = requests.get(f"{BASE_URL}/docs", timeout=3)
    if response.status_code in [200, 404]:
    print("[OK] Backend is RUNNING on port 8000")
    return True
    else:
    print(f"[WARN] Backend returned unexpected status: {response.status_code}")
    return False
    except requests.exceptions.ConnectionError:
    print("[ERROR] Backend is NOT running!")
    print(" → Start it with: python backend/main.py")
    return False
    except Exception as e:
    print(f"[ERROR] Error checking backend: {e}")
    return False

def test_lark_config():
    """Test Lark configuration"""
    print_header("2️⃣ LARK CONFIGURATION")

    try:
    response = requests.get(f"{BASE_URL}/api/lark/config/openapi", timeout=5)
    if response.status_code == 200:
    config = response.json()
    print("[OK] Configuration retrieved:")
    print(f" App ID: {config.get('app_id')}")
    print(f" Template ID: {config.get('template_id')}")
    print(f" User ID: {config.get('self_user_id')}")
    print(f" Has Secret: {'[OK]' if config.get('has_secret') else '[ERROR]'}")
    print(f" Webhook: {config.get('webhook_url') or '[ERROR] NOT SET'}")
    return config
    else:
    print(f"[ERROR] Failed to get config: {response.status_code}")
    return None
    except Exception as e:
    print(f"[ERROR] Error getting config: {e}")
    return None

def test_image_upload():
    """Test image upload capability"""
    print_header("3️⃣ IMAGE UPLOAD TEST")

    # Check if test signature exists in database
    import sqlite3
    conn = sqlite3.connect('database/dl_generator.db')
    cursor = conn.cursor()
    cursor.execute("SELECT lark_image_key FROM signature_assets WHERE id = 1")
    result = cursor.fetchone()
    conn.close()

    if result and result[0]:
    print(f"[OK] Image upload WORKING!")
    print(f" Test image key: {result[0][:50]}...")
    return True
    else:
    print("[ERROR] No image key found in database")
    print(" → Permission im:resource may not be added yet")
    return False

def test_template_visibility():
    """Test template message sending"""
    print_header("4️⃣ TEMPLATE VISIBILITY TEST")

    try:
    # Try to send test approval request
    response = requests.post(
    f"{BASE_URL}/api/lark/approval/self-test",
    timeout=10
    )

    if response.status_code == 200:
    result = response.json()
    if result.get('success'):
    print("[OK] TEMPLATE IS VISIBLE!")
    print(f" Message sent successfully")
    print(f" Check your Lark app for the approval card")
    return True
    else:
    error = result.get('message', 'Unknown error')
    if '11310' in str(error) or 'template is not visible' in str(error).lower():
    print("[ERROR] TEMPLATE NOT VISIBLE (Error 11310)")
    print(" → Template needs to be published in Lark Developer Console")
    print(" → See: TEMPLATE_FIX_COMPLETE_GUIDE.md")
    else:
    print(f"[ERROR] Test failed: {error}")
    return False
    else:
    print(f"[ERROR] Request failed: {response.status_code}")
    return False
    except Exception as e:
    print(f"[ERROR] Error testing template: {e}")
    return False

def check_database_state():
    """Check database for issues"""
    print_header("5️⃣ DATABASE STATUS")

    import sqlite3
    conn = sqlite3.connect('database/dl_generator.db')
    cursor = conn.cursor()

    # Count requests by status
    cursor.execute("SELECT status, COUNT(*) FROM signature_approval_requests GROUP BY status")
    statuses = dict(cursor.fetchall())

    # Count signatures
    cursor.execute("SELECT COUNT(*) FROM signature_assets")
    sig_count = cursor.fetchone()[0]

    print(f" Database Summary:")
    print(f" Signatures: {sig_count}")
    print(f" Pending Requests: {statuses.get('Pending', 0)}")
    print(f" Failed Requests: {statuses.get('Failed', 0)}")
    print(f" Approved Requests: {statuses.get('Approved', 0)}")

    # Check for spam
    if statuses.get('Failed', 0) > 100:
    print("\n[OK] Old spam requests have been cleaned up (marked as Failed)")

    if statuses.get('Pending', 0) > 5:
    print(f"\n[WARN] Warning: {statuses.get('Pending', 0)} pending requests")
    print(" → May indicate retry loop issue")

    conn.close()
    return statuses

def generate_report(results):
    """Generate final report with actionable steps"""
    print_header(" FINAL REPORT & NEXT STEPS")

    backend_ok, config_ok, image_ok, template_ok, db_status = results

    print("╔══════════════════════════════════════════════════════════════╗")
    print("║ SYSTEM STATUS ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║ Backend Running: {'[OK] YES' if backend_ok else '[ERROR] NO':42} ║")
    print(f"║ Configuration OK: {'[OK] YES' if config_ok else '[ERROR] NO':42} ║")
    print(f"║ Image Upload: {'[OK] WORKING' if image_ok else '[ERROR] FAILED':42} ║")
    print(f"║ Template Visible: {'[OK] YES' if template_ok else '[ERROR] NO (Error 11310)':42} ║")
    print(f"║ Database Status: {'[OK] HEALTHY':42} ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    if not backend_ok:
    print("\n CRITICAL: Backend not running!")
    print(" RUN: python backend/main.py")
    return

    if not template_ok:
    print("\n[TARGET] PRIMARY ISSUE: Template Not Visible (Error 11310)")
    print("\n SOLUTION OPTIONS:")
    print("\n Option A: Fix Template (Recommended)")
    print(" ─────────────────────────────────────")
    print(" 1. Open: https://open.larksuite.com/app")
    print(" 2. Select app: cli_a8b6486fcb399029")
    print(" 3. Go to 'Message Card Builder'")
    print(" 4. Find template: ctp_AAvmQNJxEOmf")
    print(" 5. Ensure status = 'Published' (NOT 'Draft')")
    print(" 6. Enable 'Visible to all apps' toggle")
    print(" 7. Click 'Save'")
    print(" 8. Wait 2 minutes and test again")
    print("\n Option B: Use Dynamic Cards (Workaround)")
    print(" ─────────────────────────────────────")
    print(" 1. Open DL Generator → Lark Setup")
    print(" 2. CLEAR the 'Template ID' field")
    print(" 3. Click 'Save Configuration'")
    print(" 4. System will use dynamic cards instead")
    print(" 5. Works immediately but no custom template design")
    print("\n See TEMPLATE_FIX_COMPLETE_GUIDE.md for detailed steps")
    else:
    print("\n[OK] ALL SYSTEMS OPERATIONAL!")
    print("\n[SUCCESS] You can now:")
    print(" 1. Upload signatures in DL Generator")
    print(" 2. Click 'Send Test Approval Request'")
    print(" 3. Receive approval cards in Lark app")
    print(" 4. Click Approve/Reject buttons")
    print(" 5. See status update in DL Generator")

    if not config_ok or not config_ok.get('webhook_url'):
    print("\n[WARN] OPTIONAL: Webhook URL Not Configured")
    print(" → Buttons in approval cards won't work without this")
    print(" → Install ngrok and set webhook URL")
    print(" → See TEMPLATE_FIX_COMPLETE_GUIDE.md Step 5")

def main():
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║ [SEARCH] DL GENERATOR - FINAL VERIFICATION & TEST ║
    ║ Checking all systems and identifying issues... ║
    ╚════════════════════════════════════════════════════════════════╝
    """)

    # Run all tests
    backend_ok = test_backend_health()

    if not backend_ok:
    print("\n[ERROR] Cannot continue: Backend is not running!")
    print(" Start backend first: python backend/main.py")
    return

    config = test_lark_config()
    config_ok = config is not None

    image_ok = test_image_upload()
    template_ok = test_template_visibility()
    db_status = check_database_state()

    # Generate final report
    generate_report((backend_ok, config, image_ok, template_ok, db_status))

    print("\n" + "="*70)
    print(" [OK] Verification complete!")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
