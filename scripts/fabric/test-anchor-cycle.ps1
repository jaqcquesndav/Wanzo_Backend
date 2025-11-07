param(
  [int]$Count = 1
)
$ErrorActionPreference = 'Stop'
function New-HashHex($text){
  $sha = [System.Security.Cryptography.SHA256]::Create()
  ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($text)) | ForEach-Object { $_.ToString('x2') }) -join ''
}

for($i=1; $i -le $Count; $i++){
  $ref = "test-" + [guid]::NewGuid().ToString()
  $payload = "payload-" + (Get-Date -Format o) + "-#" + $i
  $hash = New-HashHex $payload
  Write-Host "[ANCHOR $i] refId=$ref hash=$hash"
  $body = @{ refId = $ref; type = 'doc'; sha256 = $hash } | ConvertTo-Json -Compress
  $anchor = curl -s -X POST http://localhost:4010/anchor -H 'Content-Type: application/json' -d $body | ConvertFrom-Json
  if(-not $anchor.ok){ throw "Anchor failed: $($anchor | ConvertTo-Json -Compress)" }
  Write-Host "  -> anchor ok txId=$($anchor.txId)"
  Start-Sleep -Seconds 1
  $verify = curl -s "http://localhost:4010/verify?refId=$ref" | ConvertFrom-Json
  if(-not $verify.ok){ throw "Verify failed: $($verify | ConvertTo-Json -Compress)" }
  Write-Host "  -> verify ok result=$($( $verify.result | ConvertTo-Json -Compress))"
}
Write-Host "Done."
