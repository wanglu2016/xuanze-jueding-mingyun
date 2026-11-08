#!/usr/bin/env python3
"""按游戏实际用字裁剪中文字体，写到 assets/fonts/。改了剧情文字以后运行一次。

需要：pip install fonttools brotli
源字体（用环境变量指定，默认是 Ubuntu 的 fonts-noto-cjk 和 npm 包的位置）：
  NOTO_SERIF      思源宋体 Regular 的 .ttc/.otf
  NOTO_SERIF_BLK  思源宋体 Black 的 .ttc/.otf
  WENKAI_DIR      npm 包 lxgw-wenkai-webfont 的 files/ 目录（切片 woff2）
  MASHAN_DIR      npm 包 @fontsource/ma-shan-zheng 的 files/ 目录（切片 woff2）
"""
import glob, os, re, sys
from pathlib import Path
from fontTools.ttLib import TTCollection, TTFont
from fontTools import subset
from fontTools.merge import Merger

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'fonts'
SER = os.environ.get('NOTO_SERIF', '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc')
BLK = os.environ.get('NOTO_SERIF_BLK', '/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc')
KAI = os.environ.get('WENKAI_DIR', 'node_modules/lxgw-wenkai-webfont/files')
BRU = os.environ.get('MASHAN_DIR', 'node_modules/@fontsource/ma-shan-zheng/files')

files = sorted(glob.glob(str(ROOT / 'assets/js/**/*.js'), recursive=True)) + [str(ROOT / 'index.html'), str(ROOT / 'video.html')]
text = ''.join(Path(f).read_text(encoding='utf8') for f in files)
ascii_ = set(chr(c) for c in range(32, 127))
chars = set(re.findall(r'[^\x00-\x7f]', text)) | ascii_ | set('〇一二三四五六七八九十百千万亿')
titles = set(''.join(re.findall(r"title: (?:s => )?[^\n]{0,120}", text))) | set('选择决定命运年岁第手这一生下了你接住的伏笔没看见的选项认知体检千个平行走势再局棋谱学业家财依据与方法推演实线到此为止布中盘官子继续落子猜先重新接着') | ascii_
brush = set('选择决定命运布局中盘官子半目胜负持和被提五六七八九三二一四十0123456789')


def opts(feats):
    o = subset.Options(); o.layout_features = feats; o.hinting = False; o.notdef_outline = True; o.name_IDs = [1, 2, 4]
    return o


def load(path):
    if path.endswith('.ttc'):
        for f in TTCollection(path).fonts:
            if 'SC' in f['name'].getDebugName(1): return f
    return TTFont(path)


def one(src, want, out, feats):
    f = load(src); s = subset.Subsetter(opts(feats)); s.populate(text=''.join(want)); s.subset(f)
    f.flavor = 'woff2'; f.save(out); print(out.name, out.stat().st_size // 1024, 'KB')


def slices(pattern, want, out):
    """npm 上的中文网络字体是切片的：挑出用得到的切片，各自裁剪后合并"""
    need = set(ord(c) for c in want); parts = []
    tmp = Path(os.environ.get('TMPDIR', '/tmp')) / 'xz_fonts'; tmp.mkdir(exist_ok=True)
    for p in sorted(glob.glob(pattern)):
        f = TTFont(p); hit = set(f.getBestCmap()) & need
        if not hit: continue
        s = subset.Subsetter(opts([])); s.populate(unicodes=sorted(hit)); s.subset(f)
        f.flavor = None; q = tmp / (Path(p).stem + '.ttf'); f.save(q); parts.append(str(q)); need -= hit
    if not parts: sys.exit(f'找不到切片：{pattern}')
    font = Merger().merge(parts); font.flavor = 'woff2'; font.save(out)
    print(out.name, out.stat().st_size // 1024, 'KB', '缺字', ''.join(chr(c) for c in need if c > 127))


one(SER, chars, OUT / 'serif.woff2', ['kern', 'liga', 'vert', 'vrt2', 'vkrn', 'palt'])
one(BLK, titles, OUT / 'disp.woff2', ['kern', 'liga', 'vert', 'vrt2', 'vkrn', 'palt'])
slices(f'{KAI}/lxgwwenkai-regular-subset-*.woff2', chars, OUT / 'kai.woff2')
slices(f'{BRU}/ma-shan-zheng-*-400-normal.woff2', brush, OUT / 'brush.woff2')
print('用字', len(chars))
