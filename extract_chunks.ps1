
$logPath = "C:\Users\HP\.gemini\antigravity\brain\fe1485db-7c70-448e-a2a9-9de7eaa89e29\.system_generated\logs\overview.txt"
$line = (Get-Content -Path $logPath -TotalCount 100)[53] # Line 54
$data = $line | ConvertFrom-Json
$chunks = $data.tool_calls[0].args.ReplacementChunks | ConvertFrom-Json
$chunks | ForEach-Object {
    $_.ReplacementContent | Out-File -FilePath "c:\Users\HP\.gemini\antigravity\scratch\Butiki\chunk_$($_.StartLine).txt" -Encoding utf8
}
