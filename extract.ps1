
$line = (Get-Content -Path 'C:\Users\HP\.gemini\antigravity\brain\fe1485db-7c70-448e-a2a9-9de7eaa89e29\.system_generated\logs\overview.txt' -Raw)
# The file is huge, let's find the line with step_index 162
$json = $line -split "`n" | Where-Object { $_ -match '"step_index":162' }
$json | Out-File -FilePath 'c:\Users\HP\.gemini\antigravity\scratch\Butiki\step162_full.json' -Encoding utf8
