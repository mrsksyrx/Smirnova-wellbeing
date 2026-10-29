import { useEffect, useRef, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type AccentName = 'rose' | 'purple' | 'blue' | 'red' | 'green' | 'gray'

type Appearance = {
  mode: ThemeMode
  accent: AccentName
}

const STORAGE_KEY = 'wellbeing-appearance'

const ACCENTS: Array<{ id: AccentName; label: string; swatch: string }> = [
  { id: 'rose', label: '玫红', swatch: '#e8558e' },
  { id: 'purple', label: '紫色', swatch: '#8000ff' },
  { id: 'blue', label: '蓝色', swatch: '#4fc3f7' },
  { id: 'red', label: '红色', swatch: '#ef5350' },
  { id: 'green', label: '绿色', swatch: '#66bb6a' },
  { id: 'gray', label: '灰色', swatch: '#9e9e9e' },
]

const MODES: Array<{ id: ThemeMode; label: string }> = [
  { id: 'system', label: '跟随系统' },
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
]

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isAccentName(value: unknown): value is AccentName {
  return ACCENTS.some((accent) => accent.id === value)
}

function readAppearance(): Appearance {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Appearance>
    return {
      mode: isThemeMode(stored.mode) ? stored.mode : 'light',
      accent: isAccentName(stored.accent) ? stored.accent : 'rose',
    }
  } catch {
    return { mode: 'light', accent: 'rose' }
  }
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyAppearance(appearance: Appearance) {
  const root = document.documentElement
  const theme = resolveTheme(appearance.mode)
  root.dataset.mode = appearance.mode
  root.dataset.theme = theme
  root.dataset.accent = appearance.accent

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = theme === 'dark' ? '#251e24' : '#fce8ef'
}

export function AppearanceControl({ compact = false }: { compact?: boolean }) {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyAppearance(appearance)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
    } catch {
      // The selected appearance still applies for this page view.
    }
  }, [appearance])

  useEffect(() => {
    if (appearance.mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyAppearance(appearance)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [appearance])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className={`appearance-control${compact ? ' appearance-control--compact' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="appearance-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="打开主题设置"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`appearance-dot appearance-dot--${appearance.accent}`} aria-hidden="true" />
        主题
      </button>
      {open && (
        <div className="appearance-menu" role="dialog" aria-label="外观设置">
          <div className="appearance-section">
            <span className="appearance-label">外观</span>
            <div className="appearance-segments" role="radiogroup" aria-label="显示模式">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={appearance.mode === mode.id}
                  className={`appearance-segment${appearance.mode === mode.id ? ' is-selected' : ''}`}
                  onClick={() => setAppearance((current) => ({ ...current, mode: mode.id }))}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="appearance-section">
            <span className="appearance-label">主题色</span>
            <div className="appearance-swatches" role="radiogroup" aria-label="主题色">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  role="radio"
                  aria-checked={appearance.accent === accent.id}
                  aria-label={accent.label}
                  title={accent.label}
                  className={`appearance-swatch appearance-swatch--${accent.id}${
                    appearance.accent === accent.id ? ' is-selected' : ''
                  }`}
                  onClick={() => setAppearance((current) => ({ ...current, accent: accent.id }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

