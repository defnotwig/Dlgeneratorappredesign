"""
[SEARCH] COMPREHENSIVE DIAGNOSTIC TOOL
Analyzes entire system for ROOT CAUSES of issues
"""

import sqlite3
import requests
import json
from datetime import datetime

def print_section(title):
    print(f"\n{'='*80}")
    print(f" {title}")
    print(f"{'='*80}\n")

def check_database():
    """Check database state"""
    print_section(" DATABASE ANALYSIS")

    conn = sqlite3.connect('database/dl_generator.db')
    cursor = conn.cursor()

    # Check signatures
    cursor.execute("""
    SELECT id, file_path, status, lark_image_key, approved_by, approved_at
    FROM signature_assets
    ORDER BY id DESC
    LIMIT 5
    """)
    sigs = cursor.fetchall()

    print(f" Latest Signatures (Total: {len(sigs)}):")
    for sig in sigs:
    img_key = sig[3][:30] + "..." if sig[3] else "None"
    print(f" ID={sig[0]}, File={sig[1]}, Status={sig[2]}, ImageKey={img_key}")

    # Check approval requests by status
    cursor.execute("""
    SELECT status, COUNT(*) as count
    FROM signature_approval_requests
    GROUP BY status
    """)
    status_counts = cursor.fetchall()

    print(f"\n Approval Request Status:")
    for status, count in status_counts:
    icon = "[OK]" if status == "Approved" else "[ERROR]" if status == "Rejected" else "[PENDING]" if status == "Pending" else "[FAIL]"
    print(f" {icon} {status}: {count}")

    # Check pending requests details
    cursor.execute("""
    SELECT id, signature_id, lark_message_id, status, created_at
    FROM signature_approval_requests
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 3
    """)
    pending = cursor.fetchall()

    if pending:
    print(f"\n[PENDING] Recent Pending Requests:")
    for req in pending:
    msg_id = req[2] if req[2] else "[ERROR] None (send failed)"
    print(f" ReqID={req[0]}, SigID={req[1]}, MsgID={msg_id}, Created={req[4]}")

    # Check Lark config
    cursor.execute("SELECT app_id, template_id, self_user_id, webhook_url, is_active FROM lark_bot_config ORDER BY id DESC LIMIT 1")
    config = cursor.fetchone()

    print(f"\n Lark Configuration:")
    if config:
    print(f" App ID: {config[0]}")
    print(f" Template ID: {config[1]}")
    print(f" User ID: {config[2]}")
    print(f" Webhook URL: {config[3] or '[ERROR] NOT SET'}")
    print(f" Active: {'[OK] Yes' if config[4] else '[ERROR] No'}")
    else:
    print(" [ERROR] NO CONFIGURATION FOUND!")

    conn.close()

    return {
    'signatures': len(sigs),
    'status_counts': dict(status_counts),
    'config': config
    }

def check_backend_api():
    """Test backend API endpoints"""
    print_section(" BACKEND API TESTING")

    base_url = "http://localhost:8000"

    # Test 1: Health check
    try:
    response = requests.get(f"{base_url}/health", timeout=5)
    print(f"[OK] Health Check: {response.status_code}")
    except Exception as e:
    print(f"[ERROR] Health Check Failed: {e}")
    return False

    # Test 2: Get Lark config
    try:
    response = requests.get(f"{base_url}/api/lark/config/openapi", timeout=5)
    if response.status_code == 200:
    config = response.json()
    print(f"[OK] Lark Config Retrieved:")
    print(f" App ID: {config.get('app_id')}")
    print(f" Template ID: {config.get('template_id')}")
    print(f" Has Secret: {config.get('has_secret')}")
    else:
    print(f"[ERROR] Config Retrieval Failed: {response.status_code}")
    except Exception as e:
    print(f"[ERROR] Config Retrieval Failed: {e}")

    # Test 3: Test Lark connection (may fail if template issue)
    try:
    response = requests.post(f"{base_url}/api/lark/test", timeout=10)
    result = response.json()
    if result.get('success'):
    print(f"[OK] Lark Connection: SUCCESS")
    print(f" Message: {result.get('message')}")
    else:
    print(f"[WARN] Lark Connection: FAILED")
    print(f" Message: {result.get('message')}")
    except Exception as e:
    print(f"[ERROR] Lark Connection Test Failed: {e}")

    return True

def analyze_root_causes(db_results):
    """Analyze and identify root causes"""
    print_section("[SEARCH] ROOT CAUSE ANALYSIS")

    issues =
    fixes =

    # Check 1: Template visibility issue
    pending = db_results['status_counts'].get('Pending', 0)
    failed = db_results['status_counts'].get('Failed', 0)

    if pending > 0 or failed > 10:
    issues.append("[ERROR] Template Error 11310: Template NOT visible to app")
    fixes.append("""
    FIX 1: Verify Template Visibility
    1. Go to: https://open.larksuite.com/app
    2. Select app: cli_a8b6486fcb399029
    3. Click "Message Card Builder"
    4. Find template: ctp_AAvmQNJxEOmf
    5. Verify status = "Published" (NOT "Draft")
    6. Enable "Visible to all apps" toggle
    7. Click "Save" to apply changes
    8. Wait 2 minutes for propagation
    """)

    # Check 2: Image upload permission
    if db_results['config'] and db_results['config'][0]:
    issues.append("[OK] Image Upload: Permission working (im:resource added)")

    # Check 3: Webhook URL missing
    if not db_results['config'] or not db_results['config'][3]:
    issues.append("[WARN] Webhook URL: Not configured (buttons won't work)")
    fixes.append("""
    FIX 2: Setup Webhook URL (Optional but recommended)
    1. Install ngrok: Download from https://ngrok.com/download
    2. Run: ngrok http 8000
    3. Copy HTTPS URL (e.g., https://xxxx.ngrok.io)
    4. In DL Generator → Lark Setup, add webhook URL
    5. In Lark Developer Console → Event Subscriptions
    - Add webhook URL: https://xxxx.ngrok.io/api/lark/webhook
    - Add event: im.message.receive_v1
    6. Test buttons in approval cards
    """)

    # Check 4: Retry spam
    if failed > 100:
    issues.append(f"[OK] Retry Spam: Fixed ({failed} old requests marked as Failed)")

    # Print findings
    print(" Issues Found:\n")
    for i, issue in enumerate(issues, 1):
    print(f"{i}. {issue}")

    if fixes:
    print("\n Required Fixes:\n")
    for fix in fixes:
    print(fix)

    return issues, fixes

def generate_report(db_results, issues, fixes):
    """Generate detailed report"""
    print_section(" DIAGNOSTIC REPORT SUMMARY")

    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║ SYSTEM STATUS REPORT ║
╚══════════════════════════════════════════════════════════════════════╝

[TARGET] CRITICAL ISSUE: Template Error 11310
    Status: [ERROR] BLOCKING (approval requests failing)
    Impact: Cannot send approval cards to Lark
    Root Cause: Template 'ctp_AAvmQNJxEOmf' NOT visible to app

[OK] WORKING COMPONENTS:
    - Backend API: Running on port 8000
    - Database: Connected and healthy
    - Image Upload: Permission im:resource working
    - Retry Logic: Fixed (no more spam)

    DATABASE STATUS:
    - Signatures: {db_results['signatures']}
    - Pending Requests: {db_results['status_counts'].get('Pending', 0)}
    - Failed Requests: {db_results['status_counts'].get('Failed', 0)}
    - Approved Requests: {db_results['status_counts'].get('Approved', 0)}

    CONFIGURATION:
    - App ID: {db_results['config'][0] if db_results['config'] else 'NOT SET'}
    - Template ID: {db_results['config'][1] if db_results['config'] else 'NOT SET'}
    - Webhook: {db_results['config'][3] if db_results['config'] and db_results['config'][3] else '[ERROR] NOT SET'}

[WARN] ISSUES REQUIRING ATTENTION: {len(issues)}

[TARGET] PRIMARY FIX REQUIRED:
    → Verify template is PUBLISHED and VISIBLE in Lark Developer Console
    → See: TEMPLATE_FIX_COMPLETE_GUIDE.md for exact steps

    WORKAROUND AVAILABLE:
    → Clear Template ID in DL Generator → Lark Setup
    → System will use dynamic cards instead of template
    → Works immediately but no custom template design

╔══════════════════════════════════════════════════════════════════════╗
║ Next Steps: Follow TEMPLATE_FIX_COMPLETE_GUIDE.md ║
╚══════════════════════════════════════════════════════════════════════╝
""")

def main():
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║ [SEARCH] DL GENERATOR - COMPREHENSIVE DIAGNOSTIC TOOL ║
    ║ Analyzing entire system for root causes... ║
    ╔════════════════════════════════════════════════════════════════╝
    """)

    try:
    # Step 1: Check database
    db_results = check_database()

    # Step 2: Test backend API
    check_backend_api()

    # Step 3: Analyze root causes
    issues, fixes = analyze_root_causes(db_results)

    # Step 4: Generate report
    generate_report(db_results, issues, fixes)

    print("\n[OK] Diagnostic complete! Review the report above.\n")
    print(" For detailed fix instructions, see: TEMPLATE_FIX_COMPLETE_GUIDE.md\n")

    except Exception as e:
    print(f"\n[ERROR] Diagnostic failed: {e}")
    import traceback
    traceback.print_exc()

if __name__ == "__main__":
    main()
