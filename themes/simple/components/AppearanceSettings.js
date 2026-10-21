import options from '@/data/appearance-options.json'
import { APPEARANCE } from '@/blog.config'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef, useState } from 'react'

const fontStacks = {
  'noto-sans-tc': "'Noto Sans TC', sans-serif",
  genseki: "'GenSeki Gothic TW', sans-serif",
  'noto-serif-tc': "'Noto Serif TC', serif",
  huninn: "'Huninn', sans-serif",
  gensen: "'GenSen Rounded TW', sans-serif",
  chenyu: "'Reader LuoYan Web', serif"
}
const googleFonts = {
  'noto-sans-tc': 'Noto+Sans+TC:wght@400;500;600;700',
  'noto-serif-tc': 'Noto+Serif+TC:wght@400;500;600;700',
  huninn: 'Huninn'
}

export default function AppearanceSettings() {
  const dialog = useRef(null)
  const { isDarkMode, toggleDarkMode } = useGlobal()
  const [font, setFont] = useState('default')
  const [mode, setMode] = useState('system')
  const [codeTheme, setCodeTheme] = useState('auto')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      setFont(localStorage.getItem('blog_font_v1') || 'default')
      const legacyDark = localStorage.getItem('darkMode')
      setMode(
        localStorage.getItem('blog_mode_v1') ||
          (legacyDark === 'true'
            ? 'dark'
            : legacyDark === 'false'
              ? 'light'
              : APPEARANCE === 'auto'
                ? 'system'
                : APPEARANCE === 'dark'
                  ? 'dark'
                  : 'light')
      )
      setCodeTheme(localStorage.getItem('blog_code_theme_v1') || 'auto')
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const selected = fontStacks[font] ? font : 'default'
    if (
      googleFonts[selected] &&
      !document.getElementById(`blog-font-${selected}`)
    ) {
      const link = document.createElement('link')
      link.id = `blog-font-${selected}`
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${googleFonts[selected]}&display=swap`
      document.head.appendChild(link)
    }
    document.documentElement.style.setProperty(
      '--reader-font',
      fontStacks[selected] || 'inherit'
    )
    document.documentElement.dataset.readerFont = selected
    try {
      localStorage.setItem('blog_font_v1', selected)
    } catch {}
  }, [font, loaded])

  useEffect(() => {
    if (!loaded) return
    const theme =
      options.codeThemes.find(item => item.id === codeTheme) ||
      options.codeThemes.find(
        item => item.id === (isDarkMode ? 'dark-2026' : 'light-2026')
      )
    const root = document.documentElement
    Object.entries(options.palettes[theme.palette]).forEach(([key, value]) => {
      root.style.setProperty(`--code-${key}`, value)
    })
    root.dataset.codeTheme = theme.id
    try {
      localStorage.setItem('blog_code_theme_v1', codeTheme)
    } catch {}
  }, [codeTheme, isDarkMode, loaded])

  useEffect(() => {
    if (!loaded) return
    const preferredDark =
      mode === 'dark' ||
      (mode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDarkMode !== preferredDark) toggleDarkMode()
    try {
      localStorage.setItem('blog_mode_v1', mode)
    } catch {}
    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (media.matches !== isDarkMode) toggleDarkMode()
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode, isDarkMode, toggleDarkMode, loaded])

  return (
    <>
      <button
        className='appearance-trigger'
        aria-label='外觀設定'
        title='外觀設定'
        onClick={() => dialog.current?.showModal()}
      >
        ⚙
      </button>
      <dialog ref={dialog} className='appearance-dialog' aria-label='外觀設定'>
        <button
          className='appearance-close'
          aria-label='關閉'
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <h2>外觀設定</h2>
        <label>
          網站字體
          <select value={font} onChange={event => setFont(event.target.value)}>
            {options.fonts.map(item => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          背景主題
          <select value={mode} onChange={event => setMode(event.target.value)}>
            <option value='system'>跟隨系統</option>
            <option value='light'>淺色</option>
            <option value='dark'>深色</option>
          </select>
        </label>
        <label>
          程式碼主題
          <select
            value={codeTheme}
            onChange={event => setCodeTheme(event.target.value)}
          >
            <option value='auto'>自動（配合背景）</option>
            {['淺色', '深色', '高對比'].map(group => (
              <optgroup key={group} label={group}>
                {options.codeThemes
                  .filter(item => item.group === group)
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </dialog>
    </>
  )
}
