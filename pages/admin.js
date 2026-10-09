import Head from 'next/head'
import { useEffect, useState } from 'react'

export async function getServerSideProps({ req, res }) {
  const { isAdminAuthorized, rejectAdmin, setAdminHeaders } = await import('@/lib/admin/auth')
  if (!await isAdminAuthorized(req.headers.authorization)) {
    rejectAdmin(res)
    return { props: { authorized: false } }
  }
  setAdminHeaders(res)
  return { props: { authorized: true } }
}

export default function Admin({ authorized }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [commitUrl, setCommitUrl] = useState('')

  async function load() {
    setStatus('載入中…')
    try {
      const response = await fetch('/api/admin/home', { cache: 'no-store', credentials: 'same-origin' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '讀取失敗，請重新登入')
      setData(result)
      setStatus('')
    } catch (error) { setStatus(error.message) }
  }

  useEffect(() => {
    if (authorized) void load()
  }, [authorized])

  async function publish(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setCommitUrl('')
    setStatus('正在發布…')
    try {
      const response = await fetch('/api/admin/home', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '發布失敗')
      setData(previous => ({ ...previous, sha: result.sha }))
      setCommitUrl(result.commitUrl || '')
      setStatus(result.unchanged ? '內容沒有變更。' : '已發布。網站重新部署完成後，首頁就會更新。')
    } catch (error) { setStatus(error.message) }
    finally { setSaving(false) }
  }

  if (!authorized) return null

  const fields = [
    ['heroLabel', '首頁小標', 200, 1],
    ['heroTitle', '首頁大標題（可換行）', 500, 3],
    ['heroDescription', '首頁介紹', 3000, 4],
    ['notesButton', '文章按鈕文字', 100, 1],
    ['projectsButton', '專案按鈕文字', 100, 1],
    ['welcomeLabel', '歡迎區小標', 200, 1],
    ['welcomeTitle', '歡迎標題', 500, 2],
    ['welcomeDescription', '歡迎介紹', 3000, 4],
    ['activityLabel', '程式活動小標', 200, 1],
    ['activityTitle', '程式活動標題', 200, 1],
    ['notesLabel', '精選文章小標', 200, 1],
    ['notesTitle', '精選文章標題', 200, 1],
    ['projectsLabel', '精選專案小標', 200, 1],
    ['projectsTitle', '精選專案標題', 200, 1],
    ['pageTitle', '瀏覽器／搜尋引擎標題', 200, 1],
    ['pageDescription', '搜尋引擎摘要', 1000, 3]
  ]

  return (
    <main className='homepage-admin'>
      <Head><title>首頁編輯後台</title><meta name='robots' content='noindex,nofollow' /></Head>
      <h1>首頁編輯後台</h1>
      <p>編輯目前筆記本首頁的文字。文章與專案列表仍會從 Notion 和 GitHub 更新。</p>
      {data && (
        <form onSubmit={event => { void publish(event) }}>
          {fields.map(([key, label, maximum, rows]) => (
            <label key={key} className='field'>
              <span>{label}</span>
              <textarea value={data[key]} rows={rows} maxLength={maximum} disabled={saving}
                required={['pageTitle', 'heroTitle', 'welcomeTitle', 'notesButton', 'projectsButton'].includes(key)}
                onChange={event => setData(previous => ({ ...previous, [key]: event.target.value }))} />
            </label>
          ))}
          <button type='submit' disabled={saving}>{saving ? '發布中…' : '發布修改'}</button>
          <a href='/' target='_blank' rel='noreferrer'>查看首頁</a>
        </form>
      )}
      <p role='status' aria-live='polite'>{status}</p>
      {commitUrl && <p><a href={commitUrl} target='_blank' rel='noreferrer'>查看發布紀錄</a></p>}
      <button type='button' disabled={saving} onClick={() => void load()}>重新載入最新內容</button>
      <style jsx>{`
        .homepage-admin { max-width: 820px; margin: 40px auto; padding: 24px; color: #202020; background: #fff; border-radius: 12px; }
        h1 { font-size: 28px; font-weight: 700; }
        p { margin: 16px 0; }
        .field { display: block; margin: 22px 0; }
        .field span { display: block; margin-bottom: 8px; font-weight: 600; }
        textarea { width: 100%; padding: 12px; border: 1px solid #aaa; border-radius: 6px; color: #202020; background: #fff; }
        .toggle { display: flex; gap: 10px; margin-top: 24px; align-items: flex-start; }
        button { padding: 10px 18px; border: 1px solid #777; border-radius: 6px; cursor: pointer; margin-right: 18px; }
        button:disabled { opacity: .5; cursor: wait; }
        a { color: #185baf; text-decoration: underline; }
      `}</style>
    </main>
  )
}
