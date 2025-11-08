param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    # Необязательно: можно явно указать папку назначения
    [string]$DestinationPath
)

# Проверяем исходную папку
if (-not (Test-Path $SourcePath)) {
    Write-Error "Указанный путь не существует: $SourcePath"
    exit 1
}

# Если путь назначения не указан — создаём <ИсходнаяПапка>_lowercase рядом
if (-not $DestinationPath) {
    $parent = Split-Path -Parent $SourcePath
    $name   = Split-Path -Leaf  $SourcePath
    $DestinationPath = Join-Path $parent ($name + "_lowercase")
}

# Создаём корневую папку назначения
New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null

$sourceFull = (Resolve-Path $SourcePath).Path
$sep = [IO.Path]::DirectorySeparatorChar

Get-ChildItem -Path $sourceFull -File -Recurse | ForEach-Object {
    # относительный путь от исходной папки
    $relative = $_.FullName.Substring($sourceFull.Length).TrimStart('\','/')

    # разбиваем на части (подпапки + имя файла) и переводим в нижний регистр
    $parts = $relative -split '[\\/]' | ForEach-Object { $_.ToLowerInvariant() }
    $destRelative = ($parts -join $sep)

    $destFull = Join-Path $DestinationPath $destRelative
    $destDir  = Split-Path $destFull -Parent

    # создаём нужную подпапку в назначении
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    # копируем файл
    Copy-Item -LiteralPath $_.FullName -Destination $destFull -Force

    Write-Host "Сохранено: $relative -> $destRelative"
}

Write-Host "Готово. Все файлы с именами в нижнем регистре — в папке: $DestinationPath"
