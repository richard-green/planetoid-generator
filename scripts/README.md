# Auto-generation scripts

Playwright-driven scripts that open the app in headless Firefox, apply settings, and save the
rendered output. Every setting shown in the UI is available as a CLI flag.

| Script                             | Page           | Default output dir           |
| ---------------------------------- | -------------- | ---------------------------- |
| `npm run auto-generate-planetoids` | `#/planetoids` | `public/generated/planetoid` |
| `npm run auto-generate-gas-giants` | `#/giants`     | `public/generated/giants`    |
| `npm run auto-generate-stars`      | `#/stars`      | `public/generated/stars`     |

## Prerequisites

The app must be running (`npm run dev`) and reachable at `--base-url`
(default `http://127.0.0.1:5173/`; the script adds the page route if the URL has no `#` part).

## Getting a command from the UI

The easiest way to build a command is to tune a body in the browser and export it:

- **Presets → Copy current as CLI command** copies an `npm run auto-generate-…` command with every
  current setting.
- **Presets → Manage presets → CLI** does the same for a built-in or saved preset.

Exported commands:

- include every setting, clamped to its min/max range;
- include the current camera zoom/orientation (`--camera-*`) for 3D views, or `--export-textures`
  when a texture/normal map view is active;
- end with `--seed 1 --step 1 --count 1` — edit these to generate a batch.

Saved presets can also be downloaded as JSON via **Manage presets → JSON**.

## Common options

| Option                  | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `--count <n>`           | Number of images to generate (default `1`)                              |
| `--seed <n>`            | Starting seed (default `1`)                                             |
| `--step <n>`            | Seed increment per image (default `1`; use `0` to keep the same seed)   |
| `--export-textures`     | Export the page's texture maps instead of a scene PNG                   |
| `--texture-size <n>`    | Default texture size when exporting (`256`–`4096`)                      |
| `--output-dir <path>`   | Where to write files                                                    |
| `--base-url <url>`      | App URL                                                                 |
| `--frame-settle-ms <n>` | Delay after each update before capturing (default `50`)                 |
| `--help`                | List every option, including all settings flags with their valid ranges |

Settings you omit keep the page's default value. Overriding any value in a section that can be
switched off (e.g. `--crater-count`) also switches that section on, unless you set its toggle
explicitly (e.g. `--craters-enabled false`).

### Camera

Scene PNGs are rendered at 1200×1200 from the default front view unless you set:

| Option                      | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `--camera-distance <n>`     | Zoom: distance from the body (`4`–`14`)                |
| `--camera-elevation <n>`    | Degrees above (+) / below (−) the equator (`-90`–`90`) |
| `--camera-azimuth <n>`      | Degrees around the main axis (`0` = front)             |
| `--camera-azimuth-step <n>` | Degrees added per image, for turntables                |

When camera options are used, file names get an `-azNNN` suffix.

## Examples

Ten planetoids with a custom palette and craters:

```bash
npm run auto-generate-planetoids -- --count 10 --seed 1 --palette oxidizedBasalt --crater-count 40
```

Planetoid ice caps with a snow fringe:

```bash
npm run auto-generate-planetoids -- --ice-caps-enabled true --ice-cap-coverage 0.18 --ice-cap-edge-noise 0.5 --ice-cap-palette glacial --ice-cap-color "#ffffff" --snow-extent 0.08 --snow-coverage 0.55
```

Planetoid texture maps (color, normal, dust-cloud color, dust-cloud normal) at 2048:

```bash
npm run auto-generate-planetoids -- --count 5 --export-textures --texture-size 2048
```

Gas giants with rings:

```bash
npm run auto-generate-gas-giants -- --count 10 --palette jovianBands --rings-enabled true --ring-palette iceDust
```

Red stars viewed from above:

```bash
npm run auto-generate-stars -- --count 5 --palette Red --camera-elevation 60
```

A 36-frame turntable of a single gas giant:

```bash
npm run auto-generate-gas-giants -- --seed 42 --step 0 --count 36 --camera-azimuth-step 10
```

## PowerShell batch helpers

`regenerate-planetoids.ps1` and `regenerate-giants.ps1` (repo root) run several curated batches,
advancing the start seed between them.
