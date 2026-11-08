/* 高考、大学、毕业，以及不走高考的路 */
(function (root) {
  'use strict';
  const XZ = root.XZ, N = XZ.N, G = XZ.G;
  const { M, B, P, S, H } = G.GR;
  const TIER = { top: ['清北复交', 1.5], c9: ['985 高校', 1.3], b211: ['211 高校', 1.12], yi: ['一本院校', .98], er: ['二本院校', .78], zhuan: ['专科院校', .62], none: ['落榜', .55] };
  const RANK = ['none', 'zhuan', 'er', 'yi', 'b211', 'c9', 'top'];
  const line = v => Math.round(300 + v * 4.2);
  function gkCalc(s) {
    if (s.f.gkYear === s.year) return;
    s.f.gkYear = s.year;
    const v = G.clamp(s.acad + XZ.CITY[s.city].gk + (G.rand(s) - .5) * 12, 0, 100);
    const c = XZ.COHORT[s.cohort].gk, er = c.min + (65 - c.min) * .45;
    s.f.gkV = v;
    s.f.gkT = v >= 90 ? 'top' : v >= 81 ? 'c9' : v >= 73 ? 'b211' : v >= 65 ? 'yi' : v >= er ? 'er' : v >= c.min ? 'zhuan' : 'none';
  }
  const MAJOR = {
    cs: { n: '计算机', job: 'dev', t: 1, seed: ['code', '大学里学了计算机'] }, civil: { n: '土木工程', job: 'civil', t: 2 }, intl: { n: '国际贸易', job: 'trade', t: 2, seed: ['english', '国贸专业逼出来的英语'] },
    normal: { n: '师范', job: 'teacher', t: 3 }, mech: { n: '机械', job: 'tech', t: 3, m: 1.05 }, bio: { n: '生物工程', job: 'clerk', t: 2, m: .95 }, fin: { n: '金融', job: 'fin', t: 1, seed: ['finance', '大学里学了金融'] },
    med: { n: '临床医学', job: 'doctor', t: 2, yrs: 5 }, media: { n: '新闻传播', job: 'media', t: 1 }, ee: { n: '电气工程', job: 'ee', t: 2, seed: ['elec', '学了电气'] }, ic: { n: '集成电路', job: 'chip', t: 1, seed: ['elec', '学了电路和半导体'] },
    ai: { n: '人工智能', job: 'dev', t: 1, seed: ['ml', '大学学了机器学习'] }, law: { n: '法学', job: 'lawyer', t: 2, seed: ['law', '大学读了法律'] }, lang: { n: '英语', job: 'clerk', t: 2, seed: ['english', '英语专业'] }, aix: { n: 'AI 加医学工程双学位', job: 'ai', t: 1, m: 2.4, seed: ['ml', '学了 AI 和一个具体行业'] },
    robo: { n: '机器人工程', job: 'ev', t: 2, seed: ['elec', '学了机器人工程'] }, nurse: { n: '护理或康复', job: 'nurse', t: 2, seed: ['care', '学了护理康复'] }
  };
  XZ.MAJOR = MAJOR;
  const GK = {
    1980: { lead: '全国报名约 320 万，录取约 108 万，三个人录一个。', o: [['cs', '计算机。机房里只有几台 486，学长说毕业能去银行管电脑', M, 0, ['trend']], ['civil', '土木工程。这一年刚停止福利分房，以后房子要靠市场来盖', M, 0, ['trend']], ['intl', '国际贸易。新闻说中国在谈加入世贸', B, 0, ['trend']], ['normal', '师范。免学费，包分配', B, 'z', ['cost']], ['mech', '机械。本省老牌专业，对口大国企', S, 'c', ['trend']]] },
    1985: { lead: '全国报名 613 万。这一年高考第一次提前到六月，考场门口量着体温。', o: [['bio', '生物工程。报纸都说二十一世纪是生命科学的世纪', S, 'c', ['info']], ['cs', '计算机。互联网泡沫刚破，学长说程序员不好找工作', M, 0, ['trend']], ['civil', '土木工程。全国都在盖楼', B, 0, ['trend']], ['fin', '金融。本省状元都在报', B, 0, ['trend']], ['med', '临床医学。要读五年以上', B, 'z', ['long']]] },
    1990: { lead: '全国报名 1050 万，历史上第一次过千万。', o: [['cs', '计算机。师兄说写代码的天天加班，工资也就那样', M, 0, ['trend']], ['fin', '金融。雷曼还没倒，亲戚都说金融最赚钱', B, 'c', ['trend']], ['civil', '土木工程。路桥专业的师兄年薪最高', B, 0, ['trend']], ['media', '新闻传播。都说记者是无冕之王', S, 0, ['trend']], ['ee', '电气工程。进电网，一辈子不愁', B, 'z', ['cost']]] },
    1995: { lead: '全国报名 912 万，已经连续几年回落，录取率超过七成。', o: [['cs', '计算机。身边的人都说这个专业累', M, 0, ['trend']], ['ee', '电气工程。听起来很土，师兄去了电网和车企', M, 0, ['trend']], ['fin', '金融。投行的新闻让人心动', B, 'c', ['trend']], ['civil', '土木工程。师兄说工地上一年能挣二十万', S, 'c', ['trend']], ['med', '临床医学。要读很多年', B, 'z', ['long']]] },
    2000: { lead: '全国报名 975 万。四月，美国宣布对中兴禁售芯片。', o: [['ic', '集成电路。分不算最高，新闻说要自主可控', M, 0, ['trend', 'info']], ['ai', '人工智能。不少高校刚成立了人工智能学院，名字最响', B, 'x', ['trend']], ['cs', '计算机。最热的专业', B, 'c', ['trend']], ['fin', '金融。家长最爱的专业', S, 'c', ['trend']], ['civil', '土木工程。分数低，好上', S, 0, ['trend']]] },
    2005: { lead: '全国报名 1291 万，创历史新高。网上有人说计算机已经饱和，也有人说只有计算机。', o: [['ee', '电气与能源。电网、储能、算力中心都要用电', M, 0, ['trend']], ['cs', '计算机。还是最热', P, 'c', ['trend']], ['med', '临床医学。老龄化只会继续', B, 'z', ['trend']], ['ic', '集成电路。国家在投钱', B, 0, ['trend']], ['fin', '金融。亲戚说这行最体面', S, 'c', ['trend']], ['lang', '英语。喜欢语言', S, 0, ['trend']]] },
    2010: { lead: '这一年的高考是推演。十八岁人口约 1600 万，多数专业名字你爸妈都没听过。', o: [['aix', 'AI 加一个具体行业，比如医学工程', M, 0, ['trend']], ['robo', '机器人工程。动手的活最难被替代', B, 0, ['trend']], ['nurse', '护理或康复。缺口巨大，听起来不够体面', B, 'z', ['trend']], ['normal', '师范。家里说稳定', S, 'c', ['trend']], ['cs', '计算机。写代码的人还需要那么多吗？', P, 'c', ['trend']]] }
  };

  const gkLock = (k, T) => (k === 'med' && RANK.indexOf(T) < 3 ? ['分数', '临床医学的线比你高。'] : k === 'ic' && RANK.indexOf(T) < 3 ? ['分数', '这所学校没有这个专业。'] : null);
  function enroll(s, k, T) {
    const m = MAJOR[k];
    s.uni = T; s.major = k; s.edu = T === 'zhuan' ? 2 : 3; s.inSchool = true; s.gradY = s.year + (T === 'zhuan' ? 3 : m.yrs || 4);
    if (m.seed) G.seed(s, m.seed[0], m.seed[1]);
    return `你被${TIER[T][0]}的${m.n}专业录取。${s.cls === 'A' ? '学费是全家一起凑的。' : '行李装了两大箱。'}`;
  }
  /* 复读后的志愿：这一年你多知道了一些东西，理由和第一次不一样 */
  const R2 = { cs: '计算机。这一年你问过师兄，查过招聘网站', civil: '土木工程。舅舅的工程队一直缺人', intl: '国际贸易。城里的外贸公司越开越多', normal: '师范。家里算过账，这条路最省钱', mech: '机械。今年它的线还够得着', bio: '生物工程。复读班的老师说它前途无量', fin: '金融。这一年你读了几本财经杂志', med: '临床医学。这一年家里有人住过院', media: '新闻传播。你还是想写东西', ee: '电气工程。亲戚在供电局，说这行缺人', ic: '集成电路。这一年的新闻都在说这个词', ai: '人工智能。复读班里人人都在说它', lang: '英语。这是你这一年进步最大的一门', aix: 'AI 加行业的双学位。这一年你想明白了要学什么', robo: '机器人工程。你去看过一次工业展', nurse: '护理或康复。这一年你陪老人跑过医院' };
  N({
    id: 'gk2', trig: 1, dom: 'xue', title: '第二次走进考场', d: ['trend', 'cost'], when: s => s.track === 'pg' && !s.uni,
    text: s => { gkCalc(s); const T = s.f.gkT; return [`${G.yearCN(s.year)}年。复读班的黑板擦了一年。`, T === 'none' ? `你考了 ${line(s.f.gkV)} 分，还是没有过线。家里的钱不够再供一年了。` : `你考了 ${line(s.f.gkV)} 分，这一次能上${TIER[T][0]}。这一年你多看了一些东西，再填一次志愿。`]; },
    opts: s => {
      gkCalc(s);
      const T = s.f.gkT, list = [];
      if (T !== 'none') GK[s.cohort].o.forEach(([k, t, g, tag, d]) => list.push({ id: k, t: R2[k] || t, g, d, c: tag === 'c', x: tag === 'x', z: tag === 'z', lock: () => gkLock(k, T), do: s => enroll(s, k, T) }));
      else list.push({ id: 'minban', t: '上一所民办学院，学费贵一点，先拿个文凭', c: 1, g: P, d: ['cost'], do: s => { G.money(s, -G.w(s, .4)); return enroll(s, 'mech', 'zhuan'); } });
      list.push({ id: 'leave', t: '够了，这一年已经尽力，跟表哥去学门手艺', x: 1, g: T === 'none' ? B : S, d: ['cost'], do: s => { s.track = 'out'; s.inSchool = false; s.f.out = 1; G.seed(s, 'craft', '复读后去学了手艺'); return '你把复读班的卷子卖了废品。'; } });
      return list;
    },
    lesson: '复读买到的是一年的时间和几十分。第二次填志愿时，你应该比第一次多知道一些东西，别只是多了一年焦虑。'
  });

  N({
    id: 'gk', age: 18, p: 95, dom: 'xue', title: '高考', when: s => s.track === 'pg' && !s.uni, d: ['trend'],
    text: s => {
      gkCalc(s);
      const c = XZ.COHORT[s.cohort], v = s.f.gkV, T = s.f.gkT, b = line(65);
      return [`${G.yearCN(s.year)}年${s.year < 2003 ? '七' : '六'}月。${GK[s.cohort].lead}`, s.f.gkT === 'none' ? `你考了 ${line(v)} 分，没有过线。` : `你考了 ${line(v)} 分，一本线 ${b} 分。按往年的线，你能上${TIER[T][0]}。`, s.f.gkT === 'none' ? '' : '你把志愿表摊在桌上。选学校只要看分数，选专业要猜四年以后的世界。'].filter(Boolean);
    },
    opts: s => {
      gkCalc(s);
      const T = s.f.gkT, list = [];
      if (T !== 'none') GK[s.cohort].o.forEach(([k, t, g, tag, d]) => list.push({ id: k, t, g, d, c: tag === 'c', x: tag === 'x', z: tag === 'z', lock: () => gkLock(k, T), do: s => enroll(s, k, T) }));
      if (!s.f.retake) list.push({ id: 'retake', t: '不去了，复读一年', c: T === 'none', g: T === 'none' || T === 'zhuan' ? B : S, d: ['cost'], do: s => { s.f.retake = 1; G.acad(s, 6); G.hp(s, -2); G.later(s, s.year + 1, 'gk2'); return s.year === 1998 ? '你回到复读班。你还不知道，第二年高校会扩招近一半。' : '你回到高三的教室。这一年比上一年更长。'; } });
      list.push({ id: 'work', t: T === 'none' ? '不考了，去打工' : '不读了，去挣钱', c: T === 'none' && !!s.f.retake, x: 1, g: T === 'none' ? P : S, d: ['cost'], do: s => { s.track = 'out'; s.inSchool = false; s.f.out = 1; return '你把录取通知书放进抽屉，上了火车。'; } });
      return list;
    },
    lesson: s => ({ 1980: '1998 年是一个大转折：福利分房结束，互联网起步，入世在望。土木和计算机后来都吃了二十年红利。', 1985: '“二十一世纪是生命科学的世纪”是那几年最流行的话，生化环材后来成了就业最难的方向之一。泡沫破裂时入行，往往能赶上下一轮。', 1990: '2012 年前后毕业的计算机学生，正好接上移动互联网。新闻传播的黄金时代那时已经快结束了。', 1995: '师兄的工资是过去的数据，你要看的是四年后的需求。电气和计算机后来接上了新能源和 AI。', 2000: '2018 年的中兴事件是一个信号：半导体从此是国家级的长期投入。金融和土木的高薪是上一轮周期的余温。', 2005: '最热的专业往往已经反映在分数里。算力和新能源要用电，电网和储能的长期需求是能算出来的。', 2010: '推演：单一技能容易被 AI 覆盖，懂一个具体行业又会用 AI 的人更难替代。少子化会先冲击师范就业。' })[s.cohort],
    src: [['统计', '历年高考报名与录取人数来自教育部公开数据；1998 年约 320 万报名、108 万录取，2025 年报名 1335 万，2026 年 1290 万。']]
  });

  N({
    id: 'zz_out', y: 1998, p: 90, dom: 'ye', title: '分配取消', when: s => s.track === 'zz', era: '中专分配取消',
    text: ['一九九八年，你中专毕业。学校说，今年起不包分配了，自谋出路。', '和你同届上高中的同学，正在填大学志愿。'],
    opts: [
      { t: '回老家托人等分配，总会有办法的', z: 1, c: 1, g: S, d: ['trend', 'cost'], do: s => { s.inSchool = false; G.job(s, 'clerk', .6); s.tier = 3; return '你等了一年，进了县里一家效益不好的厂。'; } },
      { t: '南下打工，晚上报自学考试拿大专', g: B, d: ['long', 'cost'], do: s => { s.inSchool = false; G.job(s, 'labor', .75); s.edu = 2; s.tier = 2; G.seed(s, 'night', '打工时读完了自考'); return '你在东莞的宿舍里背《高等数学》。四年后，你拿到了大专文凭。'; } },
      { t: '学一门真手艺，电工或者模具', g: B, d: ['long'], do: s => { s.inSchool = false; G.job(s, 'tech', .8); G.seed(s, 'craft', '中专后又学了手艺'); return '师傅说，机器不会骗人。'; } }
    ],
    lesson: '政策窗口关上的时候，最贵的动作是等它再打开。'
  });

  N({
    id: 'u_first', age: 19, p: 90, dom: 'xue', title: '大学的第一个学期', when: s => s.inSchool && s.uni,
    text: s => [`${G.yearCN(s.year)}年。没有人再管你几点睡。`, s.cls === 'A' ? '你第一次见到有人用笔记本电脑记笔记。室友家里的东西你都没见过。' : '室友开始连夜打游戏，学生会在招新。'],
    opts: s => [
      { t: '泡图书馆，把一门想学的东西学到底', g: B, d: ['long'], do: s => { if (s.major === 'cs' || s.cohort >= 2000) G.seed(s, 'code', '大学泡图书馆学编程'); else G.seed(s, 'english', '大学啃原版书'); G.acad(s, 5); return '你发现没有人检查的时候，学东西反而快。'; } },
      { t: '进学生会，当干部、攒人脉', c: 1, do: s => { G.seed(s, 'network', '大学里混学生会'); return '你学会了敬酒和写通知。'; } },
      { t: '和室友通宵打游戏', c: 1, x: 1, g: S, d: ['self'], do: s => { G.acad(s, -6); return '绩点掉得很快。你们的友谊很牢固。'; } },
      { t: '做家教、卖电话卡，先把生活费挣了', z: 1, g: s => (s.cls === 'A' ? B : P), do: s => { G.money(s, G.w(s, .12)); G.seed(s, 'hustle', '大学勤工俭学'); return '你第一次不用向家里要钱。'; } },
      { t: '写公开的读书笔记，每周一篇', need: ['read', 'writing'], g: M, d: ['long'], do: s => { G.pay(s, ['writing', 'read'], '小时候读过的书，变成了你写东西的底气'); G.seed(s, 'writing', '大学起坚持公开写作'); return '开始只有三个人看。你把这件事坚持了下来。'; } }
    ],
    lesson: '大学是一生中最便宜的试错期。没人检查的四年最能看出一个人怎样分配时间。'
  });

  N({
    id: 'u_loan', y: [2015, 2017], p: 80, dom: 'cai', title: '分期买手机', when: s => s.inSchool && s.uni, d: ['law', 'prob'],
    text: ['校园里到处是贴纸：“凭学生证，当天放款。”', '室友新换了 iPhone，说每个月只要还几百块。'],
    quiz: { type: 'clause', q: '放款页面是这样写的。点一下你觉得最危险的那一条。', from: '某校园分期 App', opts: ['借款 5000 元，手续费 0 元', '周息 2%，按周计息，到期一次还本', '逾期后，平台有权通知你的通讯录联系人', '需上传手持身份证照片'], a: 1, ok: '周息 2% 折合年化超过 100%。“0 手续费”是把成本藏在了周息里。', no: '最贵的一条是周息 2%：折合年化超过 100%。通讯录和手持照也是后面催收的筹码。' },
    opts: [
      { t: '借。每月才几百块，下学期做家教就还上了', c: 1, x: 1, g: H, d: ['prob'], do: s => { G.money(s, -G.w(s, .5)); G.hp(s, -5); G.fam(s, -8); return '五千变成了两万三。你开始拆东墙补西墙，你妈收到了催收短信。'; } },
      { t: '不借', g: B, z: 1, r: '室友的手机很好看。半年后他开始找你借钱。' },
      { t: '当校园代理，推荐一个同学返两百，自己不用借钱', x: 1, g: S, d: ['law'], do: s => { G.money(s, G.w(s, .05)); G.fam(s, -4); return '你赚了几千块，也把几个同学带进了坑。2017 年，校园网贷被叫停。'; } }
    ],
    lesson: '把周息换算成年化，这件事初中数学就够。2016 年“裸条”事件后，监管在 2017 年叫停了校园网贷。',
    src: [['制度', '2017 年 5 月，银监会等三部门发文，未经批准的机构不得提供校园贷服务。']]
  });

  N({
    id: 'u_intern', age: 21, p: 90, dom: 'ye', title: '大三的暑假', when: s => s.inSchool && s.uni,
    text: s => ['同学分成了三拨：考研的、考公的、实习的。', s.cls === 'A' ? '你算过了，去大城市实习的房租要家里出。' : '你爸说他可以帮你问问。'],
    opts: s => [
      { t: '去一家真实的公司实习，哪怕只有一点工资', g: B, d: ['info'], lock: s => (s.uni === 'zhuan' ? ['时机', '这家公司只招本科以上。'] : null), do: s => { G.seed(s, 'intern', '大三去公司实习'); G.money(s, -G.w(s, .04)); return '你发现公司里的事和书上不一样。下班时，你终于知道自己不想干什么了。'; } },
      { t: '报“名企内推实习营”，三万块，保证进大厂项目', x: 1, g: S, d: ['info'], lock: s => (s.cls === 'A' ? ['家境', '三万块是家里两年的收入。'] : null), do: s => { G.money(s, -G.w(s, .3)); return '结课证书上盖着一个你没听过的公司的章。'; } },
      { t: '跟着老师做一个真项目', need: ['math', 'code'], g: M, d: ['long'], do: s => { G.pay(s, ['math', 'code'], '因为底子在，老师才愿意带你做这个项目'); G.seed(s, 'project', '大学跟老师做了真项目'); G.acad(s, 4); return '第一次有人为你写的东西付钱。'; } },
      { t: '回家休息，下学期再说', c: 1, z: 1, r: '夏天过得很快。' }
    ],
    lesson: '实习的价值是让你用很低的成本看到真实世界。花钱买来的“经历”，招聘的人一眼能看出来。'
  });

  N({
    id: 'u_ai', y: [2023, 2034], p: 70, dom: 'xue', title: '论文和 AI', when: s => s.inSchool && s.uni && s.age >= 19, d: ['long', 'self'],
    text: s => [`${G.yearCN(s.year)}年。同学的课程论文都是 AI 写的。老师也用 AI 批。`, '学校规定写得不清不楚。这学期的课你可以全部混过去。'],
    opts: [
      { t: '全部交给 AI，省下来的时间打游戏', c: 1, x: 1, g: S, do: s => { G.acad(s, -6); return '你的绩点很高。面试官问你论文里的一个公式，你答不上来。'; } },
      { t: '用 AI 当陪练：先自己写，再让它反驳', g: M, need: ['ailearn', 'read', 'code', 'math'], do: s => { G.pay(s, ['ailearn', 'read', 'code', 'math'], '早年的底子让你看得出 AI 哪里在胡说'); G.seed(s, 'ai', '学会了让 AI 反驳自己'); G.acad(s, 5); return '你开始能分辨它什么时候在胡说。这个能力比什么都值钱。'; } },
      { t: '用它做一个能跑起来的小工具，放到网上', g: M, need: ['code'], do: s => { G.pay(s, 'code', '会写代码的人，用 AI 能做出完整的东西'); G.seed(s, 'ai', '大学时用 AI 做出过产品'); return '有两百多人在用。这个链接比成绩单好用。'; } },
      { t: '老老实实不用，学校没说可以', z: 1, r: '你学得扎实，只是写得慢。毕业后，招聘要求里写着“熟练使用 AI 工具”。' }
    ],
    lesson: 'AI 把写东西的成本打到接近零，判断好坏的能力就更值钱。用它代替思考，你会被它替代；用它挑战自己，它会放大你。'
  });

  /* 毕业 */
  const indG = (k, y) => ({
    cs: y < 2006 ? B : y <= 2016 ? M : y <= 2021 ? B : P, civil: y <= 2014 ? B : y <= 2019 ? P : S, fin: y <= 2016 ? B : y <= 2020 ? P : S, media: y <= 2008 ? P : S,
    ee: B, ic: y >= 2019 ? M : B, ai: y >= 2018 ? M : B, aix: M, bio: P, mech: P, med: B, normal: y >= 2030 ? S : B, intl: y <= 2007 ? B : P, law: B, lang: y >= 2023 ? S : P, robo: M, nurse: B
  })[k] || P;

  N({
    id: 'grad', p: 92, dom: 'ye', title: '毕业', when: s => s.inSchool && s.uni && s.gradY === s.year && !s.f.gradDone, d: ['cost', 'trend'],
    text: s => [`${G.yearCN(s.year)}年，你${G.ageCN(s.age)}岁，毕业了。`,
    s.year <= 2003 ? '人才市场里人挤人，单位还在挑。' : s.year <= 2012 ? `这一年全国毕业生 ${s.year <= 2008 ? '五六百' : '六七百'} 万。师兄说，先进一个大平台。` : s.year <= 2019 ? '这一年全国毕业生七八百万。招聘 App 的红点一直没停过。' : s.year <= 2026 ? '这一年全国毕业生超过一千万。投了一百份简历，三个回复。' : '推演：入门岗位的数量比十年前少了很多，招聘要求里写着“能独立带 Agent 完成项目”。',
    s.f.gap ? '你已经比同学晚了一年。' : ''].filter(Boolean),
    opts: s => {
      const m = MAJOR[s.major], boost = TIER[s.uni][1], y = s.year, list = [];
      const base = XZ.JOBS[m.job].mult * (m.m || 1);
      list.push({
        id: 'ind', t: `干本行：去${G.tierName(m.t)}做${XZ.JOBS[m.job].n}`, g: indG(s.major, y), c: 1,
        lock: s => (m.job === 'lawyer' && s.uni === 'zhuan' ? ['分数', '要先过法考。'] : null),
        do: s => {
          let mult = base * boost; if (G.has(s, 'intern')) mult *= 1.08; if (G.has(s, 'project')) { mult *= 1.15; G.pay(s, 'project', '那个项目成了你简历上最硬的一行'); }
          if (y > 2026 && (m.job === 'dev' || m.job === 'clerk') && !G.has(s, 'ai') && G.roll(s, .5)) { G.nojob(s); s.inSchool = false; s.f.gap = 1; return '投了半年，岗位越来越少。没有拿到 offer。'; }
          G.job(s, m.job, mult); s.tier = m.t; return `你入职了，第一年税前约 ${G.fmt(G.w(s, mult))}。`;
        }
      });
      list.push({
        id: 'gov', t: '考公务员或事业编', g: y >= 2021 ? B : P, z: 1, c: y >= 2020, d: ['cost'],
        do: s => {
          const p = .22 + (RANK.indexOf(s.uni) >= 4 ? .16 : 0) + (s.acad > 65 ? .1 : 0);
          if (G.roll(s, p)) { G.job(s, 'gov', 1.15); s.tier = 3 - (s.uni === 'top' || s.uni === 'c9' ? 1 : 0); s.tier = Math.max(2, s.tier); return '你上岸了。第一天上班，科长让你先熟悉一下环境。'; }
          G.nojob(s); s.inSchool = false; s.f.gap = 1; s.f.kaogong = (s.f.kaogong || 0) + 1; return '差了几分。竞争最激烈的岗位，几百个人争一个。';
        }
      });
      if (s.uni !== 'zhuan') list.push({
        id: 'pg', t: '考研，再读三年', c: y >= 2018, g: y < 2012 ? B : y <= 2019 ? P : s.major === 'cs' || s.major === 'ic' || s.major === 'ai' ? B : P, d: ['cost'],
        do: s => {
          const p = .35 + (s.acad > 60 ? .25 : 0);
          if (G.roll(s, p)) { s.f.master = 1; s.edu = 4; s.gradY = s.year + 3; G.acad(s, 2); return '你考上了。又可以三年不用想这些事。'; }
          G.nojob(s); s.inSchool = false; s.f.gap = 1; return '差了几分。这一年你没有收入，也没有简历。';
        }
      });
      if (y >= 2011 && y <= 2020 && s.major !== "cs" && s.major !== "ic") list.push({ id: 'peixun', t: '去校外培训机构当老师，收入比公立学校高一倍', c: 1, x: 1, g: y <= 2016 ? B : S, d: ['trend'], do: s => { G.job(s, 'edu', 1.6 * boost); s.tier = 2; return '你一个暑假讲了三百节课，嗓子哑了，工资条很好看。'; } });
      list.push({ id: 'home', t: '回老家，进亲戚介绍的单位', z: 1, g: P, d: ['cost'], do: s => { G.job(s, s.cls === 'A' ? 'clerk' : 'soe', s.cls === 'A' ? .85 : 1); s.tier = 3; s.f.atHome = 1; s.f.nearPa = 1; G.fam(s, 6); return '工资不高，晚饭在家吃。你爸妈很高兴。'; } });
      list.push({ id: 'abroad', t: '出国读书', lock: s => (['D', 'E', 'F'].includes(s.cls) || (G.has(s, 'english') && G.has(s, 'math') && s.uni !== 'er') ? null : ['家境', '一年学费和生活费超过家里十年的积蓄。']), g: y < 2018 ? B : P, d: ['cost'], do: s => { if (!['D', 'E', 'F'].includes(s.cls)) G.pay(s, ['english', 'math'], '英语和数学让你拿到了全额奖学金'); else G.money(s, -G.w(s, 3)); G.seed(s, 'english', '出国读书'); s.edu = 4; s.f.master = 1; s.f.overseas = 1; s.gradY = s.year + 2; return '你在异国超市里第一次独自买菜。'; } });
      list.push({
        id: 'start', t: '不找工作了，和同学创业', x: 1, g: s => (G.has(s, 'code') && y >= 2009 && y <= 2015 ? B : S), d: ['prob'],
        do: s => {
          const ok = G.roll(s, .12 + (G.has(s, 'code') ? .12 : 0) + (G.has(s, 'hustle') ? .08 : 0) + (y >= 2009 && y <= 2015 ? .1 : 0));
          if (ok) { G.job(s, 'boss', 2.2); G.biz(s, '校园创业公司', G.w(s, 4)); s.tier = 1; return '你们活下来了。融到一笔钱，招了十个人。'; }
          G.money(s, -G.w(s, .8)); G.nojob(s); s.inSchool = false; s.f.gap = 1; return '一年半后，账上没钱了。你们把桌椅卖给了楼下公司。';
        }
      });
      list.forEach(o => { const f = o.do; o.do = s => { s.f.gradDone = 1; return f(s); }; });
      return list;
    },
    lesson: s => (s.year <= 2016 ? '第一份工作决定你在哪个行业积累。互联网和金融此时都在向上走，毕业头几年选行业比选公司重要。' : s.year <= 2026 ? '找工作难的年份，稳定岗位的竞争也最激烈。要算清楚的是：这一年的空窗和这个岗位能带来的技能，哪个更贵。' : '推演：入门岗位最先被 AI 压缩。手里有作品的人，比只有成绩单的人更容易过这一关。'),
    src: [['统计', '全国普通高校毕业生：2012 年约 680 万，2022 年 1076 万，2026 年 1270 万。']]
  });

  N({
    id: 'grad2', p: 92, dom: 'ye', title: s => (s.f.overseas ? '留下，还是回去' : '研究生毕业'), d: ['cost', 'trend'], when: s => s.inSchool && s.uni && s.gradY === s.year && s.f.gradDone && !s.f.phd,
    text: s => (s.f.overseas ? [`${G.yearCN(s.year)}年，你拿到了海外的学位。`, s.year >= 2018 ? '工作签证一年比一年难办。国内的朋友说，现在机会都在国内。' : '同学一半留下，一半回国。你爸妈没有说话，只问你过年回不回来。'] : [`${G.yearCN(s.year)}年，你${G.ageCN(s.age)}岁，研究生毕业。`, '三年过去，本科同学有的已经带团队了。导师问你下一步的打算。']),
    opts: s => {
      const m = MAJOR[s.major], y = s.year, base = XZ.JOBS[m.job].mult * (m.m || 1) * TIER[s.uni][1] * 1.2;
      if (s.f.overseas) return [
        { t: '留在当地工作，先把工作签证办下来', g: y <= 2016 ? B : P, d: ['cost'], do: s => { G.job(s, m.job, base * 1.35); s.tier = 1; G.fam(s, -8); return '你每周和家里视频一次。爸妈的头发在屏幕里一点点变白。'; } },
        { t: '回国，进大厂的国际业务或外企', c: 1, g: y >= 2019 ? M : B, d: ['trend'], do: s => { G.job(s, 'trade', Math.max(1.7, base), '国际业务经理'); s.tier = 1; G.seed(s, 'foreign', '留学后做国际业务'); return '你的简历在这里正好稀缺。'; } },
        { t: '回省会，留学生落户和人才补贴都能拿到', z: 1, g: B, d: ['info'], do: s => { G.job(s, m.job, base * .9); s.tier = 2; G.money(s, G.w(s, .4)); G.fam(s, 6); return '补贴到账那天，你给爸妈买了张高铁票。'; } }
      ];
      return [
        { t: '校招去做研发，这三年的项目就是敲门砖', c: 1, g: indG(s.major, y), d: ['long'], do: s => { if (G.has(s, 'project')) G.pay(s, 'project', '本科时跟老师做的项目，一直做到了研究生'); G.job(s, m.job, base); s.tier = m.t; return `你的起薪约 ${G.fmt(G.w(s, base))}，比本科同学当年高出一截。`; } },
        { t: '去二线城市的龙头企业当技术骨干，房价低，升得快', z: 1, g: B, d: ['cost'], do: s => { G.job(s, m.job, base * .95); s.tier = 2; return '入职第二年，你开始带人。周末能回家吃饭。'; } },
        { t: '进央企总部或研究院，工资一般，但能落户', g: P, d: ['cost'], do: s => { G.job(s, 'soe', 1.35); s.tier = 1; return '你分到了一张靠窗的桌子。'; } },
        { t: '继续读博，再走四年', x: 1, g: y >= 2018 ? S : P, d: ['cost', 'prob'], do: s => { s.f.phd = 1; s.edu = 5; s.gradY = s.year + 4; return '导师说，学术这条路很长。你点了点头。'; } }
      ];
    },
    lesson: '学历的价值在于换到了什么位置。多读的几年也有成本：同龄人的工龄、房价和你的年龄都在走。'
  });
  N({
    id: 'grad3', p: 92, dom: 'ye', title: '非升即走', when: s => s.inSchool && s.f.phd && s.gradY === s.year,
    text: s => [`${G.yearCN(s.year)}年，你${G.ageCN(s.age)}岁，博士毕业。`, '你进了一所高校，合同写着六年内评不上副教授就走人。'],
    run: s => { G.job(s, 'teacher', 1.35, '高校青年教师'); s.tier = 2; G.hp(s, -3); return ['你第一次有了自己的办公室，和一张写满论文指标的表。']; }
  });

  N({
    id: 'x_kg', p: 87, dom: 'ye', title: '再考一年吗', d: ['cost', 'prob'], when: s => !s.job && !s.inSchool && (s.f.kaogong || 0) >= 1 && s.age <= 34 && !s.seal,
    quiz: { type: 'calc', q: '你报的岗位竞争比是 60 比 1。按平均水平算，连考三年都考不上的概率大约是多少？', opts: ['约 50%', '约 70%', '约 95%', '约 99.9%'], a: 2, ok: '约 95%。每年的机会很小，时间却是确定的成本。', no: '约 95%：(59/60)³。每年的机会很小，时间却是确定的成本。' },
    text: ['成绩出来了，差了几分。同学已经工作一年了。', '你爸说：再考一年吧，书都看了这么久，放弃太可惜。'],
    opts: s => [
      { t: '全职再考一年，这一年的书不能白看', c: 1, g: S, do: s => { if (G.roll(s, .2)) { G.job(s, 'gov', 1.1); return '这一次你上岸了。你比同学晚了两年。'; } G.job(s, s.edu >= 2 ? 'clerk' : 'svc', .8); return '还是差了一点。你去了一家小公司，比应届生大两岁。'; } },
      { t: '先找份工作，下班再看书', z: 1, g: B, do: s => { G.job(s, s.edu >= 2 ? 'clerk' : 'svc'); if (G.roll(s, .1)) { G.job(s, 'gov', 1.1); return '一边上班一边考，第二年你居然考上了。'; } return '书慢慢看不下去了，工作倒是越来越顺手。'; } },
      { t: '把这条路放下，用备考的时间学一门能用的本事', g: B, do: s => { G.job(s, s.edu >= 2 ? 'clerk' : 'svc', .85); G.seed(s, 'ai', '放弃考公后学了新本事'); return '把书卖掉的那天你有点难过，第二天早上起来松了口气。'; } }
    ],
    lesson: '已经投入的时间拿不回来，它不该影响下一步。要比较的是这一年全职备考的胜率，和这一年工作能带来的东西。'
  });

  N({
    id: 'x_nojob', p: 85, dom: 'ye', title: '空窗期', when: s => !s.job && !s.inSchool && s.age >= 18 && s.age <= 60,
    text: s => [`${G.yearCN(s.year)}年，你${G.ageCN(s.age)}岁，没有工作。`, s.seal ? '你有过案底，很多单位的背景调查过不去。' : '存款在一点点变少。你爸妈开始小心地问你的打算。'],
    opts: s => [
      { t: '先去送外卖或开网约车，把现金流接上', z: 1, c: 1, only: s => s.year >= 2014, g: B, d: ['cost'], do: s => { G.job(s, 'rider'); return '你第一天跑了十一个小时。'; } },
      { t: '进工厂或者服务业，先干着', z: 1, c: 1, only: s => s.year < 2014, g: B, d: ['cost'], do: s => { G.job(s, s.age < 32 ? 'labor' : 'svc'); return '工资不多，至少每个月有了。'; } },
      { t: '找一份普通文员的工作', lock: s => (s.edu < 2 ? ['分数', '要求大专以上学历。'] : s.seal ? ['制度', '背景调查没有通过。'] : null), do: s => { G.job(s, 'clerk'); return '工作很无聊，但社保续上了。'; } },
      { t: '用手上的本事接活，自己干', need: ['code', 'craft', 'video', 'ecom', 'writing', 'ai'], g: M, d: ['long'], do: s => { const k = ['ai', 'code', 'craft', 'ecom', 'video', 'writing'].find(x => G.has(s, x)); G.pay(s, k, '当年不起眼的本事，这时候成了饭碗'); G.job(s, 'boss', 1.2, '自由职业者'); return '第一个月的收入比上班少。第六个月，比上班多。'; } }
    ],
    lesson: '空窗期最怕现金流断了以后乱下注。先止血，再找机会。手上有东西的人，失业时的选项多得多。'
  });
  N({
    id: 'x_nojob2', p: 85, dom: 'ye', title: s => (s.age >= 40 ? '四十岁以后的简历' : '又一次重新开始'), d: ['cost', 'self'], when: s => !s.job && !s.inSchool && s.age >= 19 && s.age <= 60 && s.done.x_nojob,
    text: s => [`你${G.ageCN(s.age)}岁，第二次没了工作。`, s.age >= 40 ? '招聘软件上写着三十五岁以下。你爸妈老了，孩子还在上学。' : '这一次你没有慌，但存款比上次少。'],
    opts: s => [
      { t: s.tier < 3 ? '搬回小城，把开销降到原来的三分之一' : '托人去县里的工地或物流园，先把家撑住', z: 1, c: 1, d: ['cost'], do: s => { G.job(s, 'svc', .75); s.tier = 3; G.fam(s, 4); return '工资少了一半，开销少得更多。'; } },
      { t: '去上政府补贴的技能培训，学电工或护理', g: B, d: ['long'], do: s => { if (s.age % 2) G.seed(s, 'craft', '失业后学了电工'); else G.seed(s, 'care', '失业后学了护理'); G.job(s, 'tech', .75, '技工学徒'); return '班上你年纪最大。老师说，你至少不会迟到。'; } },
      { t: '降薪进一个还在增长的行业，从头学起', g: B, d: ['trend'], lock: s => (s.seal ? ['制度', '背景调查没有通过。'] : s.edu < 2 ? ['分数', '要求大专以上学历。'] : null), do: s => { G.job(s, 'office', .9); return '你的主管比你小七岁。'; } },
      { t: '把这些年的客户和作品重新捡起来', need: ['second', 'gzh', 'short', 'ecom', 'network', 'foreign'], g: M, d: ['long'], do: s => { G.pay(s, ['second', 'gzh', 'short', 'ecom', 'network', 'foreign'], '你以为那些老关系没用了，它们还在'); G.job(s, 'boss', 1.3, '个体经营者'); return '你发了一条消息，第二天就有人回。'; } }
    ],
    lesson: '中年失业时，开销、技能和人脉三条线要一起看。先把开销降下来，才有时间换赛道。'
  });
  N({
    id: 'x_nojob3', p: 85, repeat: true, dom: 'ye', title: '零工', when: s => !s.job && !s.inSchool && s.age >= 19 && s.age <= 62 && s.done.x_nojob2,
    text: s => [`${G.yearCN(s.year)}年，你${G.ageCN(s.age)}岁。这几年你换了几份零工，保安、仓库、代驾都干过。`],
    run: s => { G.job(s, 'svc', .7, '零工'); return ['活不稳定，但你已经知道怎么活下去。']; }
  });

  /* 不走高考的路 */
  N({
    id: 'w_first', p: 88, dom: 'ye', title: s => (s.track === 'voc' ? '职校毕业' : '第一份工'), when: s => (s.f.out || (s.track === 'voc' && s.gradY === s.year)) && !s.job && !s.f.wfirst && s.age >= 16,
    text: s => [`${G.yearCN(s.year)}年，你${G.ageCN(s.age)}岁。`, s.track === 'voc' ? '学校把你们送进了一家电子厂实习，线长说这批孩子不如以前能吃苦。' : '老乡带你到了厂门口。招工的人看了看你的手。', '另一个老乡说，他有个门路，三个月就能翻身。'],
    opts: s => [
      { t: '进厂，先干流水线', c: 1, z: 1, do: s => { s.f.wfirst = 1; s.inSchool = false; G.job(s, 'labor'); s.tier = 2; return '一天站十一个小时。第一个月工资到手，你给家里寄了一半。'; } },
      { t: '跟师傅学电工或焊工，前两年工资很低', g: M, d: ['long', 'cost'], do: s => { s.f.wfirst = 1; s.inSchool = false; G.job(s, 'tech', .7); G.seed(s, 'craft', '跟师傅学了真手艺'); return '师傅话很少，只让你看。一年后，他让你上手。'; } },
      { t: '跟老乡去外地做“国家扶持的大项目”，入门三千八，三个月回本', x: 1, g: H, d: ['law', 'prob'], do: s => { s.f.wfirst = 1; s.inSchool = false; G.job(s, 'svc', .4); G.money(s, -G.w(s, .3)); G.hp(s, -8); G.fam(s, -12); G.crime(s, { k: 'mlm', name: '组织、领导传销活动', law: '《刑法》第二百二十四条之一', p: .1, term: 1, gain: 0 }); return '你住进了合租屋，每天听课，然后打电话给亲戚。老师说，你只是还没有想通。'; } },
      { t: '当兵，两年后再说', only: s => s.age <= 22, lock: s => (s.gender === 'F' ? ['性别', '女兵名额很少，你们县今年一个也没有。'] : null), g: B, d: ['long'], do: s => { s.f.wfirst = 1; s.inSchool = false; G.job(s, 'labor', .75); G.hp(s, 6); G.setf(s, 'exercise'); G.seed(s, 'soldier', '当过兵'); return '你第一次出省。两年后回来，腰板是直的。'; } }
    ],
    lesson: '年轻时最值钱的是一门越老越值钱的手艺。一边是立刻能拿到的钱，一边是师傅手里的东西。“三个月翻身”永远是别人赚你。',
    src: [['制度', '组织、领导传销活动罪：《刑法》第二百二十四条之一。']]
  });

  N({
    id: 'w_night', age: [21, 27], p: 71, dom: 'xue', title: '夜校', when: s => s.edu <= 1 && s.job && !s.f.nightDone,
    text: s => ['下班以后，宿舍的人在打牌。', s.year < 2010 ? '厂门口贴着一张夜校的招生启事。' : '手机上有免费的公开课，还有成人本科的广告。'],
    opts: s => [
      { t: '报名自考，每天学两个小时', g: B, d: ['long'], do: s => { s.f.nightDone = 1; s.edu = 2; G.seed(s, 'night', '打工时读完了自考'); G.hp(s, -3); return '四年，你拿到了文凭。主管换了三任，你是唯一一个从线上升上来的。'; } },
      { t: '考电工证、焊工证，一证一证往上走', g: M, d: ['long'], do: s => { s.f.nightDone = 1; G.seed(s, 'craft', '一证一证考上去'); G.bump(s, 1.25); return '证书不好看，但工资单好看。'; } },
      { t: '先歇歇，白天已经够累了，文凭也不一定有用', c: 1, do: s => { s.f.nightDone = 1; return '这一年很快过去了。'; } }
    ],
    lesson: '学历和证书的回报不会立刻到账。下班后的两个小时，是普通人最便宜的杠杆。'
  });
})(typeof window !== 'undefined' ? window : globalThis);
