/* 买房、结婚、生育、父母、身体：一生都绕不开的棋 */
(function (root) {
  'use strict';
  const XZ = root.XZ, N = XZ.N, G = XZ.G;
  const { M, B, P, S, H } = G.GR;

  /* 买房：账本共用，但每个时期都是不同的局面，选项不重复 */
  const ledger = s => { const t = s.tier, p = G.housePrice(t, s.year), r = G.rate(s.year), pay = p * .7 * r / (1 - Math.pow(1 + r, -30)) / 12; return { from: `你的账本，${G.tierName(t)}`, lines: [`九十平总价约 ${G.fmt(p)}，首付三成 ${G.fmt(p * .3)}，月供约 ${G.fmt(pay)}。`, `手上有 ${G.fmt(Math.max(0, s.cash))}，${G.aid(s) > .1 ? `家里能帮 ${G.fmt(G.aid(s))}` : '家里帮不上忙'}，年收入约 ${G.fmt(G.income(s) * .85)}（税后）。`] }; };
  const can = (s, t, k, down) => { k = k || 1; down = down || .3; const p = G.housePrice(t, s.year) * k, need = p * (down + .03), r = G.rate(s.year), pay = p * (1 - down) * r / (1 - Math.pow(1 + r, -30)), have = Math.max(0, s.cash) + G.aid(s); if (need > have) return ['家境', `首付还差 ${G.fmt(need - have)}。`]; if (pay > G.income(s) * .62) return ['时机', '月供超过收入的六成，银行不批。']; return null; };
  const buy = (s, t, k, down, msg) => { const r = G.buyHouse(s, t, down || .3, k); s.f.houseY = s.year; s.f.atHome = 0; return typeof msg === 'function' ? msg(r) : msg; };
  const pass = (s, msg) => { s.f.houseY = s.year; return msg; };
  const own = s => s.houses.length > 0;
  function houseNode(id, y, title, era, head, opts, lesson, src, quiz) {
    N({ id, y, p: 63, dom: 'cai', title, era, d: ['lever', 'trend'], quiz, doc: ledger, text: s => [head(s)], opts,
      when: s => s.job && s.age >= 23 && s.houses.length < 2 && s.jail <= s.year && !s.inSchool && !(s.f.houseY && s.year - s.f.houseY < 4) && (!s.houses.length || s.cash > G.housePrice(s.tier, s.year) * .3), lesson, src });
  }
  houseNode('h_05', [2003, 2007], '第一套房', '住房市场化', s => `${G.yearCN(s.year)}年。身边的同事开始买房，也有人说房价已经到顶了。`, s => [
    { t: '买市区的老小区，小一点，上班走路就到', g: s.tier === 1 ? M : B, c: 1, lock: () => can(s, s.tier), do: s => buy(s, s.tier, 1, .3, '墙皮有点掉，地段没得挑。') },
    { t: '买远郊的新盘，同样的钱面积大一倍，听说要通地铁', x: 1, g: s.tier === 1 ? B : P, lock: () => can(s, s.tier, .65), do: s => buy(s, s.tier, .65, .3, '每天通勤两个小时。阳台能看见一片工地。') },
    { t: '先不买，这价格已经离谱了，等它跌回来', z: 1, g: S, do: s => pass(s, '你把看房的传单折起来，夹进了杂志。') }
  ], '2003 到 2007 年的房价收入比还不算离谱。住房按揭是普通人一生中能拿到的最便宜、最长期的杠杆，通胀替你还了大半。');
  houseNode('h_09', [2008, 2010], '七折利率', '2008 年四万亿刺激', s => `${G.yearCN(s.year)}年。金融危机之后房价跌了一点。首付降到两成，房贷利率打七折。`, s => [
    { t: '趁政策最好的时候出手，首付两成', g: M, lock: () => can(s, s.tier, 1, .2), do: s => buy(s, s.tier, 1, .2, r => `你贷了 ${G.fmt(r.loan)}。邻居说你胆子真大。`) },
    { t: '和爸妈合买，房本上写两代人的名字', g: B, only: () => G.aid(s) > .5, lock: () => can(s, s.tier), do: s => buy(s, s.tier, 1, .3, r => { G.fam(s, 3); return '你爸在合同上签字时，手有点抖。'; }) },
    { t: '报纸说房价要腰斩，现在进场就是接飞刀', z: 1, c: 1, g: S, do: s => pass(s, '你决定再看看。第二年，这个小区涨了六成。') }
  ], '2008 年底的政策是明确的信号：政府需要房价稳住。这时候敢出手需要逆人性，看懂货币放水比看懂楼盘重要。', [['制度', '2008 年 10 月，央行下调首套房首付比例至 20%，利率下限扩大到基准的 0.7 倍。']]);
  houseNode('h_13', [2011, 2014], '限购令', '限购时代', s => `${G.yearCN(s.year)}年。限购令一轮接一轮，新闻说房价要崩了。`, s => [
    { t: '用足公积金贷款，把资格用掉', c: 1, g: s.tier === 1 ? M : B, lock: () => can(s, s.tier), do: s => buy(s, s.tier, 1, .3, '你的公积金账户第一次派上了用场。') },
    { t: '和爱人办假离婚，腾出一个购房名额', x: 1, only: () => own(s) && !!s.spouse, g: S, d: ['law', 'self'], lock: () => can(s, s.tier), do: s => { G.fam(s, -12); if (G.roll(s, .3)) { s.spouse = null; return buy(s, s.tier, 1, .3, '手续办得很顺利。后来，你们没有再去复婚。'); } return buy(s, s.tier, 1, .3, '你们在民政局门口拍了张照，开玩笑说要记得回来。'); } },
    { t: '去隔壁不限购的小城买，高铁通了就值钱', x: 1, g: S, d: ['info'], lock: () => can(s, 3), do: s => buy(s, 3, 1, .3, '开发商的大巴把你们拉去看房。小区晚上亮灯的窗户不多。') },
    { t: '这么调控下去肯定要崩，等崩了再说', z: 1, g: s.tier === 1 ? S : P, do: s => pass(s, '你继续交房租。') }
  ], '限购说明核心城市的需求被压着，不是消失了。人口净流入的城市和人口流出的城市，从这时候开始走上两条路。', null, { type: 'calc', q: '贷款 100 万，30 年，年利率 4.9%，等额本息。三十年一共要付多少利息？', opts: ['约 30 万', '约 60 万', '约 91 万', '约 147 万'], a: 2, ok: '约 91 万。看起来很多，但工资和通胀也在涨。这笔账要和房租、房价一起算。', no: '约 91 万，月供约 5300 元。看起来很多，但工资和通胀也在涨。这笔账要和房租、房价一起算。', d: ['lever'] });
  houseNode('h_16', [2015, 2016], '放水的那两年', '2015 棚改货币化', s => `${G.yearCN(s.year)}年。央行连续降息，棚改的钱在三四线城市涌动。深圳一年涨了五成。`, s => [
    { t: s.tier === 3 ? '跟着拆迁户一起买，县城的新盘也在排队' : '不再观望，抢在下一轮涨价之前签约', c: 1, g: s.tier === 3 ? P : M, lock: () => can(s, s.tier), do: s => buy(s, s.tier, 1, .3, '售楼处的人比菜市场还多。') },
    { t: '首付不够，用中介介绍的“首付贷”凑齐', x: 1, g: S, d: ['law', 'lever'], lock: () => can(s, s.tier, 1, .15), do: s => { G.money(s, -G.w(s, .3)); return buy(s, s.tier, 1, .15, '利息比房贷高三倍。那年三月，监管叫停了首付贷。'); } },
    { t: '涨得这么快，这时候追进去就是接盘', z: 1, g: s.tier === 3 ? P : S, do: s => pass(s, '你觉得大家都疯了。') }
  ], '2015 至 2016 是这轮周期最后一次大放水。一线和强二线吃到了最大的涨幅，三四线靠棚改回光返照。', [['制度', '2016 年 3 月，监管部门叫停“首付贷”。']]);
  houseNode('h_18', [2017, 2019], '摇号', '2016 “房住不炒”', s => `${G.yearCN(s.year)}年。“房子是用来住的，不是用来炒的。”新房限价，比二手便宜，售楼处开始摇号。`, s => [
    { t: '交冻资去摇号，中了就比周边便宜两成', c: 1, g: s.tier === 3 ? S : own(s) ? S : P, lock: () => can(s, s.tier, .9), do: s => buy(s, s.tier, .9, .3, '你在摇号大厅听到了自己的号码。') },
    { t: '买海南或环京的度假房，那里还没限购', x: 1, g: S, d: ['info'], lock: () => can(s, 3, 1.6), do: s => buy(s, 3, 1.6, .3, '销售说这里以后是下一个三亚。你一年来住四天。') },
    { t: own(s) ? '一套够住，把钱留给孩子和自己的学习' : '先把钱用在提升收入上，房子以后再说', z: 1, g: own(s) ? B : P, do: s => pass(s, '这一年你没有再去看房。') }
  ], '这时候自住刚需可以买，但投资的逻辑已经变了。人口流出城市的库存最危险，棚改退潮后它们最先掉下来。');
  houseNode('h_21', [2020, 2022], '上车最后一班', '“三道红线”', s => `${G.yearCN(s.year)}年。疫情之后钱很多，核心区涨得最快。朋友说现在不买就永远买不起了。`, s => [
    { t: '买开发商打八五折的期房，这么便宜机会不多', x: 1, c: 1, g: own(s) ? H : S, lock: () => can(s, s.tier, .85), do: s => { s.f.qifang = 1; return buy(s, s.tier, .85, .3, '你选了一个看得见小区花园的楼层，现在那里还是个坑。'); } },
    { t: '加价抢核心区的现房，宁可贵，不能差', g: S, lock: () => can(s, s.tier, 1.15), do: s => buy(s, s.tier, 1.15, .3, r => `你比挂牌价多出了一截，总价 ${G.fmt(r.p)}。`) },
    { t: '算过月供和房租的差，这几年继续租', z: 1, g: B, do: s => pass(s, '朋友说你会后悔的。') }
  ], '“再不买就上不了车”是高点最常见的话。2021 年高位满杠杆入场的人，后面几年承受了最大的回撤。租房在这时是最被低估的选择。', [['统计', '一线城市二手房价格 2021 年后明显回落，2025 年部分城市回到 2016 至 2017 年水平。']]);
  houseNode('h_24', [2023, 2026], '挂牌价', '楼市调整', s => `${G.yearCN(s.year)}年。挂牌价一降再降。首付比例和房贷利率都到了历史最低，年轻人第一次觉得自己买得起。`, s => [
    { t: '只为自住，还价到月供接近房租才成交', g: own(s) ? P : B, lock: () => can(s, s.tier, .88), do: s => buy(s, s.tier, .88, .3, '中介打了七个电话，房东终于松口了。') },
    { t: '去拍法拍房，比市场价便宜两成', x: 1, g: S, d: ['info', 'law'], lock: () => can(s, s.tier, .8), do: s => { if (G.roll(s, .3)) { G.money(s, -G.w(s, .5)); return buy(s, s.tier, .8, .3, '房子里还住着人。你花了半年和一笔钱才把人请走。'); } return buy(s, s.tier, .8, .3, '手续办了四个月，总算拿到了钥匙。'); } },
    { t: '抄底，别人恐惧时我贪婪', only: () => own(s), x: 1, g: S, lock: () => can(s, s.tier), do: s => buy(s, s.tier, 1, .3, '你觉得这次是底。') },
    { t: '人口在减少，这几年不用急着买', z: 1, g: B, do: s => pass(s, '你把钱留在了手上。') }
  ], '这时候买房的理由只剩下住。算租售比，看人口净流入，留够现金流，别再指望涨价替你还贷。', [['统计', '2026 年 6 月，一线城市二手房环比小幅上涨，二三线继续下跌。']], { type: 'calc', q: '一套 300 万的房子，月租 5000 元。一年的租金回报率大约是多少？', opts: ['约 0.5%', '约 2%', '约 5%', '约 8%'], a: 1, ok: '约 2%，低于很多房贷利率。不靠涨价，这笔投资不划算，所以只为自住才买。', no: '约 2%：6 万除以 300 万，低于很多房贷利率。不靠涨价，这笔投资不划算。' });
  houseNode('h_30', [2028, 2034], '人口拐点之后', '住房存量时代', s => `推演：${G.yearCN(s.year)}年。全国的房子早已够住，城市之间的差距越来越大。`, s => [
    { t: '把老房子卖掉，换成离医院和地铁近的小户型', only: () => own(s), g: B, do: s => { const v = G.sellHouse(s, 0); G.buyHouse(s, s.tier, .5, .6); s.f.houseY = s.year; return `旧房卖了 ${G.fmt(v)}。电梯比楼梯好多了。`; } },
    { t: '第一次买房，看中了租赁转售的长租社区', only: () => !own(s), g: P, lock: () => can(s, s.tier, .8), do: s => buy(s, s.tier, .8, .3, '楼下有食堂和托育，都是你这代人需要的东西。') },
    { t: '给爸妈在老家买一套电梯房养老', g: S, lock: () => can(s, 3), do: s => buy(s, 3, 1, .3, '爸妈住了半年，又回了老屋，说那边有人说话。') },
    { t: '不动，把钱留给养老和孩子', z: 1, g: P, do: s => pass(s, '房子已经不再是这局棋的中心了。') }
  ], '推演：人口下降之后，房子的价值回到地段和服务本身。');

  N({
    id: 'l_love', age: [26, 30], p: 78, dom: 'jia', title: s => (s.f.hide ? '又开始看脸色' : '结婚'), d: ['self'],
    when: s => !s.spouse && !s.f.single && s.jail <= s.year && s.age >= 26,
    text: s => [`你${G.ageCN(s.age)}岁，家里开始催了。`, s.f.hide ? '你发现，你总是在关系里先猜对方的心情。这是你小时候练会的本事。' : s.parents === 'fight' ? '你有时会听见自己说话的语气，和你爸一模一样。' : '两家人开始谈彩礼、房子和婚礼。', '你正在和两个人来往：一个条件很好，话不多；一个和你差不多，吵架时能好好说。'],
    opts: s => [
      { t: '选能一起商量事的那个人', g: B, do: s => { s.spouse = { mult: .8 }; G.fam(s, 12); return '你们婚礼办得很小。吵架的第二天，他们会先问你怎么想。'; } },
      { t: '选条件好的那个，日子总归好过', c: 1, do: s => { s.spouse = { mult: 1.3 }; G.fam(s, -8); return '两家都很满意。你们很少吵架，也很少说话。'; } },
      { t: '先去见一次心理咨询师，把爸妈的事情想明白', need: ['read'], only: s => s.parents !== 'harmony', g: M, d: ['self', 'long'], do: s => { G.pay(s, 'read', '躲在书里的那个孩子，终于读懂了自己'); s.spouse = { mult: .9 }; G.fam(s, 20); G.sec(s, 15); G.setf(s, 'cycle'); return '你用了一年。你没有变成你爸妈。这是你这辈子最贵也最值的一笔支出。'; } },
      { t: '借钱办一场体面的婚礼，付足彩礼', x: 1, g: S, d: ['cost'], do: s => { s.spouse = { mult: .85 }; G.money(s, -G.w(s, 1.2)); return '酒席办了三十桌。第一年，你们都在还钱。'; } },
      { t: '不结了，一个人挺好', z: 1, do: s => { G.setf(s, 'single'); return '你跟家里摊牌了。这需要的勇气不比结婚少。'; } }
    ],
    lesson: '婚姻是一生中规模最大的合伙。原生家庭留下的模式，不处理就会传给下一代。这一手看不出高下，几十年后才看得出来。'
  });

  N({
    id: 'l_insure', age: [27, 32], p: 71, dom: 'jia', title: '三百块一个月', d: ['long', 'prob'],
    when: s => s.job && s.jail <= s.year,
    text: ['朋友的爸爸脑梗，住了四十天 ICU，家里的积蓄没了。', '你算了算：给自己和爸妈配齐医保和重疾险，一个月大约三百到五百块。'],
    opts: [
      { t: '买消费型重疾险和百万医疗险，保费花掉就花掉了', g: B, do: s => { G.setf(s, 'ins'); G.money(s, -G.w(s, .03)); return '这笔钱每个月悄悄扣掉。你希望永远用不上。'; } },
      { t: '买分红型理财险，既有保障又有收益，演示年化 6%', c: 1, x: 1, g: S, d: ['info'], do: s => { G.money(s, -G.w(s, .4)); return '第二页写着：演示利率不等于实际收益。退保只能拿回一半。'; } },
      { t: '不买，有医保，保险公司都是骗人的', z: 1, x: 1, g: S, r: '这个月多吃了几顿好的。' }
    ],
    lesson: '保险是用小的确定损失对冲大的不确定损失。它不赚钱，只是防止你从棋盘上被拿掉。保障型和理财型是两回事。'
  });

  N({
    id: 'l_child', age: [29, 34], p: 77, dom: 'jia', title: '要不要孩子', d: ['cost', 'self'], when: s => s.spouse && !s.kids && s.jail <= s.year,
    text: s => ['你们俩算过账：从出生到大学，城市里养一个孩子要几十万到上百万。', s.gender === 'F' ? '上周面试时，对方问你：有生育计划吗？' : '你爸妈说，再不生就晚了。'],
    opts: s => [
      { t: '生一个，好好养', c: 1, do: s => { s.kids = 1; s.kidY = s.year; G.fam(s, 8); if (s.gender === 'F') G.bump(s, .9); return s.gender === 'F' ? '产假回来，你的项目已经交给了别人。' : '你第一次抱他的时候，手是抖的。'; } },
      { t: '不生。把时间和钱留给两个人', z: 1, do: s => { G.setf(s, 'dink'); return '逢年过节有点难熬，其他时候都很好。'; } },
      { t: '再等两年，等事业稳定一点', x: 1, do: s => { s.f.waitKid = 1; return '事业不会稳定的。'; } }
    ],
    lesson: '生不生孩子没有对错，只有代价由谁来承担。这张棋谱不评价这一手。'
  });

  N({
    id: 'l_xuequ', y: [2016, 2021], p: 64, dom: 'cai', title: '学区', d: ['trend', 'lever'], when: s => s.kids > 0 && s.houses.length && s.jail <= s.year && s.tier <= 2,
    text: ['孩子快上小学了。妈妈群里说，好学校的“老破小”一平米十五万，砸锅卖铁也要上。', '置换要多背两百万的贷款。'],
    opts: [
      { t: '换。学区房抗跌，既是教育又是资产', c: 1, x: 1, g: s => (s.year >= 2019 ? S : P), do: s => { G.money(s, -G.w(s, 1.5)); return s.year >= 2019 ? '2020 年起，“多校划片”和教师轮岗相继落地，这套房的溢价一点点消失了。' : '孩子进了好学校。你的工作再也不敢换了。'; } },
      { t: '不换。把钱和时间花在陪孩子读书上', g: B, do: s => { G.fam(s, 6); return '每天晚上二十分钟。这件事便宜得多，也难得多。'; } }
    ],
    lesson: '学区是一种由政策赋予的溢价，政策也能拿走。2021 年教师轮岗和多校划片之后，这笔账变了。家庭环境对孩子的影响，比校门口的牌子大。'
  });

  N({
    id: 'b_family', age: [26, 32], p: 62, dom: 'ye', title: '回来接班', d: ['self', 'trend'], when: s => ['E', 'F'].includes(s.cls) && s.jail <= s.year && !s.inSchool,
    text: s => [`你爸把你叫回了${G.cityN(s)}。`, s.year < 2012 ? '厂子这些年不错，他想把摊子交给你。' : '厂子的利润越来越薄，工人越来越难招。他想把摊子交给你。', '他的朋友们建议再加点杠杆扩大产能。'],
    opts: s => [
      { t: '接下来，趁利率低贷款扩产，把规模做上去', c: 1, x: 1, g: s => (s.year < 2010 ? B : S), d: ['lever'], do: s => { G.job(s, 'boss', 3.2, '二代企业主'); if (s.year >= 2010) { s.estateMul *= .55; G.money(s, -G.w(s, 3)); return '扩产的那条线还没折旧完，订单就走了。工厂成了你身上最大的负债。'; } s.estateMul *= 1.5; return '赶上了最好的几年。'; } },
      { t: '接下来，不扩产，先把账和流程弄清楚', g: B, d: ['info'], do: s => { G.job(s, 'boss', 2.7, '二代企业主'); s.estateMul *= 1.15; return '你发现三成的客户根本不赚钱，砍掉了它们。'; } },
      { t: '卖掉工厂，把钱投到新的方向', need: ['ecom', 'foreign', 'code', 'elec'], g: M, d: ['trend'], do: s => { G.pay(s, ['ecom', 'foreign', 'code', 'elec'], '你在外面攒下的东西，让家业换了一条赛道'); s.estateMul *= 1.6; G.job(s, 'boss', 3.4, '企业主'); return '你爸两个月没和你说话。第五年，他开始和老朋友们炫耀这件事。'; } },
      { t: '不回去，我要走自己的路', z: 1, do: s => { return '你爸挂了电话。厂子几年后卖给了别人。'; } }
    ],
    lesson: '家业是起点，也是路径依赖。“富不过三代”的常见原因不是败家，而是在错的时代用上一代的办法加杠杆。'
  });

  N({
    id: 'b_guar', age: [31, 46], p: 50, dom: 'cai', title: '签个字', d: ['law', 'lever'],
    when: s => s.job && s.jail <= s.year && (s.houses.length > 0 || s.cash > G.w(s, 1)),
    text: ['老同学开了家公司，要贷款，找你做担保。', '“就签个字，走个流程，不用你出一分钱。”'],
    quiz: { type: 'clause', q: '担保合同里，哪一条最值得警惕？', from: '个人保证合同（节选）', opts: ['保证人同意为借款人提供保证', '保证方式为连带责任保证', '保证期间为主债务到期后三年', '本合同一式三份'], a: 1, ok: '连带责任：债务人不还，银行可以直接找你，不必先找他。', no: '连带责任保证最重：债务人不还钱，债权人可以直接要求你还，你的房子和工资都在里面。' },
    opts: [
      { t: '签。认识二十年了，他公司的流水我也看过', c: 1, x: 1, g: H, do: s => { G.money(s, -G.w(s, 2.2)); G.fam(s, -8); return '两年后，他的公司倒了。法院的传票寄到了你家。'; } },
      { t: '不签。私下借他一笔亏了也不心疼的钱', g: M, d: ['lever'], do: s => { G.money(s, -G.w(s, .15)); return '他有点失望。这笔钱后来没有还，你们的朋友也没做成。'; } },
      { t: '直接拒绝', z: 1, g: B, r: '他再也没联系你。' }
    ],
    lesson: '“你不用出钱”的连带担保，是一张面额不限的欠条。真想帮朋友，就给出一个你亏得起的数字。'
  });

  N({
    id: 'l_parent', age: [40, 56], p: 66, dom: 'jia', title: '抢救室外', d: ['long', 'cost'], when: s => s.year >= 2005 && s.jail <= s.year && !s.f.parentDone && s.age >= 41,
    text: s => ['凌晨四点，电话响了。', `你赶回${G.cityN(s)}。医生说，手术加后续治疗要准备 ${G.fmt(G.w(s, 2.4))}，有两成把握。`, s.f.nearPa ? '这些年你就住在他们身边。' : '你已经很久没有回来了。'],
    opts: s => [
      { t: '不计代价，全部治', c: 1, do: s => { s.f.parentDone = 1; G.money(s, -G.w(s, s.f.ins ? .5 : 2.4)); G.fam(s, 4); return s.f.ins ? '保险报了大半。你第一次感谢那些每月悄悄扣走的钱。' : '钱花光了，能做的都做了。'; } },
      { t: '和家人、医生坦诚商量，让老人自己说想怎么过', g: B, d: ['self'], do: s => { s.f.parentDone = 1; G.money(s, -G.w(s, s.f.ins ? .3 : 1)); G.fam(s, 10); return '你第一次和爸妈谈到死。这是你们这辈子最长的一次聊天。'; } }
    ],
    lesson: '这是所有人都会下到的一手。提前几十年买好的保险和提前几个月的一次谈话，决定了这一刻的体面。'
  });

  N({
    id: 'l_body', age: [38, 46], p: 56, dom: 'jia', title: '体检报告', d: ['self', 'long'], when: s => s.jail <= s.year && (s.hp < 72 || s.f.overwork),
    text: ['体检报告最后一页，医生用红笔圈了几处。', '你想起自己已经很久没有在十二点前睡过觉。'],
    quiz: { type: 'calc', q: '报告说某项筛查阳性。这种病的发病率是 1%，筛查的准确率是 90%。你真得这个病的概率大约是多少？', opts: ['约 90%', '约 50%', '约 8%', '约 1%'], a: 2, ok: '约 8%。一千人里 10 个病人查出 9 个，990 个健康人误报 99 个。真阳性只占 9/108。先别慌，去做确诊检查。', no: '约 8%。一千人里 10 个病人查出 9 个，990 个健康人误报 99 个。真阳性只占 9/108。这是最常见的概率错觉。', d: ['prob'] },
    opts: [
      { t: '戒烟减酒，每周运动三次，十一点睡觉', g: B, do: s => { s.f.overwork = 0; G.setf(s, 'exercise'); G.hp(s, 10); return '第一个月很难。第六个月，医生说指标回来了。'; } },
      { t: '买一批进口保健品，工作实在停不下来', c: 1, x: 1, g: S, do: s => { G.money(s, -G.w(s, .15)); return '瓶子摆满了一个柜子。'; } },
      { t: '忙完这阵子再说', c: 1, g: S, do: s => { G.hp(s, -6); return '这阵子永远忙不完。'; } }
    ],
    lesson: '身体是你所有“气”里最难补回来的一口。'
  });

  N({
    id: 'l_cycle', age: [36, 44], p: 54, dom: 'jia', title: '你听见了那句话', d: ['self'], when: s => s.kids > 0 && s.jail <= s.year && s.parents !== 'harmony',
    text: s => ['孩子考砸了，你吼了一句。', s.f.hide ? '话出口的时候你愣住了。这是你小时候最怕听到的那句话。' : '话出口的时候你愣住了。这句话是你爸妈的。', '孩子低着头，开始看你的脸色。'],
    opts: s => [
      { t: '蹲下来，和孩子说：对不起，我刚才不该这么说', g: M, d: ['long'], do: s => { G.fam(s, 12); G.sec(s, 10); if (s.f.cycle) G.setf(s, 'cycleDone'); return '孩子哭了。你也是。有些东西在你这里停下了。'; } },
      { t: '我小时候也是这么过来的', c: 1, g: S, do: s => { G.fam(s, -8); return '孩子不再和你说考试的事了。'; } }
    ],
    lesson: '阶层可以一代人爬上去，安全感要好几代人才攒得起来。你对孩子说的那一句话，是留给下一局的让子。'
  });


  N({
    id: 'l_burden', age: [24, 33], p: 72, dom: 'jia', title: '家里的电话', d: ['self', 'cost'], when: s => ['A', 'B'].includes(s.cls) && s.job && s.jail <= s.year && s.cash > G.w(s, .2),
    text: s => ['你爸打来电话，先问你吃了没有，然后沉默了一会儿。', `弟弟要结婚，彩礼和县城的房子还差 ${G.fmt(G.w(s, 1.4))}。“你在外面挣得多，你是老大。”`, '你手上的钱，是准备交首付的。'],
    opts: [
      { t: '全部打回去。一家人，不能看着弟弟打光棍', c: 1, do: s => { G.money(s, -Math.min(Math.max(0, s.cash), G.w(s, 1.4))); G.fam(s, 6); G.setf(s, 'carry'); return '你爸在电话里说：好，好。你的首付要再等几年。'; } },
      { t: '定一个数字，讲清楚这是最后一次，其余的算借', g: B, do: s => { G.money(s, -Math.min(Math.max(0, s.cash), G.w(s, .4))); G.fam(s, -2); G.sec(s, 5); return '你爸挂了电话。过年回家，饭桌上有点冷。但你第一次替自己说了话。'; } },
      { t: '说手上没钱，挂掉电话', z: 1, do: s => { G.fam(s, -10); G.sec(s, -4); return '你妈后来发来一条语音，你没有点开。'; } }
    ],
    lesson: '向上流动的人常常背着整个家庭。这笔账不只是钱，也是你和原生家庭的边界。给得出的、讲得清楚的帮助，才能长久。'
  });

  N({
    id: 'l_hire', age: [24, 30], p: 69, dom: 'ye', title: '面试的最后一个问题', d: ['law', 'self'], when: s => s.gender === 'F' && s.job && s.job.sec !== 'gov' && s.jail <= s.year,
    text: ['面试到了最后，对方合上简历，笑了笑：“有男朋友吗？打算什么时候要孩子？”', '这个岗位你已经争取了三轮。'],
    opts: [
      { t: '笑着说暂时不考虑', c: 1, do: s => { G.bump(s, 1.05); return '你拿到了这份 offer。这句话你后来说了很多次。'; } },
      { t: '反问：这和岗位要求有关吗？', g: P, d: ['law'], do: s => { G.setf(s, 'voice'); return '气氛冷了一下。你没有收到第四轮。'; } },
      { t: '记下来，只去在意你能力的公司', need: ['intern', 'code', 'writing', 'english'], g: M, do: s => { G.pay(s, ['code', 'english', 'writing', 'intern'], '手里的本事让你可以挑老板'); G.bump(s, 1.15); return '你有得选。这就是积累的意义。'; } }
    ],
    lesson: '就业性别歧视违反《妇女权益保障法》。现实里，议价能力来自你手上的选项。',
    src: [['制度', '《妇女权益保障法》（2022 修订）规定，用人单位不得询问妇女婚育情况。']]
  });
})(typeof window !== 'undefined' ? window : globalThis);
