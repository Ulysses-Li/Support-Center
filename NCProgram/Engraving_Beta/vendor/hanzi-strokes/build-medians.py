"""Make Me a Hanzi 資料重建工具；僅保留每字的 medians 欄位，不改座標。"""
import hashlib
import json
import pathlib
import urllib.request

commit = 'bddc96d41bef78427ed0e034e9f7e31d71fd1b92'
url = f'https://raw.githubusercontent.com/skishore/makemeahanzi/{commit}/graphics.txt'
with urllib.request.urlopen(url, timeout=60) as response:
    raw = response.read()
glyphs = {}
for line in raw.decode('utf-8').splitlines():
    if line:
        item = json.loads(line)
        glyphs[item['character']] = item['medians']
output = {
    '_notice': 'Modified 2026-11-19 from Make Me a Hanzi graphics.txt: kept only character and medians, unchanged coordinates; licensed under Arphic Public License; see ARPHICPL.TXT.',
    '_source': url,
    '_sha256': hashlib.sha256(raw).hexdigest(),
    'glyphs': glyphs,
}
target = pathlib.Path(__file__).with_name('medians.json')
target.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(glyphs)} glyphs, {target.stat().st_size} bytes')
