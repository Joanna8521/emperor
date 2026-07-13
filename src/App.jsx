import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  OFFICIALS, HAREM, HISTORIAN, REGENT, SPEAK_ORDER, INTERJECTORS, HAREM_FREQ, byId,
  buildTurnPrompt, buildHistorianPrompt, buildRegentPrompt,
} from './officials'
import { streamText, DEFAULT_MODELS } from './llm'
import { Plaque, EdictCard, SpeechCard, FengjianCard, RecordCard, ErrorCard } from './components/ui'
import { SettingsPanel, MusterPanel } from './components/panels'

// ─── 本機存取 ───────────────────────────────────────────────
const load = (k, fallback) => {
  try {
    const v = localStorage.getItem(k)
    return v ? { ...fallback, ...JSON.parse(v) } : fallback
  } catch {
    return fallback
  }
}
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const defaultSettings = () => ({
  keys: { anthropic: '', openai: '', gemini: '' },
  models: { ...DEFAULT_MODELS },
  defaultProvider: 'anthropic',
})
const defaultRoster = () =>
  Object.fromEntries(
    [...OFFICIALS, ...HAREM].map((o) => [o.id, { enabled: !!o.defaultOn, provider: '' }])
  )
const defaultProfile = () => ({ title: '', gender: 'm', birth: '', hour: '', haremFreq: 'some' })

let uidSeq = 0
const uid = () => `e${Date.now()}_${uidSeq++}`

const PROVIDER_TAG = { anthropic: 'Claude', openai: 'GPT', gemini: 'Gemini' }

export default function App() {
  const [settings, setSettings] = useState(() => load('emperor.settings', defaultSettings()))
  const [roster, setRoster] = useState(() => load('emperor.roster', defaultRoster()))
  const [profile, setProfile] = useState(() => load('emperor.profile', defaultProfile()))
  const [phase, setPhase] = useState('gate')
  const [showSettings, setShowSettings] = useState(false)
  const [showMuster, setShowMuster] = useState(false)
  const [feed, setFeed] = useState([])
  const [running, setRunning] = useState(false)
  const [speaker, setSpeaker] = useState(null)
  const [regentOut, setRegentOut] = useState(false)
  const [edictInput, setEdictInput] = useState('')

  const ctrlRef = useRef(null)
  const modeRef = useRef('run') // run | regent | dismiss
  const lastRecordRef = useRef('')
  const feedRef = useRef(null)

  const hasAnyKey = Object.values(settings.keys).some(Boolean)

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [feed])

  // ─── 供應商解析：官員指派 → 預設 → 任一有 key 的 ─────────
  const resolveProvider = (officialId) => {
    let p = roster[officialId]?.provider || settings.defaultProvider
    if (!settings.keys[p]) {
      p = Object.keys(settings.keys).find((k) => settings.keys[k]) || p
    }
    return { provider: p, model: settings.models[p], apiKey: settings.keys[p] }
  }

  // ─── 單人發言（奏對／鳳箋／實錄共用） ─────────────────────
  const speakOne = async (official, prompts, kind = 'speech') => {
    const id = uid()
    const conn = resolveProvider(official.id)
    const tag = `${PROVIDER_TAG[conn.provider] || conn.provider}・${conn.model}`
    setFeed((f) => [...f, { id, kind, off: official.id, text: '', done: false, tag }])
    setSpeaker(official.id)
    let acc = ''
    try {
      const maxTokens = kind === 'record' ? 1600 : 1000
      for await (const chunk of streamText({ ...conn, ...prompts, maxTokens, signal: ctrlRef.current.signal })) {
        acc += chunk
        setFeed((f) => f.map((e) => (e.id === id ? { ...e, text: acc } : e)))
      }
      setFeed((f) => f.map((e) => (e.id === id ? { ...e, done: true } : e)))
      return { ok: true, name: official.name, text: acc }
    } catch (err) {
      if (err.name === 'AbortError') {
        setFeed((f) =>
          f.map((e) => (e.id === id ? { ...e, done: true, text: acc || '（尚未開口，即被打斷）' } : e))
        )
        return { ok: false, aborted: true, name: official.name, text: acc }
      }
      setFeed((f) => f.filter((e) => e.id !== id || acc))
      setFeed((f) => [
        ...f.map((e) => (e.id === id ? { ...e, done: true } : e)),
        { id: uid(), kind: 'error', off: official.id, text: String(err.message || err) },
      ])
      return { ok: false, name: official.name, text: acc }
    }
  }

  // ─── 一輪朝議 ─────────────────────────────────────────────
  const runCourt = async (edict) => {
    setRunning(true)
    modeRef.current = 'run'
    ctrlRef.current = new AbortController()
    setFeed((f) => [...f, { id: uid(), kind: 'edict', text: edict, gender: profile.gender }])

    const turns = []
    const order = SPEAK_ORDER.filter((oid) => roster[oid]?.enabled).map((oid) => byId[oid])

    // 干政池：已啟用的皇后／貴妃／司禮監，每人一輪至多亂入一次
    const freqP = HAREM_FREQ[profile.haremFreq]?.p ?? 0
    const pool = INTERJECTORS.filter((hid) => roster[hid]?.enabled)
    const interjected = new Set()

    const maybeInterject = async () => {
      if (modeRef.current !== 'run' || freqP <= 0) return
      const candidates = pool.filter((hid) => !interjected.has(hid))
      if (!candidates.length || Math.random() >= freqP) return
      const who = byId[candidates[Math.floor(Math.random() * candidates.length)]]
      interjected.add(who.id)
      const prompts = buildTurnPrompt(who, edict, turns, profile, lastRecordRef.current)
      const r = await speakOne(who, prompts, 'fengjian')
      if (r.text) turns.push({ name: r.name, text: r.text })
    }

    for (const off of order) {
      if (modeRef.current !== 'run') break
      const prompts = buildTurnPrompt(off, edict, turns, profile, lastRecordRef.current)
      const r = await speakOne(off, prompts)
      if (r.text) turns.push({ name: r.name, text: r.text })
      if (modeRef.current !== 'run') break
      if (off.id !== 'yushi') await maybeInterject()
    }

    // 太后垂簾聽政：御史彈劾完、史官落筆前的最後一道關卡
    if (modeRef.current === 'run' && roster.taihou?.enabled) {
      const taihou = byId.taihou
      const prompts = buildTurnPrompt(taihou, edict, turns, profile, lastRecordRef.current)
      const r = await speakOne(taihou, prompts, 'fengjian')
      if (r.text) turns.push({ name: r.name, text: r.text })
    }

    // 朕乏了 → 攝政王代行聖裁
    if (modeRef.current === 'regent') {
      ctrlRef.current = new AbortController()
      setRegentOut(true)
      const r = await speakOne(REGENT, buildRegentPrompt(edict, turns, lastRecordRef.current))
      if (r.text) turns.push({ name: REGENT.name, text: r.text })
    }

    // 太史令執筆實錄（只要有任何奏對）
    if (turns.length) {
      ctrlRef.current = new AbortController()
      const r = await speakOne(HISTORIAN, buildHistorianPrompt(edict, turns, lastRecordRef.current), 'record')
      if (r.ok && r.text) lastRecordRef.current = r.text
    }

    setRunning(false)
    setSpeaker(null)
    setRegentOut(false)
  }

  const submitEdict = () => {
    const text = edictInput.trim()
    if (!text || running) return
    if (!hasAnyKey) {
      setShowSettings(true)
      return
    }
    setEdictInput('')
    runCourt(text)
  }

  const onDismiss = () => {
    modeRef.current = 'dismiss'
    ctrlRef.current?.abort()
  }
  const onRegent = () => {
    modeRef.current = 'regent'
    ctrlRef.current?.abort()
  }

  // ─── 站班分列：文東（左）武西（右）＋簾後 ─────────────────
  const enabledIds = SPEAK_ORDER.filter((oid) => roster[oid]?.enabled)
  const civil = enabledIds.filter((oid) => ['civil', 'advisor'].includes(byId[oid].faction))
  const military = enabledIds.filter((oid) => ['military', 'secret', 'censor'].includes(byId[oid].faction))
  const harem = HAREM.filter((h) => roster[h.id]?.enabled).map((h) => h.id)

  const plaqueState = (oid) => {
    if (!running) return 'idle'
    if (speaker === oid) return 'speaking'
    return 'dim'
  }

  // ─── 入殿門面 ─────────────────────────────────────────────
  if (phase === 'gate') {
    return (
      <div className="gate">
        <motion.div
          className="gate-board"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="gate-eyebrow">奉天承運皇帝・詔百官議事</p>
          <h1 className="gate-title">百官朝議</h1>
          <p className="gate-sub">
            陛下降一道聖諭，滿朝 AI 文武輪番出列奏對：戶部算錢、兵部論戰、御史找碴、
            東廠扮敵、後宮遞鳳箋干政，最後太史令執筆，為您留下一卷可以帶走的《起居注實錄》。
          </p>
          <div className="gate-cast">
            <img src="/avatars/shoufu.png" alt="內閣首輔" />
            <img src="/avatars/hu.png" alt="戶部尚書" />
            <img src="/avatars/bing.png" alt="兵部尚書" />
            <img className="big" src="/avatars/emperor_m.png" alt="皇帝" />
            <img src="/avatars/yushi.png" alt="都察院御史" />
            <img src="/avatars/dongchang.png" alt="東廠提督" />
            <img src="/avatars/taihou.png" alt="太后" />
          </div>
          <div className="gate-actions">
            <button
              className="btn primary big"
              onClick={() => (hasAnyKey ? setPhase('hall') : setShowSettings(true))}
            >
              {hasAnyKey ? '入殿面聖' : '呈上虎符・入殿'}
            </button>
          </div>
          <p className="gate-foot">API key 只存於您的瀏覽器，直連各家官方 API，不經任何伺服器。</p>
        </motion.div>
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onClose={() => setShowSettings(false)}
            onSave={(d) => {
              setSettings(d)
              save('emperor.settings', d)
              setShowSettings(false)
              if (Object.values(d.keys).some(Boolean)) setPhase('hall')
            }}
          />
        )}
      </div>
    )
  }

  // ─── 金鑾殿 ───────────────────────────────────────────────
  return (
    <div className="hall">
      <header className="hall-head">
        <button className="btn ghost" onClick={() => setShowSettings(true)}>
          虎符
        </button>
        <div className="hall-board">
          <h1>金鑾殿</h1>
          <p>{profile.title ? `${profile.title}皇帝臨朝` : '皇帝臨朝・百官侍立'}</p>
        </div>
        <button className="btn ghost" onClick={() => setShowMuster(true)}>
          點將
        </button>
      </header>

      <section className="ban">
        <div className="ban-side">
          {civil.map((oid) => (
            <Plaque key={oid} official={byId[oid]} state={plaqueState(oid)} />
          ))}
        </div>
        <div className="ban-center">
          <AnimatePresence>
            {regentOut && (
              <motion.div
                key="regent"
                initial={{ opacity: 0, y: -30, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Plaque official={REGENT} state={speaker === REGENT.id ? 'speaking' : 'idle'} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="ban-side right">
          {military.map((oid) => (
            <Plaque key={oid} official={byId[oid]} state={plaqueState(oid)} />
          ))}
          <Plaque official={HISTORIAN} state={plaqueState(HISTORIAN.id)} />
          {harem.length > 0 && (
            <div className="veil">
              <span className="veil-label">簾後</span>
              <div className="veil-row">
                {harem.map((oid) => (
                  <Plaque key={oid} official={byId[oid]} state={plaqueState(oid)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="feed" ref={feedRef}>
        {feed.length === 0 && (
          <div className="feed-empty">
            <p>殿上寂靜無聲。</p>
            <p>陛下於下方龍案降一道聖諭，問一個您正在猶豫的決定、一個想法、一樁生意，眾卿即刻議政。</p>
          </div>
        )}
        {feed.map((entry) => {
          if (entry.kind === 'edict')
            return <EdictCard key={entry.id} text={entry.text} gender={entry.gender} />
          if (entry.kind === 'fengjian') return <FengjianCard key={entry.id} entry={entry} />
          if (entry.kind === 'record') return <RecordCard key={entry.id} entry={entry} />
          if (entry.kind === 'error') return <ErrorCard key={entry.id} entry={entry} />
          return <SpeechCard key={entry.id} entry={entry} />
        })}
      </main>

      <footer className="throne">
        <textarea
          placeholder="聖諭…（例：朕欲辭去工作、全職經營自媒體，眾卿以為如何？）"
          value={edictInput}
          onChange={(e) => setEdictInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitEdict()
          }}
          rows={2}
          disabled={running}
        />
        <div className="throne-actions">
          {running ? (
            <>
              <button
                className="btn regent-btn"
                onClick={onRegent}
                disabled={regentOut || speaker === HISTORIAN.id}
              >
                朕乏了
              </button>
              <button className="btn danger" onClick={onDismiss}>
                退朝
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={submitEdict} disabled={!edictInput.trim()}>
              宣眾臣議事
            </button>
          )}
        </div>
      </footer>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(d) => {
            setSettings(d)
            save('emperor.settings', d)
            setShowSettings(false)
          }}
        />
      )}
      {showMuster && (
        <MusterPanel
          roster={roster}
          profile={profile}
          onClose={() => setShowMuster(false)}
          onSave={(r, p) => {
            setRoster(r)
            setProfile(p)
            save('emperor.roster', r)
            save('emperor.profile', p)
            setShowMuster(false)
          }}
        />
      )}
    </div>
  )
}
