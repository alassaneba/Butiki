Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\HP\.gemini\antigravity\brain\be0f0023-8494-4e8d-8290-3d2029c4fae6\butik_logo_opt2_vara_1778172793243.png')

$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.DrawImage($img, 0, 0, 192, 192)
$bmp192.Save('C:\Users\HP\.gemini\antigravity\scratch\Butiki\public\pwa-192x192.png', [System.Drawing.Imaging.ImageFormat]::Png)

$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.DrawImage($img, 0, 0, 512, 512)
$bmp512.Save('C:\Users\HP\.gemini\antigravity\scratch\Butiki\public\pwa-512x512.png', [System.Drawing.Imaging.ImageFormat]::Png)

$bmp32 = New-Object System.Drawing.Bitmap 32, 32
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.DrawImage($img, 0, 0, 32, 32)
$bmp32.Save('C:\Users\HP\.gemini\antigravity\scratch\Butiki\public\favicon.png', [System.Drawing.Imaging.ImageFormat]::Png)

$img.Save('C:\Users\HP\.gemini\antigravity\scratch\Butiki\public\logo.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g192.Dispose()
$bmp192.Dispose()
$g512.Dispose()
$bmp512.Dispose()
$g32.Dispose()
$bmp32.Dispose()
$img.Dispose()

