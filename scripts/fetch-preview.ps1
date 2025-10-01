$job = Start-Job -ScriptBlock {
    Set-Location 'c:\Users\san\JOE\ProcureX'
    npm run preview -- --host 127.0.0.1 | Out-Host
}

Start-Sleep -Seconds 3

try {
    (Invoke-WebRequest -Uri http://127.0.0.1:4173).Content | Out-Host
}
finally {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
}
