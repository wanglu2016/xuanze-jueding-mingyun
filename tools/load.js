/* 在 Node 里加载游戏引擎和全部剧情，供模拟和检查脚本使用 */
const path = require('path'), fs = require('fs'), root = path.join(__dirname, '..', 'assets', 'js');
['series.js', 'engine.js'].concat(fs.readdirSync(path.join(root, 'content')).filter(f => f.endsWith('.js')).sort().map(f => 'content/' + f)).forEach(f => require(path.join(root, f)));
module.exports = globalThis.XZ;
