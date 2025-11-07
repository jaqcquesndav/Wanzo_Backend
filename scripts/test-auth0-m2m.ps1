param(
  [string]$Domain = $env:AUTH0_DOMAIN,
  [string]$Audience = $env:AUTH0_AUDIENCE,
  [string]$ClientId = $env:AUTH0_CLIENT_ID,
  [string]$ClientSecret = $env:AUTH0_CLIENT_SECRET,
  [string]$ServiceBaseUrl = "http://localhost:3015"
)

if (-not $Domain -or -not $Audience -or -not $ClientId -or -not $ClientSecret) {
  Write-Error "Missing one or more required values: Domain, Audience, ClientId, ClientSecret. Set env vars or pass as parameters."
  exit 1
}

Write-Host "Fetching M2M token from https://$Domain for audience $Audience ..."
$tokenRes = Invoke-RestMethod -Method POST -Uri "https://$Domain/oauth/token" -ContentType 'application/json' -Body (@{
  grant_type = 'client_credentials'
  audience   = $Audience
  client_id  = $ClientId
  client_secret = $ClientSecret
} | ConvertTo-Json)
$accessToken = $tokenRes.access_token
if (-not $accessToken) { Write-Error "Failed to obtain access token"; exit 1 }
Write-Host "Token acquired. Testing protected endpoints..."

# Health (public)
Invoke-RestMethod -Method GET -Uri "$ServiceBaseUrl/health" | ConvertTo-Json -Depth 5

# Verify without token (should be 401)
try {
  Invoke-RestMethod -Method GET -Uri "$ServiceBaseUrl/blockchain/verify?refId=ps1-test" -ErrorAction Stop | Out-Null
  Write-Warning "Expected 401 without token, but request succeeded"
} catch {
  Write-Host "As expected, GET /blockchain/verify without token rejected: $($_.Exception.Response.StatusCode.value__)"
}

$headers = @{ Authorization = "Bearer $accessToken" }

# Verify with token (scope blockchain:read required)
try {
  $verify = Invoke-RestMethod -Method GET -Uri "$ServiceBaseUrl/blockchain/verify?refId=ps1-test" -Headers $headers -ErrorAction Stop
  $verify | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Verify with token failed. Ensure the client has blockchain:read scope. Error: $($_.Exception.Message)"; exit 2
}

# Anchor with token (scope blockchain:write required)
$body = @{ type = 'doc'; refId = 'ps1-test'; dataBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('ps1 data')) } | ConvertTo-Json
try {
  $anchor = Invoke-RestMethod -Method POST -Uri "$ServiceBaseUrl/blockchain/anchor" -Headers ($headers + @{ 'Content-Type' = 'application/json' }) -Body $body -ErrorAction Stop
  $anchor | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Anchor with token failed. Ensure the client has blockchain:write scope. Error: $($_.Exception.Message)"; exit 3
}

Write-Host "M2M checks completed."
