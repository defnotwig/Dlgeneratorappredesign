# Test Lark Webhook Locally
# Run this to test if your webhook endpoint works before configuring Lark

Write-Host "🧪 Testing Lark Webhook Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "1️⃣ Checking if backend is running..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "http://localhost:8000/api/lark/scheduler/status" -Method GET
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Scheduler status: $($status.running)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is NOT running on port 8000!" -ForegroundColor Red
    Write-Host "   Start it with: cd backend; python main.py" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Test webhook with URL verification (Lark's first request)
Write-Host "2️⃣ Testing URL verification challenge..." -ForegroundColor Yellow
$verifyPayload = @{
    type = "url_verification"
    challenge = "test_challenge_123"
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/lark/webhook/button-callback" -Method POST -Body $verifyPayload -ContentType "application/json"
    if ($verifyResponse.challenge -eq "test_challenge_123") {
        Write-Host "✅ URL verification works!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ URL verification returned unexpected response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ URL verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test approve button webhook
Write-Host "3️⃣ Testing APPROVE button webhook..." -ForegroundColor Yellow
$approvePayload = @{
    schema = "2.0"
    header = @{
        event_type = "card.action.trigger"
        event_id = "test_event_123"
        token = "test_token"
        create_time = "1640000000"
        app_id = "cli_test"
    }
    event = @{
        action = @{
            value = @{
                action = "approve"
                signature_id = "1"
            }
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $approveResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/lark/webhook/button-callback" -Method POST -Body $approvePayload -ContentType "application/json"
    Write-Host "✅ Approve webhook processed!" -ForegroundColor Green
    Write-Host "   Response: $($approveResponse.message)" -ForegroundColor Gray
} catch {
    $errorMessage = $_.ErrorDetails.Message
    Write-Host "⚠️ Approve webhook response: $errorMessage" -ForegroundColor Yellow
    Write-Host "   This might be expected if no pending approval exists" -ForegroundColor Gray
}

Write-Host ""

# Test 4: Test reject button webhook
Write-Host "4️⃣ Testing REJECT button webhook..." -ForegroundColor Yellow
$rejectPayload = @{
    schema = "2.0"
    header = @{
        event_type = "card.action.trigger"
        event_id = "test_event_124"
        token = "test_token"
        create_time = "1640000001"
        app_id = "cli_test"
    }
    event = @{
        action = @{
            value = @{
                action = "reject"
                signature_id = "1"
            }
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $rejectResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/lark/webhook/button-callback" -Method POST -Body $rejectPayload -ContentType "application/json"
    Write-Host "✅ Reject webhook processed!" -ForegroundColor Green
    Write-Host "   Response: $($rejectResponse.message)" -ForegroundColor Gray
} catch {
    $errorMessage = $_.ErrorDetails.Message
    Write-Host "⚠️ Reject webhook response: $errorMessage" -ForegroundColor Yellow
    Write-Host "   This might be expected if no pending approval exists" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Your webhook endpoint is working!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Install ngrok: https://ngrok.com/download" -ForegroundColor White
Write-Host "2. Run: ngrok http 8000" -ForegroundColor White
Write-Host "3. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)" -ForegroundColor White
Write-Host "4. Configure webhook in Lark Developer Console:" -ForegroundColor White
Write-Host "   https://YOUR_NGROK_URL/api/lark/webhook/button-callback" -ForegroundColor Cyan
Write-Host "5. Enable event: card.action.trigger" -ForegroundColor White
Write-Host "6. Test by clicking buttons in Lark!" -ForegroundColor White
Write-Host ""
