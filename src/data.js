const DEFAULT_GCD_SECONDS = 2.5;
const START_TIME_SECONDS = -15;
const INITIAL_MAX_TIME_SECONDS = 20 * 60;
const TIMELINE_TAIL_SECONDS = 240;
const TIME_EPSILON = 1e-6;
const INITIAL_SLOT_COUNT = Math.ceil((INITIAL_MAX_TIME_SECONDS - START_TIME_SECONDS) / DEFAULT_GCD_SECONDS) + 1;
const ICON_BASE = 'https://ffxiv.gamerescape.com/wiki/Special:Redirect/file/';
const MAJOR_COOLDOWN_IDS = ['drill', 'air-anchor', 'chain-saw', 'barrel-stabilizer', 'wildfire', 'dexterity-potion'];
const BUFF_DEFINITIONS = {
  potion: { label: '爆发药', short: '药', actionId: 'dexterity-potion' },
  'barrel-prep': { label: '超荷预备', short: '超', actionId: 'barrel-stabilizer' },
  reassemble: { label: '整备', short: '整', actionId: 'reassemble' },
  overheat: { label: '过热', short: '热', actionId: 'hypercharge' },
  'excavator-prep': { label: '掘地飞轮预备', short: '掘', actionId: 'excavator' },
  'full-metal-prep': { label: '全金属爆发预备', short: '金', actionId: 'full-metal-field' },
  wildfire: { label: '野火', short: '火', actionId: 'wildfire' }
};

const actions = [
  { id: 'dexterity-potion', cn: '爆发药水', en: 'Grade 3 Gemdraught of Dexterity', level: 1, type: 'ogcd', category: '职业技能', recast: 270, buffDuration: 30, grantsBuffs: [{ id: 'potion', duration: 30 }], range: '0米', radius: '0米', desc: '视为能力技。使用后获得30秒爆发药效果，时间轴中处于药效窗口内的本体与机器人技能都会高亮。' },
  { id: 'split-shot', hidden: true, cn: '分裂弹', en: 'Split Shot', level: 1, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 140, heat: 5, desc: '对目标发动远距离物理攻击。追加效果：热量 +5。' },
  { id: 'slug-shot', hidden: true, cn: '独头弹', en: 'Slug Shot', level: 2, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 100, heat: 5, desc: '连击：分裂弹/热分裂弹。连击成功时威力提高并增加热量。' },
  { id: 'hot-shot', hidden: true, cn: '热弹', en: 'Hot Shot', level: 4, type: 'gcd', category: '职业技能', recast: 40, range: '25米', radius: '0米', potency: 240, battery: 20, desc: '不与其他战技共享复唱。追加效果：电量 +20。' },
  { id: 'reassemble', cn: '整备', en: 'Reassemble', level: 10, type: 'ogcd', category: '职业技能', recast: 55, charges: 2, grantsBuffs: [{ id: 'reassemble', duration: 5 }], range: '0米', radius: '0米', desc: '效果时间内，自身发动的1次战技必定暴击并直击。持续时间：5秒。最大档数：2。' },
  { id: 'gauss-round', hidden: true, cn: '虹吸弹', en: 'Gauss Round', level: 15, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '0米', potency: 130, desc: '对目标发动远距离物理攻击。最大档数：3。' },
  { id: 'spread-shot', hidden: true, cn: '散射', en: 'Spread Shot', level: 18, type: 'gcd', category: '职业技能', recast: 2.5, range: '12米', radius: '12米', potency: 110, heat: 5, desc: '向目标方向发动扇形范围攻击。追加效果：热量 +5。' },
  { id: 'clean-shot', hidden: true, cn: '狙击弹', en: 'Clean Shot', level: 26, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 100, heat: 5, battery: 10, desc: '连击：独头弹/热独头弹。连击成功时热量 +5、电量 +10。' },
  { id: 'hypercharge', cn: '超荷', en: 'Hypercharge', level: 30, type: 'ogcd', category: '职业技能', recast: 10, heat: -50, grantsBuffs: [{ id: 'overheat', duration: 10 }], range: '0米', radius: '0米', desc: '消耗50热量，获得5档过热状态。持续时间：10秒。可以发动烈焰弹和自动弩。' },
  { id: 'heat-blast', hidden: true, cn: '热冲击', en: 'Heat Blast', level: 35, type: 'gcd', category: '职业技能', recast: 1.5, range: '25米', radius: '0米', potency: 200, desc: '过热时可用；追加效果：虹吸弹和弹射的复唱时间缩短15秒。' },
  { id: 'rook-autoturret', hidden: true, cn: '车式浮空炮塔', en: 'Rook Autoturret', level: 40, type: 'ogcd', category: '职业技能', recast: 6, battery: -50, range: '0米', radius: '0米', desc: '消耗50电量部署单体炮塔；与后式自走人偶共享用途。' },
  { id: 'rook-overdrive', hidden: true, cn: '超档车式炮塔', en: 'Rook Overdrive', level: 40, type: 'ogcd', category: '职业技能', recast: 15, range: '25米', radius: '0米', desc: '命令车式浮空炮塔执行超负荷。' },
  { id: 'wildfire', cn: '野火', en: 'Wildfire', level: 45, type: 'ogcd', category: '职业技能', recast: 120, grantsBuffs: [{ id: 'wildfire', duration: 10 }], range: '25米', radius: '0米', desc: '对目标附加野火状态；持续10秒，或自身对目标命中6次战技后结束。每命中1次战技威力240，最多变化6次。' },
  { id: 'detonator', cn: '起爆', en: 'Detonator', level: 45, type: 'ogcd', category: '职业技能', recast: 1, range: '25米', radius: '0米', desc: '提前结束野火并造成伤害。' },
  { id: 'ricochet', hidden: true, cn: '弹射', en: 'Ricochet', level: 50, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '5米', potency: 130, desc: '对目标及周围敌人发动范围攻击。最大档数：3。' },
  { id: 'auto-crossbow', cn: '自动弩', en: 'Auto Crossbow', level: 52, type: 'gcd', category: '职业技能', recast: 1.5, requiresOverheat: true, range: '12米', radius: '12米', potency: 140, desc: '过热时可用的扇形范围战技。' },
  { id: 'heated-split-shot', cn: '热分裂弹', en: 'Heated Split Shot', level: 54, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 220, heat: 5, desc: '分裂弹的强化版。追加效果：热量 +5。' },
  { id: 'tactician', cn: '策动', en: 'Tactician', level: 56, type: 'ogcd', category: '职业技能', recast: 90, range: '0米', radius: '30米', desc: '降低自身与周围队员受到的伤害。' },
  { id: 'drill', cn: '钻头', en: 'Drill', level: 58, type: 'gcd', category: '职业技能', recast: 20, charges: 2, range: '25米', radius: '0米', potency: 660, desc: '强力单体战技；拥有独立复唱时间。最大档数：2。' },
  { id: 'heated-slug-shot', cn: '热独头弹', en: 'Heated Slug Shot', level: 60, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 140, heat: 5, desc: '独头弹的强化版；连击成功时提高威力并增加热量。' },
  { id: 'dismantle', cn: '武装解除', en: 'Dismantle', level: 62, type: 'ogcd', category: '职业技能', recast: 120, range: '25米', radius: '0米', desc: '降低目标造成的伤害。' },
  { id: 'heated-clean-shot', cn: '热狙击弹', en: 'Heated Clean Shot', level: 64, type: 'gcd', category: '职业技能', recast: 2.5, range: '25米', radius: '0米', potency: 160, heat: 5, battery: 10, desc: '狙击弹的强化版；连击成功时热量 +5、电量 +10。' },
  { id: 'barrel-stabilizer', cn: '枪管加热', en: 'Barrel Stabilizer', level: 66, type: 'ogcd', category: '职业技能', recast: 120, grantsBuffs: [{ id: 'barrel-prep', duration: 30 }, { id: 'full-metal-prep', duration: 30 }], range: '0米', radius: '0米', desc: '对自身附加超荷预备状态与全金属爆发预备。持续时间：30秒。超荷预备期间可以免费发动一次超荷且不消耗热量。' },
  { id: 'blazing-shot', cn: '烈焰弹', en: 'Blazing Shot', level: 68, type: 'gcd', category: '职业技能', recast: 1.5, requiresOverheat: true, range: '25米', radius: '0米', potency: 220, desc: '热冲击的强化版；过热时可用，复唱1.5秒。追加效果：双将和将死的复唱时间缩短15秒。' },
  { id: 'flamethrower', cn: '火焰喷射器', en: 'Flamethrower', level: 70, type: 'ogcd', category: '职业技能', recast: 60, range: '0米', radius: '8米', desc: '持续向前方范围喷射火焰。移动或转身会取消。' },
  { id: 'bioblaster', cn: '毒菌冲击', en: 'Bioblaster', level: 72, type: 'gcd', category: '职业技能', recast: 20, range: '12米', radius: '12米', potency: 50, desc: '范围战技并附加持续伤害；与钻头共享用途场景。' },
  { id: 'air-anchor', cn: '空气锚', en: 'Air Anchor', level: 76, type: 'gcd', category: '职业技能', recast: 40, range: '25米', radius: '0米', potency: 660, battery: 20, desc: '热弹的强化版；不与其他战技共享复唱。追加效果：电量 +20。' },
  { id: 'automaton-queen', cn: '后式自走人偶', en: 'Automaton Queen', level: 80, type: 'ogcd', category: '职业技能', recast: 6, batteryCostMin: 50, drainBattery: true, range: '0米', radius: '0米', desc: '电量50以上发动，召唤后会耗尽当前全部电量。5.75秒后开始机器人连段。' },
  { id: 'scattergun', cn: '霰弹枪', en: 'Scattergun', level: 82, type: 'gcd', category: '职业技能', recast: 2.5, range: '12米', radius: '12米', potency: 130, heat: 10, desc: '向目标所在方向发出扇形范围物理攻击。追加效果：获得10点枪管热度。' },
  { id: 'arm-punch', hidden: true, cn: '铁臂拳', en: 'Arm Punch', level: 80, type: 'robot', category: '机器人', recast: 1.5, range: '3米', radius: '0米', potency: 120, desc: '后式自走人偶自动执行的连续攻击。' },
  { id: 'pile-bunker', cn: '打桩机', en: 'Pile Bunker', level: 80, type: 'robot', category: '机器人', recast: 1.5, range: '3米', radius: '0米', potency: 680, desc: '后式自走人偶自动执行的强力攻击。' },
  { id: 'roller-dash', hidden: true, cn: '滚轮冲', en: 'Roller Dash', level: 80, type: 'ogcd', category: '职业技能', recast: 3, range: '0米', radius: '0米', desc: '后式自走人偶突进到目标附近。' },
  { id: 'crowned-collider', cn: '王室对撞机', en: 'Crowned Collider', level: 86, type: 'robot', category: '机器人', recast: 1, range: '3米', radius: '0米', potency: 780, desc: '后式自走人偶自动执行的终结攻击。' },
  { id: 'chain-saw', cn: '回转飞锯', en: 'Chain Saw', level: 90, type: 'gcd', category: '职业技能', recast: 60, grantsBuffs: [{ id: 'excavator-prep', duration: 30 }], range: '25米', radius: '25米直线', potency: 660, battery: 20, desc: '直线范围战技；追加效果：电量 +20。' },
  { id: 'double-check', cn: '双将', en: 'Double Check', level: 92, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '0米', potency: 160, desc: '虹吸弹的强化版。最大档数：3。' },
  { id: 'checkmate', cn: '将死', en: 'Checkmate', level: 92, type: 'ogcd', category: '职业技能', recast: 30, charges: 3, range: '25米', radius: '5米', potency: 160, desc: '弹射的强化版。最大档数：3。' },
  { id: 'excavator', cn: '掘地飞轮', en: 'Excavator', level: 96, type: 'gcd', category: '职业技能', recast: 2.5, requiresBuff: 'excavator-prep', range: '25米', radius: '25米直线', potency: 620, battery: 20, desc: '回转飞锯后获得预备效果时可用，追加电量。' },
  { id: 'full-metal-field', cn: '全金属爆发', en: 'Full Metal Field', level: 100, type: 'gcd', category: '职业技能', recast: 2.5, requiresBuff: 'full-metal-prep', range: '25米', radius: '5米', potency: 900, desc: '强力范围战技；通常由枪管加热相关效果触发。' },
  { id: 'second-wind', hidden: true, cn: '内丹', en: 'Second Wind', level: 8, type: 'ogcd', category: '职能技能', recast: 120, range: '0米', radius: '0米', desc: '恢复自身HP。' },
  { id: 'leg-graze', hidden: true, cn: '伤腿', en: 'Leg Graze', level: 6, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '对目标附加加重。' },
  { id: 'foot-graze', hidden: true, cn: '伤足', en: 'Foot Graze', level: 10, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '对目标附加止步。' },
  { id: 'head-graze', hidden: true, cn: '伤头', en: 'Head Graze', level: 24, type: 'ogcd', category: '职能技能', recast: 30, range: '25米', radius: '0米', desc: '打断目标咏唱。' },
  { id: 'peloton', hidden: true, cn: '速行', en: 'Peloton', level: 20, type: 'ogcd', category: '职能技能', recast: 5, range: '0米', radius: '30米', desc: '非战斗状态下提高自身与周围队员移动速度。' },
  { id: 'arms-length', hidden: true, cn: '亲疏自行', en: "Arm's Length", level: 32, type: 'ogcd', category: '职能技能', recast: 120, range: '0米', radius: '0米', desc: '令自身免疫大多数击退与吸引效果。' }
].map(action => ({
  ...action,
  icon: `${ICON_BASE}${encodeURIComponent(action.en.replaceAll(' ', '_') + '_Icon.png')}`,
  gcdDuration: action.type === 'gcd' ? (action.recast === 1.5 ? 1.5 : 2.5) : 0
}));

const actionsById = Object.fromEntries(actions.map(action => [action.id, action]));
let plan = createEmptyPlan();
let initialResources = { heat: 0, battery: 0 };
let derivedState = [];
let selectedColumnIndex = null;

const elements = {
  palette: document.getElementById('palette'),
  grid: document.getElementById('grid'),
  toast: document.getElementById('toast'),
  heatNow: document.getElementById('heatNow'),
  heatMeter: document.getElementById('heatMeter'),
  batteryNow: document.getElementById('batteryNow'),
  batteryMeter: document.getElementById('batteryMeter'),
  doubleNow: document.getElementById('doubleNow'),
  checkNow: document.getElementById('checkNow'),
  reset: document.getElementById('reset'),
  exportPlan: document.getElementById('exportPlan'),
  sharePlan: document.getElementById('sharePlan'),
  importPlan: document.getElementById('importPlan'),
  addBasicCombo: document.getElementById('addBasicCombo'),
  addOverheatCombo: document.getElementById('addOverheatCombo'),
  addTransitionGap: document.getElementById('addTransitionGap'),
  initialHeat: document.getElementById('initialHeat'),
  initialBattery: document.getElementById('initialBattery')
};
