# ACE Spot Drill - Cutting Data Calculator Logic

Source page:
- `Products/AceSpotDrill/indexV2.0.html`

Runtime files used by the calculator:
- `js/render/product-resource-template-V1.0V2.0.js`
- `Products/AceSpotDrill/product-dataV2.0.js`

## Inputs

The calculator uses these user-selectable/input values:

| Field | DOM id | Source / meaning |
| --- | --- | --- |
| Operation | `cuttingOperation` | `PRODUCT_PAGE_DATA.cuttingData.operations[].id` |
| Insert Size | `cuttingInsert` | Selected operation's `insertGroups[].id` |
| Included Angle | `cuttingAngle` | Selected insert's `angles` keys |
| Workpiece Material | `cuttingMaterial` | Selected operation's `materials` keys |
| Machining Diameter D | `cuttingDiameter` | User input; default is selected insert `diameter` |
| Cutting Speed Vc | `cuttingVc` | User input; default is midpoint of selected material `vc` range |
| Feed f | `cuttingFeed` | User input; default is midpoint of selected feed range |

## Spotting Depth

Spotting depth is displayed when:

```js
selected.operation.id === "spotting" && selected.insert.spotDepth
```

Formula:

```js
Spotting Depth = D * angleFactor - L
```

Angle factors learned from the ACE calculator:

| Included angle | Factor |
| ---: | ---: |
| 60 deg | 0.866 |
| 90 deg | 0.5 |
| 120 deg | 0.289 |
| 142 deg | 0.172 |

The `L` correction value is looked up by insert size and angle:

| Insert id | L at 60 deg | L at 90 deg | L at 120 deg | L at 142 deg |
| --- | ---: | ---: | ---: | ---: |
| `SI06` | 0.35 | 0.35 | 0.05 | 0.04 |
| `SI08` | 0.46 | 0.46 | 0.05 | 0.04 |
| `SI10` | 0.58 | 0.58 | 0.06 | 0.05 |
| `SI12` | 0.69 | 0.69 | 0.06 | 0.05 |
| `SI16` | 0.92 | 0.92 | 0.10 | 0.15 |
| `SI20` | 1.16 | 1.16 | 0.10 | 0.15 |

The calculator also displays `Tmax` for the selected spotting insert and angle:

| Insert id | Tmax at 60 deg | Tmax at 90 deg | Tmax at 120 deg | Tmax at 142 deg |
| --- | ---: | ---: | ---: | ---: |
| `SI06` | 4.1 | 2.5 | 1.6 | 0.95 |
| `SI08` | 5.6 | 3.4 | 2.2 | 1.29 |
| `SI10` | 7.1 | 4.4 | 2.7 | 1.64 |
| `SI12` | 8.6 | 5.3 | 3.3 | 1.98 |
| `SI16` | 11.6 | 7.0 | 4.4 | 2.67 |
| `SI20` | 14.6 | 8.9 | 5.6 | 3.36 |

## Data Selection Conditions

The calculator can calculate only when all of these data paths exist:

```js
operation = cuttingData.operations.find(item => item.id === operationId)
insert = operation.insertGroups.find(item => item.id === insertId)
angleData = insert.angles[angle]
material = operation.materials[materialId]
feedRange = angleData.f[materialId]
```

If any one of `operation`, `insert`, `angleData`, `material`, or `feedRange` is missing, the calculator returns `null` and does not update the result.

## Option Dependency Rules

When `Operation` changes:
- Rebuild `Insert Size` from the selected operation's `insertGroups`.
- Rebuild `Included Angle` from the selected insert's `angles`.
- Rebuild `Workpiece Material` from the selected operation's `materials`.
- Reset recommended `Vc` and `Feed f`.

When `Insert Size`, `Included Angle`, or `Workpiece Material` changes:
- Rebuild dependent options.
- Reset recommended `Vc` and `Feed f`.

When `Machining Diameter D`, `Cutting Speed Vc`, or `Feed f` changes:
- Keep the user's current values.
- Recalculate RPM and feed rate.

## Default Value Rules

Recommended default values are midpoint values:

```js
defaultVc = (material.vc[0] + material.vc[1]) / 2
defaultFeed = (feedRange[0] + feedRange[1]) / 2
```

Defaults are applied when:
- `resetRecommended` is `true`, or
- the input is empty.

Diameter default:

```js
diameter = selected.insert.diameter
```

Diameter is only auto-filled when the diameter input is empty.

## Calculation Formulas

RPM:

```js
RPM = 1000 * Vc / (Math.PI * D)
```

Feed rate:

```js
Feed Rate = RPM * f
```

Spotting depth:

```js
Spotting Depth = D * angleFactor - L
```

Displayed formatting:

```js
RPM displayed as rpm.toFixed(0)
Feed Rate displayed as feedRate.toFixed(1)
Spotting Depth displayed as spotDepth.toFixed(2)
```

## Calculation Validity Conditions

RPM is calculated only when:

```js
Number.isFinite(diameter) && diameter > 0 &&
Number.isFinite(vc) && vc > 0
```

If the condition is false, RPM output is blank.

Feed rate is calculated only when:

```js
rpm != null &&
Number.isFinite(feed) && feed > 0
```

If the condition is false, feed rate output is blank.

## Recommendation Output

The recommendation panel displays:

| Output | Source |
| --- | --- |
| Vc Range | `selected.material.vc` |
| Feed Range | `selected.feedRange` |
| Grade | `selected.material.grade` |
| Q | `selected.material.q`, only when `selected.operation.showQ` is true |

## Operation Data Conditions

### Spotting

- `id`: `spotting`
- `label`: `Spotting`
- `showQ`: `true`
- Q is displayed.
- Insert groups: `SI06`, `SI08`, `SI10`, `SI12`, `SI16`, `SI20`
- Angles: `60`, `90`, `120`, `142`

Material Vc / grade / Q:

| Material id | Label | Vc range m/min | Grade | Q |
| --- | --- | ---: | --- | --- |
| `carbonLow` | Carbon steel C < 0.3% | 120-250 | NC5254 | 0.1-0.5 mm |
| `carbonHigh` | Carbon steel C > 0.3% | 100-220 | NC2057 | 0.1-0.5 mm |
| `lowAlloy` | Low alloy steel C < 0.3% | 100-200 | NC5254 | 0.1-0.5 mm |
| `highAlloy` | High alloy steel | 80-180 | NC2057 | 0.1-0.5 mm |
| `stainless` | Stainless steel | 30-80 | NC5254 | 0.1-0.2 mm |
| `castIron` | Cast Iron | 80-180 | NC2057 | 0.1-0.5 mm |
| `nonFerrous` | Non-ferrous metal | 150-300 | XP9000 | 0.2-1.0 mm |

### Chamfering

- `id`: `chamfering`
- `label`: `Chamfering`
- `showQ`: `false`
- Q is not displayed.
- Insert groups: `SI06`, `SI08`, `SI10`, `SI12`, `SI16`, `SI20`
- Angles: `60`, `90`, `120`, `142`

Material Vc / grade:

| Material id | Label | Vc range m/min | Grade |
| --- | --- | ---: | --- |
| `carbonLow` | Carbon steel C < 0.3% | 60-150 | NC5254 |
| `carbonHigh` | Carbon steel C > 0.3% | 60-150 | NC2057 |
| `lowAlloy` | Low alloy steel C < 0.3% | 40-120 | NC5254 |
| `highAlloy` | High alloy steel | 40-100 | NC2057 |
| `stainless` | Stainless steel | 30-80 | NC5254 |
| `castIron` | Cast Iron | 40-120 | NC2057 |
| `nonFerrous` | Non-ferrous metal | 90-200 | XP9000 |

## Insert Diameter Defaults

Both `Spotting` and `Chamfering` use the same insert diameter defaults:

| Insert id | Label prefix | Default D mm |
| --- | --- | ---: |
| `SI06` | S9MT06T1 | 5.5 |
| `SI08` | S9MT0802 | 7.5 |
| `SI10` | S9MT1003 | 9.5 |
| `SI12` | S9MT1203 | 11.5 |
| `SI16` | S9MT1603 | 15.5 |
| `SI20` | S9MT2004 | 19.5 |

## Feed Range Lookup

Feed range is not calculated by formula. It is looked up from:

```js
selected.insert.angles[selectedAngle].f[selectedMaterialId]
```

The selected feed range is then:
- displayed as `Feed Range`
- used to generate the default `Feed f` midpoint

Example:

```js
feedRange = operation
  .insertGroups[insert]
  .angles[angle]
  .f[materialId]
```
