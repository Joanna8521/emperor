import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UI, HAREM_FREQ, HOURS_ZH, ZODIAC, zodiacOf } from '../courts'
import { PROVIDERS } from '../llm'

function Modal({ title, children, onClose, closeLabel }) {
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
              {closeLabel}
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── 虎符 / Keys ────────────────────────────────────────────
export function SettingsPanel({ settings, lang, onSave, onClose }) {
  const t = UI[lang]
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(settings)))
  const [reveal, setReveal] = useState({})

  const setKey = (p, v) => setDraft((d) => ({ ...d, keys: { ...d.keys, [p]: v } }))
  const setModel = (p, v) => setDraft((d) => ({ ...d, models: { ...d.models, [p]: v } }))

  return (
    <Modal title={t.settingsTitle} onClose={onClose} closeLabel={t.close}>
      <p className="hint">{t.settingsHint}</p>
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
            <button className="btn ghost small" onClick={() => setReveal((r) => ({ ...r, [p]: !r[p] }))}>
              {reveal[p] ? t.hide : t.show}
            </button>
          </div>
          <div className="field-row">
            <span className="field-sub">{t.model}</span>
            <input type="text" value={draft.models[p]} onChange={(e) => setModel(p, e.target.value.trim())} />
          </div>
        </div>
      ))}
      <div className="field-group">
        <label className="field-label">{t.defaultProvider}</label>
        <select
          value={draft.defaultProvider}
          onChange={(e) => setDraft((d) => ({ ...d, defaultProvider: e.target.value }))}
        >
          {Object.entries(PROVIDERS).map(([p, meta]) => (
            <option key={p} value={p}>{meta.label}</option>
          ))}
        </select>
      </div>
      <div className="modal-actions">
        <button className="btn primary" onClick={() => onSave(draft)}>{t.saveKeys}</button>
      </div>
    </Modal>
  )
}

function MusterRow({ official, row, t, onToggle, onProv }) {
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
      <select value={row?.provider || ''} onChange={(e) => onProv(e.target.value)} title={t.provTip}>
        <option value="">{t.provDefault}</option>
        {Object.entries(PROVIDERS).map(([p, meta]) => (
          <option key={p} value={p}>{meta.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── 點將 / Summon ──────────────────────────────────────────
export function MusterPanel({ court, roster, profile, onSave, onClose }) {
  const t = UI[court.lang]
  const [rDraft, setRDraft] = useState(() => JSON.parse(JSON.stringify(roster)))
  const [pDraft, setPDraft] = useState(() => ({ ...profile }))

  const toggle = (id) => setRDraft((r) => ({ ...r, [id]: { ...r[id], enabled: !r[id]?.enabled } }))
  const setProv = (id, v) => setRDraft((r) => ({ ...r, [id]: { ...r[id], provider: v } }))
  const setP = (k, v) => setPDraft((p) => ({ ...p, [k]: v }))

  const courtCount = court.officials.filter((o) => rDraft[o.id]?.enabled).length
  const haremCount = court.harem.filter((h) => rDraft[h.id]?.enabled).length
  const sys = pDraft.divSystem || 'zodiac'
  const auto = zodiacOf(pDraft.birth)

  return (
    <Modal title={t.musterTitle} onClose={onClose} closeLabel={t.close}>
      <p className="hint">{t.musterHint(courtCount, haremCount)}</p>

      <h3 className="muster-section">{t.sectionCourt}</h3>
      <div className="muster-list">
        {court.officials.map((o) => (
          <MusterRow key={o.id} official={o} row={rDraft[o.id]} t={t}
            onToggle={() => toggle(o.id)} onProv={(v) => setProv(o.id, v)} />
        ))}
      </div>

      <h3 className="muster-section harem">{t.sectionHarem}</h3>
      <p className="hint">{t.haremHint}</p>
      <div className="muster-list">
        {court.harem.map((h) => (
          <MusterRow key={h.id} official={h} row={rDraft[h.id]} t={t}
            onToggle={() => toggle(h.id)} onProv={(v) => setProv(h.id, v)} />
        ))}
      </div>
      <div className="field-group">
        <label className="field-label">{t.freqLabel}</label>
        <div className="freq-pills">
          {Object.keys(HAREM_FREQ).map((k) => (
            <button key={k} className={`freq-pill ${pDraft.haremFreq === k ? 'on' : ''}`}
              onClick={() => setP('haremFreq', k)}>
              {t.freq[k]}
            </button>
          ))}
        </div>
      </div>

      <h3 className="muster-section">{t.sectionRuler}</h3>
      <div className="field-group">
        <label className="field-label">{t.rulerFace}</label>
        <div className="field-row">
          <select value={pDraft.gender || 'm'} onChange={(e) => setP('gender', e.target.value)}>
            <option value="m">{t.rulerM}</option>
            <option value="f">{t.rulerF}</option>
          </select>
          <input type="text" placeholder={t.rulerName} value={pDraft.title || ''}
            onChange={(e) => setP('title', e.target.value)} />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label">{t.rulerBg}</label>
        <textarea rows={2} placeholder={t.rulerBgPh} value={pDraft.background || ''}
          onChange={(e) => setP('background', e.target.value)} />
      </div>

      <div className="field-group">
        <label className="field-label">{t.divTitle}</label>
        <div className="freq-pills">
          <button className={`freq-pill ${sys === 'zodiac' ? 'on' : ''}`} onClick={() => setP('divSystem', 'zodiac')}>
            {t.divZodiac}
          </button>
          <button className={`freq-pill ${sys === 'bazi' ? 'on' : ''}`} onClick={() => setP('divSystem', 'bazi')}>
            {t.divBazi}
          </button>
        </div>
        <div className="field-row" style={{ marginTop: 10 }}>
          <input type="date" value={pDraft.birth || ''} onChange={(e) => setP('birth', e.target.value)} />
          {sys === 'bazi' ? (
            <select value={pDraft.hour || ''} onChange={(e) => setP('hour', e.target.value)}>
              <option value="">{t.hourUnknown}</option>
              {HOURS_ZH.map((h) => (
                <option key={h} value={h}>{h}時</option>
              ))}
            </select>
          ) : (
            <select value={pDraft.zodiac || ''} onChange={(e) => setP('zodiac', e.target.value)}>
              <option value="">
                {auto ? `${court.lang === 'zh' ? auto.zh : auto.en}${court.lang === 'zh' ? '（自動）' : ' (auto)'}` : t.zodiacPick}
              </option>
              {ZODIAC.map((z) => (
                <option key={z.id} value={z.id}>{court.lang === 'zh' ? z.zh : z.en}</option>
              ))}
            </select>
          )}
        </div>
        <p className="field-sub">{t.divFoot}</p>
      </div>

      <div className="modal-actions">
        <button className="btn primary" onClick={() => onSave(rDraft, pDraft)}>{t.saveMuster}</button>
      </div>
    </Modal>
  )
}
