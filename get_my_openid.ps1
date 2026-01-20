# Quick script to get your Lark open_id
# Replace with your actual values below

$APP_ID = "cli_a1234567890abcd"  # Your App ID from Lark Console
$APP_SECRET = "your_app_secret_here"  # Your App Secret
$YOUR_EMAIL = "gabriel.rivera@company.com"  # Your Lark email

Write-Host "Getting your Lark open_id..." -ForegroundColor Cyan

# Step 1: Get tenant access token
$tokenResponse = Invoke-RestMethod -Uri "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{
        app_id = $APP_ID
        app_secret = $APP_SECRET
    } | ConvertTo-Json)

if ($tokenResponse.code -eq 0) {
    $token = $tokenResponse.tenant_access_token
    Write-Host "✅ Token received" -ForegroundColor Green
    
    # Step 2: Get user info
    $userResponse = Invoke-RestMethod -Uri "https://open.larksuite.com/open-apis/contact/v3/users/$YOUR_EMAIL?user_id_type=open_id" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    if ($userResponse.code -eq 0) {
        $openId = $userResponse.data.user.open_id
        Write-Host "`n✨ YOUR OPEN_ID: $openId" -ForegroundColor Yellow
        Write-Host "`nCopy this and paste it into DL Generator Lark Setup!" -ForegroundColor Green
        
        # Copy to clipboard
        $openId | Set-Clipboard
        Write-Host "📋 Copied to clipboard!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error getting user info: $($userResponse.msg)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Error getting token: $($tokenResponse.msg)" -ForegroundColor Red
}
