
$logPath = "C:\Users\HP\.gemini\antigravity\brain\fe1485db-7c70-448e-a2a9-9de7eaa89e29\.system_generated\logs\overview.txt"
$allText = [System.IO.File]::ReadAllText($logPath)
$lines = $allText -split "`n"
$line162 = $lines | Where-Object { $_ -match '"step_index":162' }
if ($line162) {
    $data = $line162 | ConvertFrom-Json
    $chunksJson = $data.tool_calls[0].args.ReplacementChunks
    # If ReplacementChunks is a string (JSON stringified), parse it
    if ($chunksJson -is [string]) {
        $chunks = $chunksJson | ConvertFrom-Json
    } else {
        $chunks = $chunksJson
    }
    
    $chunks | ForEach-Object {
        $_.ReplacementContent | Out-File -FilePath "c:\Users\HP\.gemini\antigravity\scratch\Butiki\recovered_chunk_$($_.StartLine).txt" -Encoding utf8
    }
    echo "Chunks extracted successfully"
} else {
    echo "Line 162 not found"
}
