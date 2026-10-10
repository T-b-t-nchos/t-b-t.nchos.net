param(
    [string]$Root = "..\assets\works",
    [int]$MaxWidth = 780,
    [int]$MaxHeight = 780,
    [int]$Quality = 82,
    [switch]$Apply
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
    throw "ImageMagick が見つかりません。インストール後、PowerShell を開き直してください。"
}

$Root = (Resolve-Path $Root).Path
$BackupRoot = Join-Path $Root "_originals"

$extensions = @(".avif", ".webp", ".jpg", ".jpeg", ".png")

$files = Get-ChildItem $Root -File -Recurse |
    Where-Object {
        $extensions -contains $_.Extension.ToLowerInvariant() -and
        $_.FullName -notlike "$BackupRoot\*"
    }

foreach ($file in $files) {
    $identify = & magick identify -ping -format "%w %h" $file.FullName 2>$null

    if ($LASTEXITCODE -ne 0 -or $identify -notmatch '^(\d+)\s+(\d+)$') {
        Write-Warning "読み取れないためスキップ: $($file.FullName)"
        continue
    }

    $width = [int]$Matches[1]
    $height = [int]$Matches[2]

    if ($width -le $MaxWidth -and $height -le $MaxHeight) {
        Write-Host "対象外（サイズ内）: $($file.FullName)"
        continue
    }

    $temp = Join-Path $file.DirectoryName ($file.BaseName + ".optimized" + $file.Extension)

    $before = $file.Length

    if ($file.Extension -ieq ".avif") {
        & magick $file.FullName -resize "${MaxWidth}x${MaxHeight}>" -quality $Quality $temp
    }
    elseif ($file.Extension -ieq ".webp") {
        & magick $file.FullName -resize "${MaxWidth}x${MaxHeight}>" -quality $Quality $temp
    }
    elseif ($file.Extension -match '^\.(jpg|jpeg)$') {
        & magick $file.FullName -resize "${MaxWidth}x${MaxHeight}>" -quality $Quality $temp
    }
    else {
        # PNG は透過を維持してリサイズ。非可逆圧縮はしない。
        & magick $file.FullName -resize "${MaxWidth}x${MaxHeight}>" $temp
    }

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $temp)) {
        Remove-Item $temp -Force -ErrorAction SilentlyContinue
        Write-Warning "変換失敗: $($file.FullName)"
        continue
    }

    $after = (Get-Item $temp).Length

    if ($after -ge $before) {
        Remove-Item $temp -Force
        Write-Host "削減効果なし: $($file.Name)"
        continue
    }

    $saved = [math]::Round(($before - $after) / 1KB, 1)
    Write-Host "$($file.Name): $([math]::Round($before / 1KB, 1)) KiB -> $([math]::Round($after / 1KB, 1)) KiB (削減 $saved KiB)"

    if ($Apply) {
        $relative = [IO.Path]::GetRelativePath($Root, $file.FullName)
        $backup = Join-Path $BackupRoot $relative
        $backupDir = Split-Path $backup -Parent

        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        Move-Item $file.FullName $backup
        Move-Item $temp $file.FullName
    }
    else {
        Remove-Item $temp -Force
        Write-Host "確認のみ。適用するには -Apply を指定: $($file.FullName)"
    }
}

