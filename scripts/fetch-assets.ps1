$job = Start-Job -ScriptBlock {
    Set-Location 'c:\Users\san\JOE\ProcureX'
    npm run preview -- --host 127.0.0.1 --port 4173 | Out-String | Out-Null
}

Start-Sleep -Seconds 3

try {
    $js = Invoke-WebRequest -Uri http://127.0.0.1:4173/assets/index-CqzHP0Jy.js -UseBasicParsing
    $js.Content | Out-Host
}
finally {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
}
