param(
  [int]$Attempts = 30,
  [int]$IntervalSeconds = 60,
  [string]$OutputPath = "$env:USERPROFILE\Desktop\dailyflora-github-content-monitor.csv"
)

$urls = @(
  "https://raw.githubusercontent.com/calfnai/dailyFlora/codex/dailyflora-desktop-windows/data/daily-content.json",
  "https://calfnai.github.io/dailyFlora/daily-content.json"
)

"timestamp,url,success,status,elapsedMs,bytes,error" | Set-Content -Encoding utf8 $OutputPath

for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
  foreach ($url in $urls) {
    $started = [System.Diagnostics.Stopwatch]::StartNew()
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 20
      $started.Stop()
      $bytes = [Text.Encoding]::UTF8.GetByteCount([string]$response.Content)
      "{0},{1},true,{2},{3},{4}," -f (Get-Date).ToUniversalTime().ToString("o"), $url, $response.StatusCode, $started.ElapsedMilliseconds, $bytes | Add-Content -Encoding utf8 $OutputPath
    } catch {
      $started.Stop()
      $message = ($_.Exception.Message -replace '"', '""' -replace ',', ';')
      "{0},{1},false,,{2},0,\"{3}\"" -f (Get-Date).ToUniversalTime().ToString("o"), $url, $started.ElapsedMilliseconds, $message | Add-Content -Encoding utf8 $OutputPath
    }
  }
  if ($attempt -lt $Attempts) { Start-Sleep -Seconds $IntervalSeconds }
}

Write-Host "DailyFlora GitHub content monitor finished: $OutputPath"
