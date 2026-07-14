import { EAST } from './east'
import { WEST } from './west'

export const COURTS = { east: EAST, west: WEST }
export const COURT_LIST = [EAST, WEST]

export const getCourt = (id) => COURTS[id] || EAST

export const rosterFor = (court) =>
  Object.fromEntries(
    [...court.officials, ...court.harem].map((o) => [o.id, { enabled: !!o.defaultOn, provider: '' }])
  )

export const indexFor = (court) =>
  Object.fromEntries(
    [...court.officials, ...court.harem, court.historian, court.regent].map((o) => [o.id, o])
  )

// ─── 介面文案 ───────────────────────────────────────────────
export const UI = {
  zh: {
    gateTitle: '百官朝議',
    gateSub: '陛下降一道聖諭，滿朝 AI 文武輪番出列奏對：戶部算錢、兵部論戰、御史找碴、東廠扮敵、後宮遞鳳箋干政，最後太史令執筆，為您留下一卷可以帶走的《起居注實錄》。',
    gateEnter: '入殿面聖',
    gateKey: '呈上虎符・入殿',
    gateFoot: 'API key 只存於您的瀏覽器，直連各家官方 API，不經任何伺服器。',
    switchCourt: '改朝換代',
    hall: '金鑾殿',
    hallSub: '皇帝臨朝・百官侍立',
    hallSubTitled: (t) => `${t}皇帝臨朝`,
    settings: '虎符',
    muster: '點將',
    emptyA: '殿上寂靜無聲。',
    emptyB: '陛下於下方龍案降一道聖諭，問一個您正在猶豫的決定、一個想法、一樁生意，眾卿即刻議政。',
    placeholder: '聖諭…（例：朕欲辭去工作、全職經營自媒體，眾卿以為如何？）',
    submit: '宣眾臣議事',
    lazy: '朕乏了',
    dismiss: '退朝',
    veil: '簾後',
    recordTitle: '太史令・起居注',
    copy: '抄錄實錄',
    copied: '已抄錄',
    errPrefix: (n) => `${n}出列未果：`,
    errPlain: '朝議受阻：',
    edictLabel: '聖諭',
    // 面板
    settingsTitle: '虎符・調兵遣將之信物',
    settingsHint: 'API key 只存在您這台裝置的瀏覽器（localStorage），直連各家官方 API，不經任何伺服器。至少配一枚虎符方可上朝。',
    defaultProvider: '預設供應商（未個別指派的官員由此家出任）',
    saveKeys: '收訖虎符',
    close: '關閉',
    show: '示',
    hide: '藏',
    model: '模型',
    musterTitle: '點將・今日誰上殿',
    musterHint: (a, b) => `每多一位官員或后妃發言，就多一次 API 呼叫。太史令必到（負責實錄），不在此列。目前朝班 ${a} 位、簾後 ${b} 位。`,
    sectionCourt: '朝班',
    sectionHarem: '簾後（後宮干政）',
    haremHint: '祖訓有云「後宮不得干政」，但祖訓就是拿來破的。皇后、貴妃與司禮監會在議政中途隨機遞鳳箋亂入；太后開啟即為「垂簾聽政」，固定在御史彈劾完、史官落筆前壓軸出場。',
    freqLabel: '干政頻率（皇后／貴妃／司禮監亂入的機率）',
    freq: { off: '從不', some: '偶爾', often: '頻繁' },
    sectionRuler: '御前',
    rulerFace: '聖上真容',
    rulerM: '皇帝（男）',
    rulerF: '皇帝（女）',
    rulerName: '聖號（稱呼，可留白），例：永樂',
    rulerBg: '陛下身世（可留白）：您在現世的行當、所轄之地、掛心之事',
    rulerBgPh: '例：經營一家線上課程品牌，坐鎮台北，麾下三人。',
    divTitle: '命盤（供命理官推演，僅供娛樂）',
    divSystem: '術數',
    divBazi: '中式八字',
    divZodiac: '西洋星座',
    birth: '生辰',
    hourUnknown: '時辰不詳',
    zodiacPick: '請擇星宮',
    divFoot: '欽天監所言僅供娛樂參詳，切勿據以決斷大事。',
    saveMuster: '點將完畢',
    provDefault: '依預設',
    provTip: '由哪家模型出任',
  },
  en: {
    gateTitle: 'The Privy Council',
    gateSub: 'Put one question to the throne, and the whole AI court rises to answer: the Treasurer counts the coin, the Marshal names the enemy, the Jester tears everyone apart, the Spymaster plays the enemy, and voices behind the arras meddle where they should not. At the last, the Royal Chronicler takes up the pen and leaves you a record you can carry away.',
    gateEnter: 'Enter the Chamber',
    gateKey: 'Present your Key',
    gateFoot: 'Your API key never leaves this browser. Calls go straight to each provider. There is no server.',
    switchCourt: 'Change Court',
    hall: 'The Council Chamber',
    hallSub: 'The sovereign presides. The council stands.',
    hallSubTitled: (t) => `${t} presides`,
    settings: 'Keys',
    muster: 'Summon',
    emptyA: 'The chamber is silent.',
    emptyB: 'Put your question to the council below: a decision you are torn over, an idea, a venture. They will speak at once.',
    placeholder: 'Your question… (e.g. I mean to leave my post and build my own venture. What say you?)',
    submit: 'Summon the Council',
    lazy: 'I am weary',
    dismiss: 'Adjourn',
    veil: 'The Arras',
    recordTitle: 'The Royal Chronicle',
    copy: 'Copy the Chronicle',
    copied: 'Copied',
    errPrefix: (n) => `${n} could not speak: `,
    errPlain: 'The council was interrupted: ',
    edictLabel: 'The Question',
    settingsTitle: 'Keys to the Kingdom',
    settingsHint: 'Your API keys are stored only in this browser (localStorage) and are sent directly to each provider. No server of ours ever sees them. One key is enough to convene the council.',
    defaultProvider: 'Default provider (used by any counsellor not assigned one)',
    saveKeys: 'Seal the Keys',
    close: 'Close',
    show: 'Show',
    hide: 'Hide',
    model: 'Model',
    musterTitle: 'Summon the Council',
    musterHint: (a, b) => `Every additional voice costs one more API call. The Chronicler always attends and is not counted here. Currently ${a} in council, ${b} behind the arras.`,
    sectionCourt: 'The Privy Council',
    sectionHarem: 'Behind the Arras',
    haremHint: 'They have no business in matters of state, which has never once stopped them. The Consort, the Favourite and the Privy Seal will slip a note into the chamber at unpredictable moments. The Queen Mother is different: enable her and she rules from behind the arras, speaking last, after the Jester and before the Chronicler.',
    freqLabel: 'How often they meddle (Consort, Favourite, Privy Seal)',
    freq: { off: 'Never', some: 'Now and then', often: 'Constantly' },
    sectionRuler: 'The Sovereign',
    rulerFace: 'Your likeness',
    rulerM: 'King',
    rulerF: 'Queen',
    rulerName: 'Your regnal name (optional), e.g. Alexander',
    rulerBg: 'Who you are in the mortal world (optional): your trade, your domain, what weighs on you',
    rulerBgPh: 'e.g. I run an online course brand out of Taipei with three people under me.',
    divTitle: 'Your chart (for the Astronomer Royal, strictly for amusement)',
    divSystem: 'System',
    divBazi: 'Chinese Bazi',
    divZodiac: 'Western Zodiac',
    birth: 'Date of birth',
    hourUnknown: 'Hour unknown',
    zodiacPick: 'Choose your sign',
    divFoot: 'The Astronomer Royal speaks for amusement only. Do not settle grave matters upon his word.',
    saveMuster: 'The Council is Set',
    provDefault: 'Default',
    provTip: 'Which model plays this part',
  },
}

export const HAREM_FREQ = { off: 0, some: 0.3, often: 0.6 }

export const HOURS_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const ZODIAC = [
  { id: 'aries', zh: '牡羊座', en: 'Aries' },
  { id: 'taurus', zh: '金牛座', en: 'Taurus' },
  { id: 'gemini', zh: '雙子座', en: 'Gemini' },
  { id: 'cancer', zh: '巨蟹座', en: 'Cancer' },
  { id: 'leo', zh: '獅子座', en: 'Leo' },
  { id: 'virgo', zh: '處女座', en: 'Virgo' },
  { id: 'libra', zh: '天秤座', en: 'Libra' },
  { id: 'scorpio', zh: '天蠍座', en: 'Scorpio' },
  { id: 'sagittarius', zh: '射手座', en: 'Sagittarius' },
  { id: 'capricorn', zh: '摩羯座', en: 'Capricorn' },
  { id: 'aquarius', zh: '水瓶座', en: 'Aquarius' },
  { id: 'pisces', zh: '雙魚座', en: 'Pisces' },
]

// 依生日推星座（使用者未手選時自動判定）
export function zodiacOf(birth) {
  if (!birth) return null
  const d = new Date(birth)
  if (Number.isNaN(d.getTime())) return null
  const m = d.getMonth() + 1
  const day = d.getDate()
  const cut = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22]
  const idx = day < cut[m - 1] ? (m + 10) % 12 : (m + 11) % 12
  return ZODIAC[idx]
}

// ─── 提示詞組裝 ─────────────────────────────────────────────
const clip = (s, n) => (s.length > n ? s.slice(0, n) + (s ? '…' : '') : s)

function transcript(court, turns, per = 500) {
  if (!turns.length) {
    return court.lang === 'zh'
      ? '（尚無人奏對，你是首位出列者。）'
      : '(No one has spoken yet. You are the first to rise.)'
  }
  return turns.map((t) => `◤${t.name}◢: ${clip(t.text, per)}`).join('\n\n')
}

function rulerNote(court, profile) {
  const bg = (profile?.background || '').trim()
  if (!bg) return ''
  return court.lang === 'zh'
    ? `【陛下身世】${clip(bg, 400)}\n\n`
    : `[About the sovereign] ${clip(bg, 400)}\n\n`
}

function divinerNote(court, official, profile) {
  if (!official.isDiviner) return ''
  const zh = court.lang === 'zh'
  const sys = profile?.divSystem || 'zodiac'
  if (sys === 'bazi') {
    if (!profile?.birth) {
      return zh
        ? '【陛下未賜生辰，改以時勢氣運泛論，不必強推八字。】\n'
        : '[No birth data was given. Speak of the temper of the age instead; do not invent a chart.]\n'
    }
    const hour = profile.hour ? `，${profile.hour}時` : '，時辰未詳'
    return zh
      ? `【術數】中式八字。【陛下生辰】西元${profile.birth}${hour}。\n`
      : `[System] Chinese Bazi. [Birth] ${profile.birth}${profile.hour ? `, hour of the ${profile.hour}` : ', hour unknown'}. Read the four pillars and the five elements.\n`
  }
  const sign = profile?.zodiac
    ? ZODIAC.find((z) => z.id === profile.zodiac)
    : zodiacOf(profile?.birth)
  if (!sign) {
    return zh
      ? '【陛下未賜星宮，改以時勢氣運泛論，不必強推星盤。】\n'
      : '[No star sign was given. Speak of the temper of the age instead; do not invent a chart.]\n'
  }
  return zh
    ? `【術數】西洋占星。【陛下星宮】${sign.zh}${profile?.birth ? `（生於${profile.birth}）` : ''}。請依星座性格與當下星象論之。\n`
    : `[System] Western astrology. [Sign] ${sign.en}${profile?.birth ? ` (born ${profile.birth})` : ''}. Read the character of the sign and the present conjunctions.\n`
}

function prevNote(court, prev) {
  if (!prev) return ''
  return court.lang === 'zh'
    ? `【前次朝議實錄摘要】\n${clip(prev, 1200)}\n\n`
    : `[Summary of the previous council]\n${clip(prev, 1200)}\n\n`
}

export function buildTurnPrompt(court, official, edict, turns, profile, prev) {
  const zh = court.lang === 'zh'
  const style = official.faction === 'harem' ? court.haremStyle : court.style
  const system = `${official.persona}\n\n${style}`
  const head = zh ? '【聖諭】' : '[The question before the throne]'
  const body = zh ? '【本殿先前奏對】' : '[What has been said in the chamber so far]'
  const cue =
    official.faction === 'harem'
      ? zh ? '簾後此刻遞出你的箋子，請發言。' : 'A note passes from behind the arras. Speak.'
      : zh ? '現在輪到你出列奏對。' : 'It is your turn to rise and speak.'
  const user =
    prevNote(court, prev) +
    rulerNote(court, profile) +
    `${head}\n${edict}\n\n${body}\n${transcript(court, turns)}\n\n` +
    divinerNote(court, official, profile) +
    cue
  return { system, user }
}

export function buildHistorianPrompt(court, edict, turns, profile, prev) {
  const zh = court.lang === 'zh'
  const head = zh ? '【聖諭】' : '[The question]'
  const body = zh ? '【本次朝議全記錄】' : '[The full record of the council]'
  const cue = zh ? '朝議已畢，請執筆寫實錄。' : 'The council has risen. Take up the pen.'
  const user =
    prevNote(court, prev) +
    rulerNote(court, profile) +
    `${head}\n${edict}\n\n${body}\n${transcript(court, turns, 900)}\n\n${cue}`
  return { system: court.historianSystem, user }
}

export function buildRegentPrompt(court, edict, turns, profile, prev) {
  const zh = court.lang === 'zh'
  const head = zh ? '【聖諭】' : '[The question]'
  const body = zh ? '【眾臣奏對】' : '[The counsel given]'
  const cue = zh ? '陛下乏了，請王爺代行聖裁。' : 'The sovereign is weary. Rule in their stead.'
  const user =
    prevNote(court, prev) +
    rulerNote(court, profile) +
    `${head}\n${edict}\n\n${body}\n${transcript(court, turns)}\n\n${cue}`
  return { system: court.regentSystem, user }
}
