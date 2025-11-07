$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$baseUrl = 'http://localhost:3015'
$testFile = Join-Path $PSScriptRoot 'ipfs_test.txt'
$outFile = Join-Path $PSScriptRoot 'ipfs_download_test.txt'

# Prepare test file
Set-Content -Path $testFile -Value 'hello from blockchain-service ipfs test' -NoNewline -Encoding UTF8

Write-Host 'Uploading via application/octet-stream...'
try {
    $upload = Invoke-WebRequest -Method Post -Uri "$baseUrl/ipfs/upload-file" -InFile $testFile -ContentType 'application/octet-stream'
    $uploadJson = $upload.Content | ConvertFrom-Json
} catch {
    Write-Warning "Octet-stream upload failed: $($_.Exception.Message). Trying multipart/form-data..."
    $form = @{ file = Get-Item $testFile }
    $upload = Invoke-WebRequest -Method Post -Uri "$baseUrl/ipfs/upload-file" -Form $form
    $uploadJson = $upload.Content | ConvertFrom-Json
}

$cid = $uploadJson.cid
if (-not $cid) { throw "Upload did not return a CID. Response: $($upload.Content)" }
Write-Host "CID: $cid"

Write-Host 'Fetching stat...'
$stat = Invoke-RestMethod -UseBasicParsing -Uri "$baseUrl/ipfs/stat?cid=$cid"
$stat | ConvertTo-Json -Depth 6 | Write-Output

Write-Host 'Fetching content JSON and decoding base64...'
$getJson = Invoke-RestMethod -UseBasicParsing -Uri "$baseUrl/ipfs/get?cid=$cid"
$decodedBytes = [System.Convert]::FromBase64String($getJson.dataBase64)
[System.IO.File]::WriteAllBytes($outFile, $decodedBytes)
$downloaded = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
Write-Host 'Downloaded (decoded) content:'
Write-Output $downloaded

if ($downloaded -ne 'hello from blockchain-service ipfs test') {
    throw 'Downloaded content does not match uploaded content.'
}

Write-Host 'IPFS upload/stat/get verified successfully.' -ForegroundColor Green
