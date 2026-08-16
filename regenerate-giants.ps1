$StartSeed = 100
$StartSeedOffsetPerCall = 100

function Invoke-GasGiantBatch {
    param(
        [string]$Palette = "jovianBands",
        [string]$SurfaceTint = "#d8d1b8",
        [Nullable[double]]$ColorScale = $null,
        [Nullable[double]]$TintShadowFloor = $null,
        [Nullable[int]]$CloudBandCount = $null,
        [Nullable[double]]$CloudBandSharpness = $null,
        [Nullable[double]]$CloudChaos = $null,
        [Nullable[int]]$StormCount = $null,
        [Nullable[double]]$StormScale = $null,
        [Nullable[double]]$StormPower = $null,
        [Nullable[double]]$StormStrength = $null,
        [Nullable[double]]$StormColorStrength = $null,
        [Nullable[double]]$BumpScale = $null,
        [Nullable[double]]$Roughness = $null,
        [Nullable[double]]$Metalness = $null,
        [Nullable[int]]$BumpTexHeight = $null,
        [Nullable[int]]$ColorTexHeight = $null,
        [Nullable[int]]$Step = $null,
        [Nullable[bool]]$AutoRotate = $null,
        [Nullable[bool]]$StormsEnabled = $null,
        [string]$BaseUrl = "",
        [string]$OutputDir = "",
        [Nullable[int]]$FrameSettleMs = $null,
        [int]$Count = 10
    )

    $currentStartSeed = $script:StartSeed

    $cliArgs = @(
        '--palette', $Palette,
        '--surface-tint', $SurfaceTint,
        '--seed', $currentStartSeed,
        '--count', $Count
    )

    if ($ColorScale -ne $null) { $cliArgs += @('--color-scale', $ColorScale) }
    if ($TintShadowFloor -ne $null) { $cliArgs += @('--tint-shadow-floor', $TintShadowFloor) }
    if ($CloudBandCount -ne $null) { $cliArgs += @('--cloud-band-count', $CloudBandCount) }
    if ($CloudBandSharpness -ne $null) { $cliArgs += @('--cloud-band-sharpness', $CloudBandSharpness) }
    if ($CloudChaos -ne $null) { $cliArgs += @('--cloud-chaos', $CloudChaos) }
    if ($StormCount -ne $null) { $cliArgs += @('--storm-count', $StormCount) }
    if ($StormScale -ne $null) { $cliArgs += @('--storm-scale', $StormScale) }
    if ($StormPower -ne $null) { $cliArgs += @('--storm-power', $StormPower) }
    if ($StormStrength -ne $null) { $cliArgs += @('--storm-strength', $StormStrength) }
    if ($StormColorStrength -ne $null) { $cliArgs += @('--storm-color-strength', $StormColorStrength) }
    if ($BumpScale -ne $null) { $cliArgs += @('--bump-scale', $BumpScale) }
    if ($Roughness -ne $null) { $cliArgs += @('--roughness', $Roughness) }
    if ($Metalness -ne $null) { $cliArgs += @('--metalness', $Metalness) }
    if ($BumpTexHeight -ne $null) { $cliArgs += @('--bump-tex-height', $BumpTexHeight) }
    if ($ColorTexHeight -ne $null) { $cliArgs += @('--color-tex-height', $ColorTexHeight) }
    if ($Step -ne $null) { $cliArgs += @('--step', $Step) }
    if ($AutoRotate -ne $null) { $cliArgs += @('--auto-rotate', $AutoRotate.ToString().ToLowerInvariant()) }
    if ($StormsEnabled -ne $null) { $cliArgs += @('--storms-enabled', $StormsEnabled.ToString().ToLowerInvariant()) }
    if ($BaseUrl -ne "") { $cliArgs += @('--base-url', $BaseUrl) }
    if ($OutputDir -ne "") { $cliArgs += @('--output-dir', $OutputDir) }
    if ($FrameSettleMs -ne $null) { $cliArgs += @('--frame-settle-ms', $FrameSettleMs) }

    npm run auto-generate-gas-giants -- @cliArgs

    $script:StartSeed = $currentStartSeed + $script:StartSeedOffsetPerCall
}

Invoke-GasGiantBatch `
    -Palette "jovianBands" `
    -SurfaceTint "#d8d1b8" `
    -ColorScale 1.35 `
    -CloudBandCount 13 `
    -CloudBandSharpness 0.62 `
    -CloudChaos 0.62 `
    -StormCount 10 `
    -StormScale 0.2 `
    -StormPower 2.1 `
    -StormStrength 0.55 `
    -StormColorStrength 0.45 `
    -Roughness 0.8 `
    -Metalness 0.04

Invoke-GasGiantBatch `
    -Palette "iceGiantTeal" `
    -SurfaceTint "#a9d4d8" `
    -ColorScale 1.15 `
    -CloudBandCount 9 `
    -CloudBandSharpness 0.35 `
    -CloudChaos 0.24 `
    -StormCount 4 `
    -StormScale 0.12 `
    -StormPower 2.8 `
    -StormStrength 0.22 `
    -StormColorStrength 0.22 `
    -Roughness 0.88 `
    -Metalness 0.02

Invoke-GasGiantBatch `
    -Palette "stormAzure" `
    -SurfaceTint "#8ba8c2" `
    -ColorScale 1.6 `
    -CloudBandCount 16 `
    -CloudBandSharpness 0.72 `
    -CloudChaos 1.2 `
    -StormCount 16 `
    -StormScale 0.22 `
    -StormPower 1.8 `
    -StormStrength 0.78 `
    -StormColorStrength 0.66 `
    -Roughness 0.74 `
    -Metalness 0.08

Invoke-GasGiantBatch `
    -Palette "opalStratosphere" `
    -SurfaceTint "#c7d8dc" `
    -ColorScale 1.3 `
    -CloudBandCount 12 `
    -CloudBandSharpness 0.58 `
    -CloudChaos 0.38 `
    -StormsEnabled $false `
    -StormCount 0 `
    -StormScale 0 `
    -StormPower 2.2 `
    -StormStrength 0 `
    -StormColorStrength 0 `
    -Roughness 0.84 `
    -Metalness 0.03

Invoke-GasGiantBatch `
    -Palette "sunsetCyclone" `
    -SurfaceTint "#e5b08a" `
    -ColorScale 1.4 `
    -CloudBandCount 14 `
    -CloudBandSharpness 0.66 `
    -CloudChaos 0.9 `
    -StormCount 12 `
    -StormScale 0.18 `
    -StormPower 2.4 `
    -StormStrength 0.52 `
    -StormColorStrength 0.48 `
    -Roughness 0.78 `
    -Metalness 0.06

Invoke-GasGiantBatch `
    -Palette "tealIndigoLime" `
    -SurfaceTint "#a7c0af" `
    -ColorScale 1.45 `
    -CloudBandCount 15 `
    -CloudBandSharpness 0.63 `
    -CloudChaos 1.05 `
    -StormCount 14 `
    -StormScale 0.2 `
    -StormPower 2.05 `
    -StormStrength 0.6 `
    -StormColorStrength 0.58 `
    -Roughness 0.76 `
    -Metalness 0.05
