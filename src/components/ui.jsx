import { motion } from 'framer-motion'
import { marked } from 'marked'
import { byId, EMPEROR_AVATARS } from '../officials'

// ─── 官員立牌（Q 版立繪） ───────────────────────────────────
export function Plaque({ official, state }) {
  // state: 'speaking' | 'dim' | 'idle'
  const anim =
    state === 'speaking'
      ? { y: -14, scale: 1.16, opacity: 1 }
      : state === 'dim'
        ? { y: 0, scale: 1, opacity: 0.35 }
        : { y: 0, scale: 1, opacity: 1 }
  return (
    <motion.div
      className={`plaque f-${official.faction} ${state === 'speaking' ? 'is-speaking' : ''}`}
      animate={anim}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      title={`${official.name}｜${official.modern}`}
    >
      {official.avatar ? (
        <img className="plaque-img" src={official.avatar} alt={official.name} />
      ) : (
        <span className="plaque-char">{official.char}</span>
      )}
      <span className="plaque-name">{official.name}</span>
    </motion.div>
  )
}

// ─── 聖諭卡（皇帝發言） ─────────────────────────────────────
export function EdictCard({ text, gender }) {
  const avatar = EMPEROR_AVATARS[gender] || EMPEROR_AVATARS.m
  return (
    <motion.div
      className="card edict"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="edict-head">
        <img className="edict-avatar" src={avatar} alt="皇帝" />
        <span className="edict-title">聖諭</span>
      </div>
      <p className="card-text">{text}</p>
    </motion.div>
  )
}

// ─── 奏摺卡（官員發言） ─────────────────────────────────────
export function SpeechCard({ entry }) {
  const off = byId[entry.off]
  const impeach = off.id === 'yushi'
  const regent = off.id === 'shezheng'
  return (
    <motion.div
      className={`card speech f-${off.faction} ${impeach ? 'impeach' : ''} ${regent ? 'regent' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="speech-head">
        {off.avatar ? (
          <img className="speech-avatar" src={off.avatar} alt={off.name} />
        ) : (
          <span className="speech-seal">{off.char}</span>
        )}
        <div className="speech-who">
          <span className="speech-name">{off.name}</span>
          <span className="speech-modern">{off.modern}</span>
        </div>
        {entry.tag && <span className="speech-tag">{entry.tag}</span>}
      </div>
      <p className="card-text">
        {entry.text}
        {!entry.done && <span className="cursor">▍</span>}
      </p>
    </motion.div>
  )
}

// ─── 鳳箋（後宮干政，自右側飄入） ───────────────────────────
export function FengjianCard({ entry }) {
  const off = byId[entry.off]
  return (
    <motion.div
      className="card fengjian"
      initial={{ opacity: 0, x: 70, rotate: 2.5 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 18 }}
    >
      <span className="fengjian-label">{off.label}</span>
      <div className="speech-head">
        <img className="speech-avatar harem-ring" src={off.avatar} alt={off.name} />
        <div className="speech-who">
          <span className="speech-name">{off.name}</span>
          <span className="speech-modern">{off.modern}</span>
        </div>
        {entry.tag && <span className="speech-tag">{entry.tag}</span>}
      </div>
      <p className="card-text">
        {entry.text}
        {!entry.done && <span className="cursor">▍</span>}
      </p>
    </motion.div>
  )
}

// ─── 起居注實錄（史官捲軸） ─────────────────────────────────
export function RecordCard({ entry }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.text)
      const el = document.getElementById('copy-btn-' + entry.id)
      if (el) {
        el.textContent = '已抄錄'
        setTimeout(() => (el.textContent = '抄錄實錄'), 1600)
      }
    } catch { /* noop */ }
  }
  return (
    <motion.div
      className="scroll-wrap"
      initial={{ opacity: 0, scaleY: 0.1 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="scroll-roller top" />
      <div className="scroll-paper">
        <div className="scroll-head">
          <span className="scroll-seal">史</span>
          <span className="scroll-title">太史令・起居注</span>
          {entry.done && (
            <button id={'copy-btn-' + entry.id} className="btn ghost small" onClick={copy}>
              抄錄實錄
            </button>
          )}
        </div>
        {entry.done ? (
          <div
            className="record-body"
            dangerouslySetInnerHTML={{ __html: marked.parse(entry.text || '') }}
          />
        ) : (
          <p className="card-text record-stream">
            {entry.text}
            <span className="cursor">▍</span>
          </p>
        )}
      </div>
      <div className="scroll-roller bottom" />
    </motion.div>
  )
}

// ─── 出錯奏摺 ───────────────────────────────────────────────
export function ErrorCard({ entry }) {
  const off = entry.off ? byId[entry.off] : null
  return (
    <motion.div className="card err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="card-text">
        {off ? `${off.name}出列未果：` : '朝議受阻：'}
        {entry.text}
      </p>
    </motion.div>
  )
}
