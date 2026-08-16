$StartSeed = 100
$StartSeedOffsetPerCall = 100

function Invoke-PlanetoidBatch {
    param(
        [string]$Palette = "rocky",
        [string]$SurfaceTint = "#9C857E",
        [double]$ColorScale = 1,
        [Nullable[double]]$TintShadowFloor = $null,
        [Nullable[double]]$Swirliness = $null,
        [double]$BumpScale = 4,
        [Nullable[int]]$CraterCount = $null,
        [Nullable[double]]$CraterStrength = $null,
        [Nullable[double]]$CraterColor = $null,
        [Nullable[double]]$CraterRays = $null,
        [Nullable[double]]$RayVisibility = $null,
        [Nullable[double]]$RayDensity = $null,
        [Nullable[double]]$RaySharpness = $null,
        [Nullable[double]]$RayLengthPower = $null,
        [Nullable[double]]$RidgeStrength = $null,
        [Nullable[double]]$RidgeScale = $null,
        [Nullable[double]]$RidgeSharpness = $null,
        [Nullable[double]]$RidgeColorWeight = $null,
        [Nullable[double]]$RiftStrength = $null,
        [Nullable[double]]$RiftScale = $null,
        [Nullable[double]]$RiftWidth = $null,
        [Nullable[double]]$RiftSharpness = $null,
        [Nullable[double]]$RiftColorWeight = $null,
        [Nullable[double]]$RidgesRiftsBlend = $null,
        [Nullable[int]]$VolcanoCount = $null,
        [Nullable[double]]$VolcanoScale = $null,
        [Nullable[double]]$VolcanoStrength = $null,
        [Nullable[double]]$VolcanoColor = $null,
        [Nullable[int]]$BumpTexHeight = $null,
        [Nullable[int]]$ColorTexHeight = $null,
        [double]$Roughness = 0.25,
        [double]$Metalness = 0.5,
        [double]$LargeScale = 0.4,
        [double]$MediumScale = 0.1,
        [double]$SmallScale = 0.1,
        [int]$TriangleDetail = 20,
        [string]$ViewMode = "",
        [Nullable[int]]$Step = $null,
        [Nullable[bool]]$AutoRotate = $null,
        [Nullable[bool]]$ShowDebugMeshes = $null,
        [Nullable[bool]]$CratersEnabled = $null,
        [Nullable[bool]]$RidgesEnabled = $null,
        [Nullable[bool]]$RiftsEnabled = $null,
        [Nullable[bool]]$VolcanoesEnabled = $null,
        [string]$BaseUrl = "",
        [string]$OutputDir = "",
        [Nullable[int]]$FrameSettleMs = $null,
        [int]$Count = 10
    )

    $currentStartSeed = $script:StartSeed

    $cliArgs = @(
        '--palette', $Palette,
        '--surface-tint', $SurfaceTint,
        '--color-scale', $ColorScale,
        '--bump-scale', $BumpScale,
        '--roughness', $Roughness,
        '--metalness', $Metalness,
        '--large-scale', $LargeScale,
        '--medium-scale', $MediumScale,
        '--small-scale', $SmallScale,
        '--triangle-detail', $TriangleDetail,
        '--seed', $currentStartSeed,
        '--count', $Count
    )

    if ($TintShadowFloor -ne $null) { $cliArgs += @('--tint-shadow-floor', $TintShadowFloor) }
    if ($Swirliness -ne $null) { $cliArgs += @('--swirliness', $Swirliness) }
    if ($CraterCount -ne $null) { $cliArgs += @('--crater-count', $CraterCount) }
    if ($CraterStrength -ne $null) { $cliArgs += @('--crater-strength', $CraterStrength) }
    if ($CraterColor -ne $null) { $cliArgs += @('--crater-color', $CraterColor) }
    if ($CraterRays -ne $null) { $cliArgs += @('--crater-rays', $CraterRays) }
    if ($RayVisibility -ne $null) { $cliArgs += @('--ray-visibility', $RayVisibility) }
    if ($RayDensity -ne $null) { $cliArgs += @('--ray-density', $RayDensity) }
    if ($RaySharpness -ne $null) { $cliArgs += @('--ray-sharpness', $RaySharpness) }
    if ($RayLengthPower -ne $null) { $cliArgs += @('--ray-length-power', $RayLengthPower) }
    if ($RidgeStrength -ne $null) { $cliArgs += @('--ridge-strength', $RidgeStrength) }
    if ($RidgeScale -ne $null) { $cliArgs += @('--ridge-scale', $RidgeScale) }
    if ($RidgeSharpness -ne $null) { $cliArgs += @('--ridge-sharpness', $RidgeSharpness) }
    if ($RidgeColorWeight -ne $null) { $cliArgs += @('--ridge-color-weight', $RidgeColorWeight) }
    if ($RiftStrength -ne $null) { $cliArgs += @('--rift-strength', $RiftStrength) }
    if ($RiftScale -ne $null) { $cliArgs += @('--rift-scale', $RiftScale) }
    if ($RiftWidth -ne $null) { $cliArgs += @('--rift-width', $RiftWidth) }
    if ($RiftSharpness -ne $null) { $cliArgs += @('--rift-sharpness', $RiftSharpness) }
    if ($RiftColorWeight -ne $null) { $cliArgs += @('--rift-color-weight', $RiftColorWeight) }
    if ($RidgesRiftsBlend -ne $null) { $cliArgs += @('--ridges-rifts-blend', $RidgesRiftsBlend) }
    if ($VolcanoCount -ne $null) { $cliArgs += @('--volcano-count', $VolcanoCount) }
    if ($VolcanoScale -ne $null) { $cliArgs += @('--volcano-scale', $VolcanoScale) }
    if ($VolcanoStrength -ne $null) { $cliArgs += @('--volcano-strength', $VolcanoStrength) }
    if ($VolcanoColor -ne $null) { $cliArgs += @('--volcano-color', $VolcanoColor) }
    if ($BumpTexHeight -ne $null) { $cliArgs += @('--bump-tex-height', $BumpTexHeight) }
    if ($ColorTexHeight -ne $null) { $cliArgs += @('--color-tex-height', $ColorTexHeight) }
    if ($ViewMode -ne "") { $cliArgs += @('--view-mode', $ViewMode) }
    if ($Step -ne $null) { $cliArgs += @('--step', $Step) }
    if ($AutoRotate -ne $null) { $cliArgs += @('--auto-rotate', $AutoRotate.ToString().ToLowerInvariant()) }
    if ($ShowDebugMeshes -ne $null) { $cliArgs += @('--show-debug-meshes', $ShowDebugMeshes.ToString().ToLowerInvariant()) }
    if ($CratersEnabled -ne $null) { $cliArgs += @('--craters-enabled', $CratersEnabled.ToString().ToLowerInvariant()) }
    if ($RidgesEnabled -ne $null) { $cliArgs += @('--ridges-enabled', $RidgesEnabled.ToString().ToLowerInvariant()) }
    if ($RiftsEnabled -ne $null) { $cliArgs += @('--rifts-enabled', $RiftsEnabled.ToString().ToLowerInvariant()) }
    if ($VolcanoesEnabled -ne $null) { $cliArgs += @('--volcanoes-enabled', $VolcanoesEnabled.ToString().ToLowerInvariant()) }
    if ($BaseUrl -ne "") { $cliArgs += @('--base-url', $BaseUrl) }
    if ($OutputDir -ne "") { $cliArgs += @('--output-dir', $OutputDir) }
    if ($FrameSettleMs -ne $null) { $cliArgs += @('--frame-settle-ms', $FrameSettleMs) }

    npm run auto-generate-planetoids -- @cliArgs

    $script:StartSeed = $currentStartSeed + $script:StartSeedOffsetPerCall
}

Invoke-PlanetoidBatch `
    -Palette "verdigrisOre" `
    -SurfaceTint "#9C857E" `
    -ColorScale 0.8 `
    -Roughness 0.6 `
    -Metalness 0.5 `
    -LargeScale 0.6 `
    -MediumScale 0.4 `
    -SmallScale 0.2 `

Invoke-PlanetoidBatch `
    -Palette "emberFaults" `
    -SurfaceTint "#9A827A" `
    -ColorScale 0.9 `
    -Roughness 0.6 `
    -Metalness 0.2 `
    -LargeScale 0.6 `
    -MediumScale 0.4 `
    -SmallScale 0.2 `

Invoke-PlanetoidBatch `
    -Palette "mineralVeins" `
    -SurfaceTint "#948D81" `
    -ColorScale 0.8 `
    -Roughness 0.6 `
    -Metalness 0.2 `
    -LargeScale 0.6 `
    -MediumScale 0.4 `
    -SmallScale 0.2 `

Invoke-PlanetoidBatch `
    -Palette "oxidisedBasalt" `
    -SurfaceTint "#948D81" `
    -Roughness 0.8 `
    -Metalness 0.3 `
    -LargeScale 0.4 `
    -MediumScale 0.4 `
    -SmallScale 0.1 `

Invoke-PlanetoidBatch `
    -Palette "icy" `
    -SurfaceTint "#DCEDFA" `
    -Roughness 0.2 `
    -Metalness 0.3 `
    -LargeScale 0.6 `
    -MediumScale 0.4 `
    -SmallScale 0.1 `

Invoke-PlanetoidBatch `
    -Palette "rocky" `
    -SurfaceTint "#706c66" `
    -Roughness 0.8 `
    -Metalness 0.4 `
    -LargeScale 0.8 `
    -MediumScale 0.4 `
    -SmallScale 0.2 `

Invoke-PlanetoidBatch `
    -Palette "carbonaceous" `
    -SurfaceTint "#867E6F" `
    -Roughness 0.8 `
    -Metalness 0.4 `
    -LargeScale 0.8 `
    -MediumScale 0.4 `
    -SmallScale 0.2 `
