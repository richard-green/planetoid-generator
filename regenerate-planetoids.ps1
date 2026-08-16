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

    $args = @(
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
        '--start-seed', $currentStartSeed,
        '--count', $Count
    )

    if ($TintShadowFloor -ne $null) { $args += @('--tint-shadow-floor', $TintShadowFloor) }
    if ($Swirliness -ne $null) { $args += @('--swirliness', $Swirliness) }
    if ($CraterCount -ne $null) { $args += @('--crater-count', $CraterCount) }
    if ($CraterStrength -ne $null) { $args += @('--crater-strength', $CraterStrength) }
    if ($CraterColor -ne $null) { $args += @('--crater-color', $CraterColor) }
    if ($CraterRays -ne $null) { $args += @('--crater-rays', $CraterRays) }
    if ($RayVisibility -ne $null) { $args += @('--ray-visibility', $RayVisibility) }
    if ($RayDensity -ne $null) { $args += @('--ray-density', $RayDensity) }
    if ($RaySharpness -ne $null) { $args += @('--ray-sharpness', $RaySharpness) }
    if ($RayLengthPower -ne $null) { $args += @('--ray-length-power', $RayLengthPower) }
    if ($RidgeStrength -ne $null) { $args += @('--ridge-strength', $RidgeStrength) }
    if ($RidgeScale -ne $null) { $args += @('--ridge-scale', $RidgeScale) }
    if ($RidgeSharpness -ne $null) { $args += @('--ridge-sharpness', $RidgeSharpness) }
    if ($RidgeColorWeight -ne $null) { $args += @('--ridge-color-weight', $RidgeColorWeight) }
    if ($RiftStrength -ne $null) { $args += @('--rift-strength', $RiftStrength) }
    if ($RiftScale -ne $null) { $args += @('--rift-scale', $RiftScale) }
    if ($RiftWidth -ne $null) { $args += @('--rift-width', $RiftWidth) }
    if ($RiftSharpness -ne $null) { $args += @('--rift-sharpness', $RiftSharpness) }
    if ($RiftColorWeight -ne $null) { $args += @('--rift-color-weight', $RiftColorWeight) }
    if ($RidgesRiftsBlend -ne $null) { $args += @('--ridges-rifts-blend', $RidgesRiftsBlend) }
    if ($VolcanoCount -ne $null) { $args += @('--volcano-count', $VolcanoCount) }
    if ($VolcanoScale -ne $null) { $args += @('--volcano-scale', $VolcanoScale) }
    if ($VolcanoStrength -ne $null) { $args += @('--volcano-strength', $VolcanoStrength) }
    if ($VolcanoColor -ne $null) { $args += @('--volcano-color', $VolcanoColor) }
    if ($BumpTexHeight -ne $null) { $args += @('--bump-tex-height', $BumpTexHeight) }
    if ($ColorTexHeight -ne $null) { $args += @('--color-tex-height', $ColorTexHeight) }
    if ($ViewMode -ne "") { $args += @('--view-mode', $ViewMode) }
    if ($Step -ne $null) { $args += @('--step', $Step) }
    if ($AutoRotate -ne $null) { $args += @('--auto-rotate', $AutoRotate.ToString().ToLowerInvariant()) }
    if ($ShowDebugMeshes -ne $null) { $args += @('--show-debug-meshes', $ShowDebugMeshes.ToString().ToLowerInvariant()) }
    if ($CratersEnabled -ne $null) { $args += @('--craters-enabled', $CratersEnabled.ToString().ToLowerInvariant()) }
    if ($RidgesEnabled -ne $null) { $args += @('--ridges-enabled', $RidgesEnabled.ToString().ToLowerInvariant()) }
    if ($RiftsEnabled -ne $null) { $args += @('--rifts-enabled', $RiftsEnabled.ToString().ToLowerInvariant()) }
    if ($VolcanoesEnabled -ne $null) { $args += @('--volcanoes-enabled', $VolcanoesEnabled.ToString().ToLowerInvariant()) }
    if ($BaseUrl -ne "") { $args += @('--base-url', $BaseUrl) }
    if ($OutputDir -ne "") { $args += @('--output-dir', $OutputDir) }
    if ($FrameSettleMs -ne $null) { $args += @('--frame-settle-ms', $FrameSettleMs) }

    npm run auto-generate-planetoids -- @args

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
