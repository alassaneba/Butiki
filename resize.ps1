Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\HP\.gemini\antigravity\brain\d8ed98a2-565e-4248-8846-d9af935e74e4\butiki_logo_base_1776702559575.png')

$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.DrawImage($img, 0, 0, 192, 192)
$bmp192.Save('C:\Users\HP\.gemini\antigravity\scratch\Butiki\public\pwa-192x192.png', [System.Drawing.Imaging.ImageFormat]::Png)

$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.DrawImage($img, 0, 0, 512, 512)
$bmp512.Save('C:\Users\HP\.gemini\antigravity\scratch\Butiki\public\pwa-512x512.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g192.Dispose()
$bmp192.Dispose()
$g512.Dispose()
$bmp512.Dispose()
$img.Dispose()
