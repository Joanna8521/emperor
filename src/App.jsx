import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  COURT_LIST, getCourt, rosterFor, indexFor, UI, HAREM_FREQ,
  buildTurnPrompt, buildHistorianPrompt, buildRegentPrompt,
} from './courts'
import { streamText, DEFAULT_MODELS } from './llm'
import { Plaque, EdictCard, SpeechCard, FengjianCard, RecordCard, ErrorCard } from './components/ui'
import { SettingsPanel, MusterPanel } from './components/panels'

const load = (k, fb) => {
  try {
    const v = localStorage.getItem(k)
    return v ? { ...fb, ...JSON.parse(v) } : fb
  } catch {
    return fb
  }
}
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const defaultSettings = () => ({
  keys: { anthropic: '', openai: '', gemini: '' },
  models: { ...DEFAULT_MODELS },
  defaultProvider: 'anthropic',
})
const defaultProfile = () => ({
  title: '', gender: 'm', background: '',
  divSystem: 'zodiac', birth: '', hour: '', zodiac: '',
  haremFreq: 'some',
})

let seq = 0
const uid = () => `e${Date.now()}_${seq++}`
const TAG = { anthropic: 'Claude', openai: 'GPT', gemini: 'Gemini' }

export default function App() {
  const [courtId, setCourtId] = useState(() => localStorage.getItem('emperor.court') || '')
  const court = getCourt(courtId || 'east')
  const t = UI[court.lang]
  const idx = useMemo(() => indexFor(court), [court])

  const [settings, setSettings] = useState(() => load('emperor.settings', defaultSettings()))
  const [roster, setRoster] = useState(() => load(`emperor.roster.${court.id}`, rosterFor(court)))
  const [profile, setProfile] = useState(() => load(`emperor.profile.${court.id}`, defaultProfile()))
  const [showSettings, setShowSettings] = useState(false)
  const [showMuster, setShowMuster] = useState(false)
  const [feed, setFeed] = useState([])
  const [running, setRunning] = useState(false)
  const [speaker, setSpeaker] = useState(null)
  const [regentOut, setRegentOut] = useState(false)
  const [input, setInput] = useState('')

  const ctrl = useRef(null)
  const mode = useRef('run')
  const lastRecord = useRef('')
  const feedRef = useRef(null)

  const hasKey = Object.values(settings.keys).some(Boolean)

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [feed])

  const enterCourt = (id) => {
    setCourtId(id)
    localStorage.setItem('emperor.court', id)
    const c = getCourt(id)
    setRoster(load(`emperor.roster.${id}`, rosterFor(c)))
    setProfile(load(`emperor.profile.${id}`, defaultProfile()))
    setFeed([])
    lastRecord.current = ''
  }

  const leaveCourt = () => {
    if (running) return
    setCourtId('')
    localStorage.removeItem('emperor.court')
    setFeed([])
    lastRecord.current = ''
  }

  const conn = (id) => {
    let p = roster[id]?.provider || settings.defaultProvider
    if (!settings.keys[p]) p = Object.keys(settings.keys).find((k) => settings.keys[k]) || p
    return { provider: p, model: settings.models[p], apiKey: settings.keys[p] }
  }

  const speakOne = async (official, prompts, kind = 'speech') => {
    const id = uid()
    const c = conn(official.id)
    const tag = `${TAG[c.provider] || c.provider}・${c.model}`
    setFeed((f) => [...f, { id, kind, off: official.id, text: '', done: false, tag }])
    setSpeaker(official.id)
    let acc = ''
    try {
      const maxTokens = kind === 'record' ? 1600 : 1000
      for await (const ch of streamText({ ...c, ...prompts, maxTokens, signal: ctrl.current.signal })) {
        acc += ch
        setFeed((f) => f.map((e) => (e.id === id ? { ...e, text: acc } : e)))
      }
      setFeed((f) => f.map((e) => (e.id === id ? { ...e, done: true } : e)))
      return { ok: true, name: official.name, text: acc }
    } catch (err) {
      if (err.name === 'AbortError') {
        setFeed((f) => f.map((e) => (e.id === id ? { ...e, done: true } : e)))
        return { ok: false, name: official.name, text: acc }
      }
      setFeed((f) => [
        ...f.map((e) => (e.id === id ? { ...e, done: true } : e)),
        { id: uid(), kind: 'error', off: official.id, text: String(err.message || err) },
      ])
      return { ok: false, name: official.name, text: acc }
    }
  }

  const runCourt = async (edict, { regentOnly = false } = {}) => {
    setRunning(true)
    mode.current = regentOnly ? 'regent' : 'run'
    ctrl.current = new AbortController()
    setFeed((f) => [...f, { id: uid(), kind: 'edict', text: edict, gender: profile.gender }])

    const turns = []
    const order = court.speakOrder.filter((id) => roster[id]?.enabled).map((id) => idx[id])
    const freqP = HAREM_FREQ[profile.haremFreq] ?? 0
    const pool = court.interjectors.filter((id) => roster[id]?.enabled)
    const used = new Set()

    const maybeInterject = async () => {
      if (mode.current !== 'run' || freqP <= 0) return
      const cand = pool.filter((id) => !used.has(id))
      if (!cand.length || Math.random() >= freqP) return
      const who = idx[cand[Math.floor(Math.random() * cand.length)]]
      used.add(who.id)
      const r = await speakOne(who, buildTurnPrompt(court, who, edict, turns, profile, lastRecord.current), 'fengjian')
      if (r.text) turns.push({ name: r.name, text: r.text })
    }

    const censorId = court.speakOrder[court.speakOrder.length - 1]

    for (const off of order) {
      if (mode.current !== 'run') break
      const r = await speakOne(off, buildTurnPrompt(court, off, edict, turns, profile, lastRecord.current))
      if (r.text) turns.push({ name: r.name, text: r.text })
      if (mode.current !== 'run') break
      if (off.id !== censorId) await maybeInterject()
    }

    // 太后 / Queen Mother 壓軸垂簾
    const matriarch = court.harem.find((h) => h.isMatriarch)
    if (mode.current === 'run' && matriarch && roster[matriarch.id]?.enabled) {
      const r = await speakOne(matriarch, buildTurnPrompt(court, matriarch, edict, turns, profile, lastRecord.current), 'fengjian')
      if (r.text) turns.push({ name: r.name, text: r.text })
    }

    if (mode.current === 'regent') {
      ctrl.current = new AbortController()
      setRegentOut(true)
      const r = await speakOne(court.regent, buildRegentPrompt(court, edict, turns, profile, lastRecord.current))
      if (r.text) turns.push({ name: r.name, text: r.text })
    }

    if (turns.length) {
      ctrl.current = new AbortController()
      const r = await speakOne(court.historian, buildHistorianPrompt(court, edict, turns, profile, lastRecord.current), 'record')
      if (r.ok && r.text) lastRecord.current = r.text
    }

    setRunning(false)
    setSpeaker(null)
    setRegentOut(false)
  }

  const submit = (regentOnly = false) => {
    const text = input.trim()
    if (!text || running) return
    if (!hasKey) {
      setShowSettings(true)
      return
    }
    setInput('')
    runCourt(text, { regentOnly })
  }

  const heraldic = court.id === 'west'
  const enabled = court.speakOrder.filter((id) => roster[id]?.enabled)
  const left = enabled.filter((id) => ['civil', 'advisor'].includes(idx[id].faction))
  const right = enabled.filter((id) => ['military', 'secret', 'censor'].includes(idx[id].faction))
  const veil = court.harem.filter((h) => roster[h.id]?.enabled).map((h) => h.id)
  const pState = (id) => (!running ? 'idle' : speaker === id ? 'speaking' : 'dim')

  // ─── 擇廷門面 ─────────────────────────────────────────────
  if (!courtId) {
    return (
      <div className="gate">
        <motion.div className="gate-board wide" initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="gate-eyebrow">擇一朝堂・Choose your court</p>
          <h1 className="gate-title dual">
            <span>百官朝議</span>
            <span className="slash">／</span>
            <span className="en">The Privy Council</span>
          </h1>
          <div className="court-pick">
            <button className="court-card east" onClick={() => enterCourt('east')}>
              <div className="court-faces">
                <img src="/avatars/shoufu.png" alt="" />
                <img src="/avatars/emperor_m.png" alt="" />
                <img src="/avatars/yushi.png" alt="" />
              </div>
              <h2>明代朝堂</h2>
              <p>中文・六部尚書、東廠錦衣衛、後宮干政、欽天監論八字</p>
              <span className="court-go">入殿面聖</span>
            </button>
            <button className="court-card west" onClick={() => enterCourt('west')}>
              <div className="court-faces">
                <img src="/avatars/chancellor.png" alt="" />
                <img src="/avatars/king.png" alt="" />
                <img src="/avatars/jester.png" alt="" />
              </div>
              <h2>The Royal Court</h2>
              <p>English・Privy councillors, a Spymaster, a Jester who spares no one, and an Astronomer Royal who reads your stars</p>
              <span className="court-go">Enter the Chamber</span>
            </button>
          </div>
          <p className="gate-foot">{UI.zh.gateFoot}</p>
        </motion.div>
      </div>
    )
  }

  // ─── 入殿（未配 key） ─────────────────────────────────────
  if (!hasKey) {
    return (
      <div className="gate">
        <motion.div className="gate-board" initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}>
          <p className="gate-eyebrow">{court.sub}</p>
          <h1 className="gate-title">{t.gateTitle}</h1>
          <p className="gate-sub">{t.gateSub}</p>
          <div className="gate-actions">
            <button className="btn primary big" onClick={() => setShowSettings(true)}>{t.gateKey}</button>
            <button className="btn ghost" onClick={leaveCourt}>{t.switchCourt}</button>
          </div>
          <p className="gate-foot">{t.gateFoot}</p>
        </motion.div>
        {showSettings && (
          <SettingsPanel settings={settings} lang={court.lang} onClose={() => setShowSettings(false)}
            onSave={(d) => { setSettings(d); save('emperor.settings', d); setShowSettings(false) }} />
        )}
      </div>
    )
  }

  const rulerAvatar = court.rulerAvatars[profile.gender] || ''

  return (
    <div className={`hall ${heraldic ? 'west' : ''}`}>
      <header className="hall-head">
        <button className="btn ghost" onClick={() => setShowSettings(true)}>{t.settings}</button>
        <button className="hall-board" onClick={leaveCourt} title={t.switchCourt}>
          <h1>{t.hall}</h1>
          <p>{profile.title ? t.hallSubTitled(profile.title) : t.hallSub}</p>
        </button>
        <button className="btn ghost" onClick={() => setShowMuster(true)}>{t.muster}</button>
      </header>

      <section className="ban">
        <div className="ban-side">
          {left.map((id) => <Plaque key={id} official={idx[id]} state={pState(id)} heraldic={heraldic} />)}
        </div>
        <div className="ban-center">
          <AnimatePresence>
            {regentOut && (
              <motion.div key="regent" initial={{ opacity: 0, y: -30, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
                <Plaque official={court.regent} state={speaker === court.regent.id ? 'speaking' : 'idle'} heraldic={heraldic} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="ban-side right">
          {right.map((id) => <Plaque key={id} official={idx[id]} state={pState(id)} heraldic={heraldic} />)}
          <Plaque official={court.historian} state={pState(court.historian.id)} heraldic={heraldic} />
          {veil.length > 0 && (
            <div className="veil">
              <span className="veil-label">{t.veil}</span>
              <div className="veil-row">
                {veil.map((id) => <Plaque key={id} official={idx[id]} state={pState(id)} heraldic={heraldic} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="feed" ref={feedRef}>
        {feed.length === 0 && (
          <div className="feed-empty">
            <p>{t.emptyA}</p>
            <p>{t.emptyB}</p>
          </div>
        )}
        {feed.map((e) => {
          const off = idx[e.off]
          if (e.kind === 'edict')
            return <EdictCard key={e.id} text={e.text} avatar={court.rulerAvatars[e.gender] || ''} label={t.edictLabel} char={court.lang === 'zh' ? '諭' : '♛'} />
          if (e.kind === 'fengjian') return <FengjianCard key={e.id} entry={e} official={off} />
          if (e.kind === 'record') return <RecordCard key={e.id} entry={e} t={t} char={court.historian.char} />
          if (e.kind === 'error') return <ErrorCard key={e.id} entry={e} official={off} t={t} />
          return (
            <SpeechCard key={e.id} entry={e} official={off}
              isCensor={off.faction === 'censor'} isRegent={off.id === court.regent.id} />
          )
        })}
      </main>

      <footer className="throne">
        {rulerAvatar && <img className="throne-face" src={rulerAvatar} alt="" />}
        <textarea
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          rows={2}
          disabled={running}
        />
        <div className="throne-actions">
          {running ? (
            <>
              <button className="btn regent-btn" onClick={() => { mode.current = 'regent'; ctrl.current?.abort() }}
                disabled={regentOut || speaker === court.historian.id}>
                {t.lazy}
              </button>
              <button className="btn danger" onClick={() => { mode.current = 'dismiss'; ctrl.current?.abort() }}>
                {t.dismiss}
              </button>
            </>
          ) : (
            <>
              <button className="btn primary" onClick={() => submit()} disabled={!input.trim()}>{t.submit}</button>
              <button className="btn regent-btn" onClick={() => submit(true)} disabled={!input.trim()}>{t.lazy}</button>
            </>
          )}
        </div>
      </footer>

      {showSettings && (
        <SettingsPanel settings={settings} lang={court.lang} onClose={() => setShowSettings(false)}
          onSave={(d) => { setSettings(d); save('emperor.settings', d); setShowSettings(false) }} />
      )}
      {showMuster && (
        <MusterPanel court={court} roster={roster} profile={profile} onClose={() => setShowMuster(false)}
          onSave={(r, p) => {
            setRoster(r); setProfile(p)
            save(`emperor.roster.${court.id}`, r)
            save(`emperor.profile.${court.id}`, p)
            setShowMuster(false)
          }} />
      )}
    </div>
  )
}
