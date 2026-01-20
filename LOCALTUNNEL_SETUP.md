# Alternative: Use localtunnel (No signup required!)

## Step 1: Install localtunnel

```powershell
npm install -g localtunnel
```

## Step 2: Start Tunnel

```powershell
lt --port 8000
```

You'll see:

```
your url is: https://funny-name-123.loca.lt
```

## Step 3: Copy the URL

Copy that URL and use it in Lark webhook configuration:

```
https://funny-name-123.loca.lt/api/lark/webhook/button-callback
```

## ⚠️ Important Notes:

- First visit to the URL will show a warning page - click "Continue"
- URL changes each time you restart localtunnel
- Less stable than ngrok but works without signup

## If localtunnel has issues:

Sometimes it requires clicking "Continue" when Lark first accesses it. If webhook verification fails, try visiting the URL in your browser first and clicking the continue button.
