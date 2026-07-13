import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OFFICIALS, HAREM, HAREM_FREQ } from '../officials'
import { PROVIDERS } from '../llm'

const HOURS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function Modal({ title, children, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="modal-mask"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-head">
            <h2>{title}</h2>
            <button className="btn ghost small" onClick={onClose}>
              關閉
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── 虎符：API key 與模型設定 ───────────────────────────────
export function SettingsPanel({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(settings)))
  const [reveal, setReveal] = useState({})

  const setKey = (p, v) => setDraft((d) => ({ ...d, keys: { ...d.keys, [p]: v } }))
  const setModel = (p, v) => setDraft((d) => ({ ...d, models: { ...d.models, [p]: v } }))

  return (
    <Modal title="虎符・調兵遣將之信物" onClose={onClose}>
      <p className="hint">
        API key 只存在您這台裝置的瀏覽器（localStorage），直連各家官方 API，不經任何伺服器。
        至少配一枚虎符方可上朝。
      </p>
      {Object.entries(PROVIDERS).map(([p, meta]) => (
        <div className="field-group" key={p}>
          <label className="field-label">{meta.label}</label>
          <div className="field-row">
            <input
              type={reveal[p] ? 'text' : 'password'}
              placeholder={meta.placeholder}
              value={draft.keys[p]}
              onChange={(e) => setKey(p, e.target.value.trim())}
              autoComplete="off"
            />
            <button
              className="btn ghost small"
              onClick={() => setReveal((r) => ({ ...r, [p]: !r[p] }))}
            >
              {reveal[p] ? '藏' : '示'}
            </button>
          </div>
          <div className="field-row">
            <span className="field-sub">模型</span>
            <input
              type="text"
              value={draft.models[p]}
              onChange={(e) => setModel(p, e.target.value.trim())}
            />
          </div>
        </div>
      ))}
      <div className="field-group">
        <label className="field-label">預設供應商（未個別指派的官員由此家出任）</label>
        <select
          value={draft.defaultProvider}
          onChange={(e) => setDraft((d) => ({ ...d, defaultProvider: e.target.value }))}
        >
          {Object.entries(PROVIDERS).map(([p, meta]) => (
            <option key={p} value={p}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-actions">
        <button className="btn primary" onClick={() => onSave(draft)}>
          收訖虎符
        </button>
      </div>
    </Modal>
  )
}

// ─── 點將列 ─────────────────────────────────────────────────
function MusterRow({ official, row, onToggle, onProv }) {
  return (
    <div className={`muster-row ${row?.enabled ? 'on' : ''}`}>
      <label className="muster-main">
        <input type="checkbox" checked={!!row?.enabled} onChange={onToggle} />
        {official.avatar ? (
          <img className="muster-avatar" src={official.avatar} alt={official.name} />
        ) : (
          <span className={`muster-char f-${official.faction}`}>{official.char}</span>
        )}
        <span className="muster-name">{official.name}</span>
        <span className="muster-modern">{official.modern}</span>
      </label>
      <select
        value={row?.provider || ''}
        onChange={(e) => onProv(e.target.value)}
        title="由哪家模型出任"
      >
        <option value="">依預設</option>
        {Object.entries(PROVIDERS).map(([p, meta]) => (
          <option key={p} value={p}>
            {meta.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── 點將：官員陣容、後宮干政與皇帝資料 ─────────────────────
export function MusterPanel({ roster, profile, onSave, onClose }) {
  const [rDraft, setRDraft] = useState(() => JSON.parse(JSON.stringify(roster)))
  const [pDraft, setPDraft] = useState(() => ({ ...profile }))

  const toggle = (id) =>
    setRDraft((r) => ({ ...r, [id]: { ...r[id], enabled: !r[id]?.enabled } }))
  const setProv = (id, v) =>
    setRDraft((r) => ({ ...r, [id]: { ...r[id], provider: v } }))

  const courtCount = OFFICIALS.filter((o) => rDraft[o.id]?.enabled).length
  const haremCount = HAREM.filter((h) => rDraft[h.id]?.enabled).length

  return (
    <Modal title="點將・今日誰上殿" onClose={onClose}>
      <p className="hint">
        每多一位官員或后妃發言，就多一次 API 呼叫。太史令必到（負責實錄），不在此列。
        目前朝班 {courtCount} 位、簾後 {haremCount} 位。
      </p>

      <h3 className="muster-section">朝班</h3>
      <div className="muster-list">
        {OFFICIALS.map((o) => (
          <MusterRow
            key={o.id}
            official={o}
            row={rDraft[o.id]}
            onToggle={() => toggle(o.id)}
            onProv={(v) => setProv(o.id, v)}
          />
        ))}
      </div>

      <h3 className="muster-section harem">簾後（後宮干政）</h3>
      <p className="hint">
        祖訓有云「後宮不得干政」，但祖訓就是拿來破的。皇后、貴妃與司禮監會在議政中途隨機遞鳳箋亂入；
        太后開啟即為「垂簾聽政」，固定在御史彈劾完、史官落筆前壓軸出場。
      </p>
      <div className="muster-list">
        {HAREM.map((h) => (
          <MusterRow
            key={h.id}
            official={h}
            row={rDraft[h.id]}
            onToggle={() => toggle(h.id)}
            onProv={(v) => setProv(h.id, v)}
          />
        ))}
      </div>
      <div className="field-group">
        <label className="field-label">干政頻率（皇后／貴妃／司禮監亂入的機率）</label>
        <div className="freq-pills">
          {Object.entries(HAREM_FREQ).map(([k, meta]) => (
            <button
              key={k}
              className={`freq-pill ${pDraft.haremFreq === k ? 'on' : ''}`}
              onClick={() => setPDraft((p) => ({ ...p, haremFreq: k }))}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      <h3 className="muster-section">御前</h3>
      <div className="field-group">
        <label className="field-label">聖上真容</label>
        <div className="field-row">
          <select
            value={pDraft.gender || 'm'}
            onChange={(e) => setPDraft((p) => ({ ...p, gender: e.target.value }))}
          >
            <option value="m">皇帝（男）</option>
            <option value="f">皇帝（女）</option>
          </select>
          <input
            type="text"
            placeholder="聖號（稱呼，可留白），例：永樂"
            value={pDraft.title || ''}
            onChange={(e) => setPDraft((p) => ({ ...p, title: e.target.value }))}
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label">陛下生辰（供欽天監推演八字，僅娛樂，可留白）</label>
        <div className="field-row">
          <input
            type="date"
            value={pDraft.birth || ''}
            onChange={(e) => setPDraft((p) => ({ ...p, birth: e.target.value }))}
          />
          <select
            value={pDraft.hour || ''}
            onChange={(e) => setPDraft((p) => ({ ...p, hour: e.target.value }))}
          >
            <option value="">時辰不詳</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}時
              </option>
            ))}
          </select>
        </div>
        <p className="field-sub">欽天監所言僅供娛樂參詳，切勿據以決斷大事。</p>
      </div>
      <div className="modal-actions">
        <button className="btn primary" onClick={() => onSave(rDraft, pDraft)}>
          點將完畢
        </button>
      </div>
    </Modal>
  )
}
