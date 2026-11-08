/* 推演：2027 以后。这部分不是预测，只是把今天看得见的趋势往前推。 */
(function (root) {
  'use strict';
  const XZ = root.XZ, N = XZ.N, G = XZ.G;
  const { M, B, P, S, H } = G.GR;
  const free = s => s.age >= 20 && !s.inSchool && s.jail <= s.year;

  N({
    id: 'f_agent', y: [2027, 2029], p: 75, dom: 'ye', title: '两个人和一屋子 Agent', era: '推演：Agent 进入办公室', d: ['trend', 'long'],
    when: s => free(s) && s.job && ['office', 'net', 'fin', 'media', 'edu'].includes(s.job.sec) && !['ai'].includes(s.job.k),
    text: ['推演：你的部门从八个人变成了两个人，加上一群 Agent。', '公司不大规模裁员，只是不再招新人。走了的人没有人补。'],
    opts: [
      { t: '成为那两个人之一：我来定义任务、验收结果', need: ['ai', 'ml'], g: M, do: s => { G.pay(s, ['ai', 'ml'], '你很早就把它当成同事来用，现在你成了带它们的人'); G.job(s, s.job.k, s.job.mult * 1.5); return '你的工作变成了判断：什么该做，什么是对的，出了错谁负责。'; } },
      { t: '现在开始学，还不算太晚', g: B, do: s => { G.seed(s, 'ai', '被逼着开始学 AI'); G.bump(s, 1.02); return '起步晚，但你的行业经验还值钱。'; } },
      { t: '转去 AI 替代不了的线下岗位：护理、维修、现场服务', z: 1, g: P, do: s => { G.job(s, 'tech', Math.max(.9, s.job.mult * .6)); return '这份工作动手，也需要和人打交道。'; } },
      { t: '等。老员工懂业务，公司不会都换掉', c: 1, g: S, do: s => { if (G.roll(s, .55)) { G.nojob(s); return '第二年，你的岗位也没有了。'; } G.bump(s, .85); return '你留了下来，工资没有再涨过。'; } }
    ],
    lesson: '推演：最先被压缩的是初级岗位和中间环节。能定义问题、验收结果、对后果负责的人更稀缺。'
  });

  N({
    id: 'f_robot', y: [2028, 2031], p: 70, dom: 'ye', title: '厂里来了新同事', era: '推演：人形机器人进工厂', d: ['trend'],
    when: s => free(s) && s.job && ['mfg', 'gig', 'svc', 'farm'].includes(s.job.sec),
    text: ['推演：厂里来了第一批人形机器人，试用期从搬料箱开始。', '自动驾驶也从几个城市扩到了更多路段，跑单的人开始算账。'],
    opts: [
      { t: '去当给机器人排故障、教动作的人', need: ['craft', 'elec'], g: M, do: s => { G.pay(s, ['craft', 'elec'], '机器最不会干的活，是修机器'); G.job(s, 'tech', Math.max(1.6, s.job.mult * 1.3), '机器人技师'); return '你带着三个年轻人，管着四十台机器。'; } },
      { t: '趁现在学一门证书，换到维修或电工岗位', g: B, do: s => { G.seed(s, 'craft', '四十岁也去考了证'); G.bump(s, 1.05); return '夜校里你年纪最大，学得最认真。'; } },
      { t: '干到干不动为止', c: 1, z: 1, g: S, do: s => { G.bump(s, .82); return '单价每年都在降。'; } }
    ],
    lesson: '推演：体力岗位的替代比想象得慢，但最先发生在重复、标准化的环节。'
  });

  N({
    id: 'f_silver', y: [2030, 2032], p: 66, dom: 'cai', title: '四亿老人', era: '推演：银发社会', d: ['trend', 'long'],
    when: s => s.age >= 23 && s.jail <= s.year && !s.inSchool,
    text: ['推演：60 岁以上人口超过四亿。县城里的幼儿园在关门，养老院排不上号。', '你身边第一次有人为父母的护理费发愁。'],
    opts: [
      { t: '做老人真正需要的服务：康复、照护、适老改造', need: ['care', 'craft', 'hustle'], g: M, do: s => { G.pay(s, ['care', 'hustle', 'craft'], '这个不体面的方向，你早就看见了'); G.job(s, 'boss', Math.max(s.job ? s.job.mult : 1, 2.2), '银发服务创业者'); G.biz(s, '康养服务公司', G.w(s, 4)); return '第一个客户是你爸妈的老邻居。'; } },
      { t: '给自己早做打算：补足个人养老金，继续定投', g: B, do: s => { G.setf(s, 'pension'); if (s.cash > 0) G.buy(s, 'nasdaq', s.cash * .2); return '这笔钱要二十年后才用得上。'; } },
      { t: '买康养主题理财，把趋势变成收益最省事', x: 1, c: 1, g: S, do: s => { G.money(s, -Math.max(0, s.cash) * .08); return '概念总是比服务先到。'; } },
      { t: '现在考虑这些还太早', z: 1, g: P, r: '这句话你三十年后可能会想起来。' }
    ],
    lesson: '人口是最可预测的长期变量。十年后老人需要什么，今天几乎都能算出来。',
    src: [['估算', '2025 年末全国人口 14.05 亿，60 岁及以上占比持续上升。四亿是常见的中期预测。']]
  });

  N({
    id: 'f_school', y: [2030, 2033], p: 72, dom: 'ye', title: '并校', era: '推演：少子化到达校园', atk: 1, d: ['trend', 'cost'],
    when: s => free(s) && s.job && s.job.k === 'teacher',
    text: ['推演：你们县的小学从十八所并成了十一所。2016 年后出生的孩子一年比一年少。', '学校开始要求老师转岗、竞聘。'],
    opts: [
      { t: '转向职业教育、老年教育或做教研骨干', g: B, do: s => { G.bump(s, 1.02); return '你调去了县里的职业学校。'; } },
      { t: '等着，编制总归是编制', c: 1, z: 1, g: S, do: s => { G.bump(s, .85); return '你被调到了更远的村校。'; } }
    ],
    lesson: '这件事在 2016 年出生人口见顶时就能算出来：七年后小学、十年后初中、十三年后高中。',
    src: [['统计', '全国出生人口 2016 年约 1786 万，2025 年 792 万。']]
  });

  N({
    id: 'f_solo', y: [2031, 2034], p: 62, dom: 'cai', title: '一个人，一门生意', era: '推演：超级个体', d: ['trend', 'prob'],
    when: s => free(s) && G.has(s, ['ai', 'code', 'ecom', 'writing', 'short', 'gzh']),
    text: ['推演：做一个产品、一场营销、一套客服的成本已经接近零。', '真正贵的东西变成了三样：信任、分发和一个具体的问题。'],
    opts: s => [
      { t: '服务你最熟悉的那个小行业，做一门小而稳的生意', g: M, do: s => { G.pay(s, ['ai', 'ecom', 'gzh', 'short', 'writing', 'code'], '这些年攒下的受众和手艺，成了别人买不到的东西'); G.side(s, 1); return '客户不多，没有人来抢。'; } },
      { t: '什么热做什么，每个月换一个赛道', x: 1, g: S, do: s => { G.money(s, -G.w(s, .2)); return '工具越便宜，同样的主意越多。'; } },
      { t: '还是拿工资踏实', z: 1, c: 1, g: P, r: '你保住了确定性。' }
    ],
    lesson: '推演：工具变便宜之后，稀缺的是你和某一群人多年建立的信任。'
  });

  N({
    id: 'f_kid', y: [2032, 2035], p: 58, dom: 'jia', title: '孩子问你', d: ['self', 'long'], when: s => s.kids > 0 && s.jail <= s.year,
    text: ['孩子问你：“AI 什么都会，我为什么还要学？”', '这个问题你爸妈没有问过，也没有人告诉过你答案。'],
    opts: [
      { t: '因为你要知道它说得对不对，还要知道什么事情值得做', g: B, do: s => { G.fam(s, 6); return '孩子想了很久，去翻了一本书。'; } },
      { t: '别问了，赶紧写作业', c: 1, do: s => { G.fam(s, -5); return '孩子戴上了耳机。'; } },
      { t: '把你这辈子最错的三手棋讲给孩子听', g: M, need: ['read', 'cycle', 'writing'], do: s => { G.pay(s, ['writing', 'read'], '你学会了复盘，也学会了把它讲出来'); G.fam(s, 12); return '那天晚饭吃了三个小时。这是你能留给孩子最值钱的东西。'; } }
    ],
    lesson: '你留给下一代最大的让子，是把复盘的习惯传下去。'
  });

  N({
    id: 'f_last', y: 2035, p: 86, dom: 'jia', title: '最后一手', d: ['self'], when: s => s.jail <= s.year,
    text: s => [`二〇三五年，你${G.ageCN(s.age)}岁。`, s.age >= 45 ? '头发开始白了。你开始想，这局棋剩下的部分要怎么下。' : '你还有很多手要下。今天坐下来，给自己留一句话。'],
    opts: s => [
      { t: '给家人留出时间，今年回家三次', g: B, do: s => { G.fam(s, 10); return '饭桌上有人在算账。这一幕你三十年前见过。'; } },
      { t: '再往前冲一把，还能赢', c: 1, x: 1, do: s => { G.bump(s, 1.06); G.hp(s, -5); return '工作还是很多。'; } },
      { t: '把这一生下过的棋写下来', need: ['writing', 'read'], g: B, do: s => { G.fam(s, 5); return '写到六岁那张饭桌时，你停了很久。'; } }
    ],
    lesson: '官子阶段，每一手都很小，加起来决定胜负。'
  });


  N({
    id: 'f_fraud', y: [2026, 2029], p: 74, dom: 'jia', title: '妈妈的视频电话', clock: 12, dft: 0, d: ['info', 'law'],
    when: s => s.age >= 20 && s.jail <= s.year,
    text: ['你妈打来视频，脸是她的，声音也是她的。', '“我在医院，手机快没电了，你先转五万到这个账户，别告诉你爸。”'],
    opts: [
      { t: '先转过去，这种时候不能耽误', c: 1, x: 1, g: H, do: s => { G.money(s, -5); G.fam(s, -3); return '半小时后，你妈从菜市场回来了。手机一直在她兜里。'; } },
      { t: '挂断，打她的老号码，再问一句只有她知道的事', g: M, do: s => { G.seed(s, 'law', '学会了核实身份'); return '你妈在菜市场，问你吃了没有。'; } },
      { t: '在视频里问她几个问题', z: 1, g: P, r: '对方的回答很自然。你犹豫了一下，还是没有转。' }
    ],
    lesson: '当脸和声音都能伪造，核实身份要换一条通道。挂断重拨比任何识别技巧都可靠。遇到可疑情况可拨打 96110。',
    src: [['制度', '全国反诈专线 96110。AI 换脸诈骗已有公开案例。']]
  });

  N({
    id: 'f_voc', y: [2027, 2030], p: 72, dom: 'xue', title: '职教高考', d: ['long', 'cost'], when: s => s.age >= 17 && s.age <= 19 && s.track === 'voc',
    text: ['推演：职业本科越来越多，“职教高考”也成了一条路。', '厂里已经有人来学校招人。老师说，你的实操是全班最好的。'],
    opts: [
      { t: '去考职业本科，学工业机器人和电气', g: B, do: s => { s.edu = 3; s.inSchool = true; s.gradY = s.year + 4; s.uni = 'er'; s.major = 'robo'; s.f.wfirst = 1; G.seed(s, 'elec', '读了职业本科'); return '你比普通本科的同学多摸了三年机器。'; } },
      { t: '现在就进厂，早三年挣钱', c: 1, r: '第一个月工资到手，你给自己买了双好鞋。' }
    ],
    lesson: '推演：技能型人才的学历通道正在打开。动手能力加上系统知识，是 AI 最难覆盖的组合。'
  });

  N({
    id: 'f_power', pivot: 1, y: [2028, 2033], p: 66, dom: 'ye', title: '算力要吃电', era: '推演：算力中心扩张', d: ['trend'],
    when: s => s.age >= 20 && !s.inSchool && s.jail <= s.year && s.job && G.has(s, ['craft', 'elec']) && s.job.sec !== 'ev',
    text: ['推演：全国的算力中心一个接一个开工，变电、制冷、储能都缺人。', '招聘启事上写着：有高压电工证者优先，月薪三万起。'],
    opts: [
      { t: '去', g: M, do: s => { G.pay(s, ['craft', 'elec'], '谁能想到，AI 时代最缺的是电工'); G.job(s, 'ev', Math.max(s.job.mult * 1.25, 1.7), '算力中心工程师'); return '白天在机房，晚上在夜校学制冷。'; } },
      { t: '那种地方都是搞程序的，和我没关系', c: 1, z: 1, r: '你继续原来的工作。' }
    ],
    lesson: '推演：每一个虚拟的风口背后都有一个物理的瓶颈。盯住瓶颈，比盯住概念更可靠。'
  });

  N({
    id: 'f_alone', y: [2032, 2034], p: 60, dom: 'jia', title: '它比家里人更懂你', d: ['self'], when: s => s.age >= 20 && s.jail <= s.year,
    text: ['推演：手机里的 AI 伴侣记得你说过的每一句话，从不发脾气。', '你已经三个月没有和朋友吃过一顿饭了。你妈打来的电话，你也经常按掉。'],
    opts: [
      { t: '这样挺好，没有人比它更懂我', c: 1, x: 1, g: S, do: s => { G.fam(s, -10); G.sec(s, -5); return '你说话的对象越来越少，你也不太在意了。'; } },
      { t: '约一个老朋友吃饭，回一个电话', g: B, do: s => { G.fam(s, 8); return '饭吃得有点尴尬。回家路上你觉得心里实了一些。'; } }
    ],
    lesson: '推演：真实的关系有摩擦，这正是它们的价值。一个永远顺着你的东西，帮不了你看见自己。'
  });

  /* 案发 */
  N({
    id: 'x_case', trig: 1, dom: 'cai', title: '案发', era: '法网', atk: 1, d: ['law'],
    when: s => s.crimes.some(c => c.exposed && !c.closed),
    text: s => { const c = s.crimes.find(c => c.exposed && !c.closed); return [`${G.yearCN(s.year)}年，一个普通的早上，门被敲响了。`, `时间过去了 ${s.year - c.year} 年，你几乎忘了 ${c.year} 年的那件事。`, `警察出示了证件。你涉嫌${c.name}，${c.law}。`]; },
    opts: s => [
      { t: '如实供述，退赃退赔，认罪认罚', g: B, do: s => doCase(s, .7) },
      { t: '花大价钱找人“捞”自己', x: 1, g: S, do: s => { G.money(s, -G.w(s, 1)); return doCase(s, 1, '那个说能摆平的人收了钱，很快就联系不上了。'); } },
      { t: '什么都不说，硬扛到底', c: 1, g: S, do: s => doCase(s, 1.2) }
    ],
    lesson: s => { const c = s.crimes.find(x => x.closedAt === s.year) || s.crimes[0]; return c ? `${c.name}：${c.law}。这笔钱早在你收下它的时候就标了价，只是账单晚到。自首、认罪认罚和退赃都是法定或酌定的从宽情节。` : ''; }
  });
  function doCase(s, k, extra) {
    const c = s.crimes.find(c => c.exposed && !c.closed);
    c.closed = true; c.closedAt = s.year; s.f.caseN = (s.f.caseN || 0) + 1;
    const yrs = Math.max(1, Math.round(c.term * k));
    const take = Math.min(Math.max(0, G.worth(s)) * .6, c.gain * 1.5 + G.w(s, .5));
    G.money(s, -take);
    G.jail(s, yrs); G.fam(s, -20); G.hp(s, -8); s.spouse = G.roll(s, .5) ? null : s.spouse;
    G.capture(s, null, 4 + Math.min(4, yrs));
    return [extra || '', `法院判处有期徒刑 ${yrs} 年。退赃、罚金和赔偿一共是 ${G.fmt(take)}。`, '棋盘上，一片黑子被提走了。'].filter(Boolean);
  }

  N({
    id: 'x_case2', trig: 1, dom: 'cai', title: '又一张传票', era: '法网', atk: 1, when: s => s.crimes.some(c => c.exposed && !c.closed),
    text: s => { const c = s.crimes.find(c => c.exposed && !c.closed); return [`${c.year} 年的另一件事也被翻了出来：${c.name}，${c.law}。`, '这一次，你的律师只说了一句：配合吧。']; },
    run: s => doCase(s, 1, '检察院把两件事放在了一起。')
  });

  N({
    id: 'x_debt', p: 84, dom: 'cai', title: '还不上了', d: ['lever', 'cost'], when: s => s.age >= 22 && s.cash < -G.w(s, 1.2) && s.jail <= s.year,
    text: s => [`账上是 ${G.fmt(s.cash)}。信用卡在还网贷，网贷在还信用卡。`, '手机上有一个新的 App，三分钟放款。'],
    opts: s => [
      { t: '把能卖的都卖了，和家人摊牌，定一个还款计划', g: B, do: s => { s.f.debtY = s.year; if (s.houses.length) { const v = G.sellHouse(s, s.houses.length - 1); G.fam(s, -5); return `你卖掉了房子，拿回 ${G.fmt(v)}。这是这些年睡得最好的一晚。`; } Object.keys(s.pos).forEach(k => G.sell(s, k, 1)); s.cash *= .6; G.fam(s, 3); return '你把所有情况写在一张纸上，交给了家人。那天晚上你哭了。'; } },
      { t: '再借一笔把这个月过了，下个月发工资就补上', c: 1, x: 1, g: H, do: s => { s.f.debtY = s.year; s.cash *= 1.25; G.hp(s, -8); G.fam(s, -10); return '年化 36% 的利息，每一天都在跑。'; } }
    ],
    lesson: '以贷养贷的利息增长比工资快得多。先止血：停止新增负债，卖资产，把最贵的债先还掉。'
  });
  N({
    id: 'x_debt2', p: 84, dom: 'cai', title: '催收电话打到了单位', d: ['law', 'self'], when: s => s.age >= 24 && s.cash < -G.w(s, 1.5) && s.jail <= s.year && s.f.debtY && s.year - s.f.debtY >= 4,
    text: s => [`账上又到了 ${G.fmt(s.cash)}。这一次，催收电话打到了你领导那里，还给你的通讯录发了短信。`, '你算了一下，光利息就要吃掉一半的工资。'],
    opts: s => [
      { t: '找银行协商分期，把每笔债的利率列成表，先还最贵的', g: B, do: s => { s.f.debtY = s.year; s.cash *= .8; G.hp(s, -2); return '客服转了四次。最后，利息停了，你第一次知道一共欠了多少。'; } },
      { t: '向法律援助咨询，超过法定利率上限的部分不还', g: M, do: s => { s.f.debtY = s.year; s.cash *= .65; G.seed(s, 'law', '研究过民间借贷利率上限'); return '律师告诉你，有一半的“利息”法院本来就不支持。'; } },
      { t: '换号码，搬家，先躲一阵', c: 1, x: 1, g: S, do: s => { s.f.debtY = s.year; G.fam(s, -8); G.hp(s, -6); return '你躲了一年半。你爸妈家的门上被人写了字。'; } }
    ],
    lesson: '民间借贷利率受法律保护的上限是一年期 LPR 的四倍。暴力催收也违法。欠债要还，但要知道该还多少、怎么谈。',
    src: [['制度', '2020 年最高法修订民间借贷司法解释，受保护利率上限为合同成立时一年期 LPR 的四倍。']]
  });
  N({
    id: 'x_debt3', p: 84, repeat: true, dom: 'cai', title: '失信名单', when: s => s.age >= 26 && s.cash < -G.w(s, 2) && s.jail <= s.year && s.done.x_debt2 && s.year - s.f.debtY >= 4,
    text: ['法院的判决下来了。你上了失信名单，高铁票和飞机票都买不了。'],
    run: s => { s.f.debtY = s.year; s.cash *= .6; G.hp(s, -5); return ['法院冻结了你的账户。之后的几年，工资的一部分会被直接划走。']; }
  });
})(typeof window !== 'undefined' ? window : globalThis);
