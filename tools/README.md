# 工具

都在仓库根目录下运行。需要 Node 18 以上；浏览器测试需要 `npm i playwright`。

| 脚本 | 用途 |
|---|---|
| `node tools/simulate.js 30` | 7 个年份 × 6 种出身 × 6 种下法批量模拟，检查死路、文字异常（undefined、NaN），并打印数值平衡表 |
| `node tools/repeat.js 8 .42` | 检查同一局里有没有相同或相似的选项 |
| `node tools/repeat2.js 8` | 按类别检查重复：考公、出国、回老家、复读、加杠杆 |
| `node tools/peek.js 1990 B wise 3` | 看一局具体怎么走的：年份、出身、下法、随机种子 |
| `node tools/e2e.js` | 在真实浏览器里把 7 个年份各走完一局 |
| `python3 tools/fonts.py` | 改了文字以后，按实际用字重新裁剪字体，说明见脚本开头 |
| `tools/film/` | 介绍片的制作脚本，见 `tools/film/README.md` |

下法：`best` 每手都选最好的，`wise` 大多下对，`folk` 普通人（多数跟大流），`crowd` 全跟大流，`safe` 只求稳，`spec` 只追快钱。

改剧情的顺序：改 `assets/js/content/*.js` → `simulate.js` 和两个查重脚本 → `fonts.py` → `e2e.js`。
