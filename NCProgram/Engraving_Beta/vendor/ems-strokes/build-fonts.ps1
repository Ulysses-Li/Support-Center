# 從上游 SVG 的 ASCII 字元建立單線筆畫資料；此工具不下載或刪除任何文件。
$fontMap = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
foreach ($def in @(
  @('ems-tech','EMSTech'), @('ems-hand','EMSCasualHand'),
  @('ems-swiss','EMSSwiss'), @('ems-capitol','EMSCapitol'),
  @('ems-league','EMSLeague'), @('ems-neato','EMSNeato')
)) {
  [xml]$doc = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot ($def[1] + '.svg'))
  $glyphMap = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
  foreach ($glyph in @($doc.GetElementsByTagName('glyph'))) {
    $c = $glyph.GetAttribute('unicode')
    if ($c.Length -ne 1 -or [int][char]$c -lt 32 -or [int][char]$c -gt 126) { continue }
    $width = [double]::Parse($glyph.GetAttribute('horiz-adv-x'), [System.Globalization.CultureInfo]::InvariantCulture)
    $glyphMap[$c] = @{w=$width;d=$glyph.GetAttribute('d')}
  }
  if ($glyphMap.Count -ne 95) { throw "Unexpected glyph count $($glyphMap.Count) in $($def[1])" }
  $fontMap[$def[0]] = $glyphMap
}
$json = ConvertTo-Json -InputObject $fontMap -Depth 10 -Compress
$target = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../singleline-latin-extra.js')).Path
$src = [IO.File]::ReadAllText($target)
$match = [regex]::Match($src, '(?s)(?<=  const fonts=).*?(?=;\r?\n  const midpoint=)')
if (!$match.Success) { throw 'Cannot find existing embedded font data' }
$updated = $src.Substring(0,$match.Index) + $json + $src.Substring($match.Index+$match.Length)
[IO.File]::WriteAllText($target,$updated,[Text.UTF8Encoding]::new($false))
