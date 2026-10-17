import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from '@/styles/notion-pencil.module.css'

const WIDTH = 1000
const HEIGHT = 1400
const COLORS = ['#17243a', '#3167db', '#dc4a4a', '#23916c', '#a05cca']
const emptyDrawing = () => ({ strokes: [] })
const storageKey = id => `notion-pencil:${id}`

function validDrawing(value) {
  return (
    value &&
    Array.isArray(value.strokes) &&
    value.strokes.length <= 10000 &&
    value.strokes.every(
      stroke =>
        ['pen', 'highlighter'].includes(stroke.tool) &&
        /^#[0-9a-f]{6}$/i.test(stroke.color) &&
        Number.isFinite(stroke.size) &&
        stroke.size > 0 &&
        stroke.size <= 80 &&
        Array.isArray(stroke.points) &&
        stroke.points.length > 0 &&
        stroke.points.length <= 20000 &&
        stroke.points.every(
          point =>
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= 0 &&
            point.x <= WIDTH &&
            point.y >= 0 &&
            point.y <= HEIGHT
        )
    )
  )
}

function strokePath(points) {
  if (points.length === 1) {
    const { x, y } = points[0]
    return `M ${x} ${y} L ${x + 0.01} ${y}`
  }
  return points
    .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
    .join(' ')
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const t =
    dx || dy
      ? Math.max(
          0,
          Math.min(
            1,
            ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)
          )
        )
      : 0
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy)
}

function hitsStroke(stroke, point) {
  const radius = Math.max(16, stroke.size / 2 + 10)
  return stroke.points.some(
    (current, index) =>
      distanceToSegment(point, current, stroke.points[index + 1] || current) <=
      radius
  )
}

export default function NotionPencil() {
  const [id, setId] = useState('')
  const [drawing, setDrawing] = useState(emptyDrawing)
  const [activeStroke, setActiveStroke] = useState(null)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(7)
  const [status, setStatus] = useState('載入中…')
  const [cloud, setCloud] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const svgRef = useRef(null)
  const fileRef = useRef(null)
  const drawingRef = useRef(drawing)
  const historyRef = useRef([])
  const futureRef = useRef([])
  const pointerRef = useRef(null)
  const activeRef = useRef(null)
  const lastPenRef = useRef(0)
  const saveTimerRef = useRef(null)
  const versionRef = useRef(null)
  const busyRef = useRef(false)
  const pendingRef = useRef(null)

  const updateDrawing = useCallback(next => {
    drawingRef.current = next
    setDrawing(next)
  }, [])

  const saveCloud = useCallback(
    async (canvasId, next) => {
      if (!cloud) return
      if (busyRef.current) {
        pendingRef.current = { canvasId, next }
        return
      }
      busyRef.current = true
      try {
        const response = await fetch(
          `/api/notion-pencil?id=${encodeURIComponent(canvasId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drawing: next, version: versionRef.current })
          }
        )
        if (response.status === 409) {
          pendingRef.current = null
          setStatus('另一裝置已更新；請重新整理並先備份目前筆跡')
          return
        }
        if (!response.ok) throw new Error('save failed')
        const result = await response.json()
        versionRef.current = result.version
        setStatus('已同步')
      } catch {
        setStatus('已存於本機；雲端同步失敗')
      } finally {
        busyRef.current = false
        if (pendingRef.current) {
          const pending = pendingRef.current
          pendingRef.current = null
          saveCloud(pending.canvasId, pending.next)
        }
      }
    },
    [cloud]
  )

  const commit = useCallback(
    next => {
      if (JSON.stringify(next) === JSON.stringify(drawingRef.current)) return
      historyRef.current = [
        ...historyRef.current.slice(-49),
        drawingRef.current
      ]
      futureRef.current = []
      setCanUndo(true)
      setCanRedo(false)
      updateDrawing(next)
      try {
        localStorage.setItem(storageKey(id), JSON.stringify(next))
        setStatus(cloud ? '同步中…' : '已存於此裝置')
      } catch {
        setStatus('本機儲存失敗；請下載 JSON 備份')
      }
      if (cloud) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null
          void saveCloud(id, next)
        }, 700)
      }
    },
    [cloud, id, saveCloud, updateDrawing]
  )

  useEffect(() => {
    const url = new URL(window.location.href)
    let canvasId = url.searchParams.get('id')
    if (!canvasId) {
      canvasId = crypto.randomUUID()
      url.searchParams.set('id', canvasId)
      window.history.replaceState(null, '', url)
    }
    setId(canvasId)
    let local = emptyDrawing()
    try {
      const parsed = JSON.parse(
        localStorage.getItem(storageKey(canvasId)) || 'null'
      )
      if (validDrawing(parsed)) local = parsed
    } catch {}
    updateDrawing(local)
    setStatus('已存於此裝置')
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        canvasId
      )
    )
      return
    fetch(`/api/notion-pencil?id=${encodeURIComponent(canvasId)}`)
      .then(async response => {
        if (response.status === 503) return null
        if (!response.ok) throw new Error('load failed')
        return response.json()
      })
      .then(result => {
        if (!result) return
        setCloud(true)
        versionRef.current = result.version
        if (result.drawing && validDrawing(result.drawing)) {
          updateDrawing(result.drawing)
          localStorage.setItem(
            storageKey(canvasId),
            JSON.stringify(result.drawing)
          )
        } else if (local.strokes.length) {
          fetch(`/api/notion-pencil?id=${encodeURIComponent(canvasId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drawing: local, version: result.version })
          })
            .then(response => response.json())
            .then(saved => {
              if (Number.isInteger(saved.version))
                versionRef.current = saved.version
            })
            .catch(() => setStatus('本機資料尚未同步；請下載 JSON 備份'))
        }
        setStatus('雲端同步已啟用')
      })
      .catch(() => setStatus('雲端載入失敗；目前使用本機資料'))
  }, [updateDrawing])

  useEffect(() => () => clearTimeout(saveTimerRef.current), [])

  useEffect(() => {
    if (!cloud || !id) return
    const refresh = async () => {
      if (
        busyRef.current ||
        pendingRef.current ||
        saveTimerRef.current ||
        pointerRef.current
      )
        return
      try {
        const response = await fetch(
          `/api/notion-pencil?id=${encodeURIComponent(id)}`
        )
        if (!response.ok) return
        const result = await response.json()
        if (
          result.version > versionRef.current &&
          validDrawing(result.drawing)
        ) {
          versionRef.current = result.version
          updateDrawing(result.drawing)
          localStorage.setItem(storageKey(id), JSON.stringify(result.drawing))
          historyRef.current = []
          futureRef.current = []
          setCanUndo(false)
          setCanRedo(false)
          setStatus('已取得其他裝置的更新')
        }
      } catch {}
    }
    const timer = setInterval(() => {
      void refresh()
    }, 15000)
    const onVisible = () => {
      if (!document.hidden) void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [cloud, id, updateDrawing])

  function pointFromEvent(event) {
    const bounds = svgRef.current.getBoundingClientRect()
    return {
      x: Math.max(
        0,
        Math.min(
          WIDTH,
          Math.round(
            (((event.clientX - bounds.left) * WIDTH) / bounds.width) * 10
          ) / 10
        )
      ),
      y: Math.max(
        0,
        Math.min(
          HEIGHT,
          Math.round(
            (((event.clientY - bounds.top) * HEIGHT) / bounds.height) * 10
          ) / 10
        )
      )
    }
  }

  function onPointerDown(event) {
    if (!id || event.button !== 0) return
    if (event.pointerType === 'pen') lastPenRef.current = Date.now()
    if (event.pointerType === 'touch' && Date.now() - lastPenRef.current < 1500)
      return
    event.preventDefault()
    svgRef.current.setPointerCapture(event.pointerId)
    pointerRef.current = event.pointerId
    const point = pointFromEvent(event)
    if (tool === 'eraser') {
      commit({
        strokes: drawingRef.current.strokes.filter(
          stroke => !hitsStroke(stroke, point)
        )
      })
    } else {
      activeRef.current = {
        tool,
        color,
        size: tool === 'highlighter' ? size * 5 : size,
        points: [point]
      }
      setActiveStroke(activeRef.current)
    }
  }

  function onPointerMove(event) {
    if (pointerRef.current !== event.pointerId) return
    const point = pointFromEvent(event)
    if (tool === 'eraser') {
      commit({
        strokes: drawingRef.current.strokes.filter(
          stroke => !hitsStroke(stroke, point)
        )
      })
    } else {
      if (activeRef.current) {
        activeRef.current = {
          ...activeRef.current,
          points: [...activeRef.current.points, point]
        }
        setActiveStroke(activeRef.current)
      }
    }
  }

  function onPointerUp(event) {
    if (pointerRef.current !== event.pointerId) return
    pointerRef.current = null
    if (activeRef.current)
      commit({ strokes: [...drawingRef.current.strokes, activeRef.current] })
    activeRef.current = null
    setActiveStroke(null)
  }

  function undo() {
    const previous = historyRef.current.pop()
    if (!previous) return
    futureRef.current.push(drawingRef.current)
    updateDrawing(previous)
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
    localStorage.setItem(storageKey(id), JSON.stringify(previous))
    if (cloud) saveCloud(id, previous)
  }

  function redo() {
    const next = futureRef.current.pop()
    if (!next) return
    historyRef.current.push(drawingRef.current)
    updateDrawing(next)
    setCanUndo(true)
    setCanRedo(futureRef.current.length > 0)
    localStorage.setItem(storageKey(id), JSON.stringify(next))
    if (cloud) saveCloud(id, next)
  }

  function download(blob, filename) {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  function exportPng() {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, WIDTH, HEIGHT)
    for (const stroke of drawingRef.current.strokes) {
      context.beginPath()
      context.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.forEach(point => context.lineTo(point.x, point.y))
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = stroke.size
      context.strokeStyle = stroke.color
      context.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1
      context.stroke()
    }
    canvas.toBlob(blob => blob && download(blob, `notion-pencil-${id}.png`))
  }

  async function restore(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const next = parsed.drawing || parsed
      if (!validDrawing(next)) throw new Error('invalid drawing')
      commit(next)
    } catch {
      setStatus('無法讀取此 JSON 備份')
    }
    event.target.value = ''
  }

  return (
    <>
      <Head>
        <title>Notion Pencil</title>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1'
        />
        <meta name='robots' content='noindex, nofollow' />
      </Head>
      <main className={styles.app}>
        <header className={styles.header}>
          <div>
            <strong>✎ Notion Pencil</strong>
            <span className={styles.status}>{status}</span>
          </div>
          <div className={styles.actions}>
            <button
              type='button'
              onClick={() => {
                void navigator.clipboard.writeText(location.href)
              }}
            >
              複製畫布網址
            </button>
            <button type='button' onClick={exportPng}>
              匯出 PNG
            </button>
            <button
              type='button'
              onClick={() =>
                download(
                  new Blob([JSON.stringify({ id, drawing }, null, 2)], {
                    type: 'application/json'
                  }),
                  `notion-pencil-${id}.json`
                )
              }
            >
              備份 JSON
            </button>
            <button type='button' onClick={() => fileRef.current.click()}>
              還原 JSON
            </button>
            <input
              ref={fileRef}
              type='file'
              accept='application/json,.json'
              hidden
              onChange={event => {
                void restore(event)
              }}
            />
          </div>
        </header>
        <div className={styles.toolbar} aria-label='繪圖工具'>
          {[
            ['pen', '畫筆'],
            ['highlighter', '螢光筆'],
            ['eraser', '橡皮擦']
          ].map(([value, label]) => (
            <button
              type='button'
              key={value}
              className={tool === value ? styles.selected : ''}
              aria-pressed={tool === value}
              onClick={() => setTool(value)}
            >
              {label}
            </button>
          ))}
          <span className={styles.divider} />
          {COLORS.map(value => (
            <button
              type='button'
              key={value}
              className={styles.color}
              style={{
                background: value,
                outline: color === value ? '2px solid #17243a' : 'none'
              }}
              aria-label={`顏色 ${value}`}
              onClick={() => setColor(value)}
            />
          ))}
          <input
            type='color'
            aria-label='自訂顏色'
            value={color}
            onChange={event => setColor(event.target.value)}
          />
          <label className={styles.size}>
            粗細{' '}
            <input
              type='range'
              min='2'
              max='24'
              value={size}
              onChange={event => setSize(Number(event.target.value))}
            />{' '}
            {size}
          </label>
          <button type='button' disabled={!canUndo} onClick={undo}>
            復原
          </button>
          <button type='button' disabled={!canRedo} onClick={redo}>
            重做
          </button>
          <button
            type='button'
            onClick={() => {
              if (confirm('確定清空這張畫布？')) commit(emptyDrawing())
            }}
          >
            清空
          </button>
        </div>
        <div className={styles.paperWrap}>
          <svg
            ref={svgRef}
            className={styles.paper}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role='img'
            aria-label='手寫畫布'
          >
            <rect width={WIDTH} height={HEIGHT} fill='white' />
            {[...drawing.strokes, ...(activeStroke ? [activeStroke] : [])].map(
              (stroke, index) => (
                <path
                  key={index}
                  d={strokePath(stroke.points)}
                  fill='none'
                  stroke={stroke.color}
                  strokeWidth={stroke.size}
                  opacity={stroke.tool === 'highlighter' ? 0.35 : 1}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              )
            )}
          </svg>
        </div>
        <footer className={styles.footer}>
          不同網址的 id 對應不同畫布。
          {cloud
            ? '持有網址的人可檢視及編輯這張畫布。'
            : '目前只儲存在此瀏覽器；請定期下載 JSON 備份。'}
        </footer>
      </main>
    </>
  )
}
