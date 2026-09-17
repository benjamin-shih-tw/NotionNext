import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import {
  CP_CONTESTS,
  CP_STORAGE_PREFIX,
  getCpContest
} from '@/lib/cp/contests'

const makeInitialState = contest => ({
  startedAt: null,
  finishedAt: null,
  problemStates: Object.fromEntries(
    contest.problems.map(problem => [
      problem.id,
      {
        wa: 0,
        acAt: null,
        afterStatus: '',
        thought: '',
        summary: '',
        trigger: ''
      }
    ])
  )
})

const mmss = seconds => {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const bandClass = band => {
  if (band === 'brown') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  if (band === 'green') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  if (band === 'cyan') return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

export default function CpContest({ contest }) {
  const storageKey = CP_STORAGE_PREFIX + contest.slug
  const [state, setState] = useState(() => makeInitialState(contest))
  const [hydrated, setHydrated] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setState(JSON.parse(saved))
    } catch {}
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, hydrated, storageKey])

  useEffect(() => {
    if (!state.startedAt || state.finishedAt) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [state.startedAt, state.finishedAt])

  const elapsedSeconds = state.startedAt
    ? Math.floor(((state.finishedAt || now) - state.startedAt) / 1000)
    : 0

  const durationSeconds = contest.durationMinutes * 60
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)

  useEffect(() => {
    if (
      state.startedAt &&
      !state.finishedAt &&
      elapsedSeconds >= durationSeconds
    ) {
      setState(current => ({
        ...current,
        finishedAt: current.startedAt + durationSeconds * 1000
      }))
    }
  }, [
    durationSeconds,
    elapsedSeconds,
    state.finishedAt,
    state.startedAt
  ])

  const solvedCount = useMemo(
    () =>
      Object.values(state.problemStates || {}).filter(problem => problem.acAt)
        .length,
    [state.problemStates]
  )

  const penaltySeconds = useMemo(() => {
    return Object.values(state.problemStates || {}).reduce((total, problem) => {
      if (!problem.acAt) return total
      const solveSeconds = Math.floor((problem.acAt - state.startedAt) / 1000)
      return total + solveSeconds + problem.wa * 300
    }, 0)
  }, [state.problemStates, state.startedAt])

  const updateProblem = (id, patch) => {
    setState(current => ({
      ...current,
      problemStates: {
        ...current.problemStates,
        [id]: {
          ...current.problemStates[id],
          ...patch
        }
      }
    }))
  }

  const startContest = () => {
    if (state.startedAt) return
    const timestamp = Date.now()
    setNow(timestamp)
    setState({
      ...makeInitialState(contest),
      startedAt: timestamp
    })
  }

  const finishContest = () => {
    if (!state.startedAt || state.finishedAt) return
    setState(current => ({
      ...current,
      finishedAt: Math.min(
        Date.now(),
        current.startedAt + durationSeconds * 1000
      )
    }))
  }

  const resetContest = () => {
    if (!confirm('確定要清除這場的計時與所有紀錄嗎？')) return
    setState(makeInitialState(contest))
    setNow(Date.now())
  }

  const markWa = id => {
    if (state.finishedAt) return
    const problemState = state.problemStates[id]
    if (problemState.acAt) return
    updateProblem(id, { wa: problemState.wa + 1 })
  }

  const markAc = id => {
    if (state.finishedAt) return
    const problemState = state.problemStates[id]
    if (problemState.acAt) return
    updateProblem(id, { acAt: Date.now() })
  }

  const isFinished = Boolean(state.finishedAt)
  const hasStarted = Boolean(state.startedAt)

  const reviewOrder = useMemo(() => {
    if (!isFinished) return []
    const weight = { near: 5, impl: 4, noidea: 3, ac: 1, '': 2 }
    return [...contest.problems]
      .filter(problem => !state.problemStates[problem.id]?.acAt)
      .sort((a, b) => {
        const aStatus = state.problemStates[a.id]?.afterStatus || ''
        const bStatus = state.problemStates[b.id]?.afterStatus || ''
        return (weight[bStatus] || 0) - (weight[aStatus] || 0)
      })
  }, [contest.problems, isFinished, state.problemStates])

  if (!hydrated) {
    return (
      <main className='mx-auto max-w-5xl px-4 py-10'>
        <div className='text-sm text-gray-500'>Loading contest…</div>
      </main>
    )
  }

  return (
    <main className='mx-auto w-full max-w-5xl px-4 py-8 md:px-6'>
      <div className='mb-5 flex items-center justify-between gap-3'>
        <Link href='/cp' className='text-sm font-semibold text-blue-600 hover:underline'>
          ← Week 1
        </Link>
        <button
          type='button'
          onClick={resetContest}
          className='text-xs text-gray-500 hover:text-red-600'
        >
          Reset contest
        </button>
      </div>

      <section className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <div className='text-sm font-semibold uppercase tracking-wider text-blue-600'>
              {contest.kind === 'big' ? 'Big Mashup' : 'Mini Mashup'}
            </div>
            <h1 className='mt-1 text-2xl font-bold'>{contest.title}</h1>
            <p className='mt-2 text-sm text-gray-500'>
              {contest.problems.length} problems · {contest.durationMinutes} minutes · WA +5 min
            </p>
          </div>

          <div className='text-right'>
            <div
              className={`font-mono text-4xl font-bold ${
                hasStarted && !isFinished && remainingSeconds <= 300
                  ? 'text-red-600'
                  : ''
              }`}
            >
              {hasStarted ? mmss(remainingSeconds) : mmss(durationSeconds)}
            </div>
            <div className='mt-1 text-xs text-gray-500'>
              {!hasStarted
                ? 'Not started'
                : isFinished
                  ? 'Finished'
                  : `Elapsed ${mmss(elapsedSeconds)}`}
            </div>
          </div>
        </div>

        {!hasStarted && (
          <div className='mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30'>
            <div className='font-bold'>開始前</div>
            <ul className='mt-2 space-y-1 text-sm leading-6 text-gray-700 dark:text-gray-200'>
              <li>• 比賽中禁止 AI、Hint、題解。</li>
              <li>• 可以使用編譯器與查 C++ 語法。</li>
              <li>• 題型、Difficulty、訓練目的到比賽結束後才揭露。</li>
              <li>• 計時開始後不能暫停，重新整理也會繼續計時。</li>
            </ul>
            <button
              type='button'
              onClick={startContest}
              className='mt-4 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700'
            >
              Start contest
            </button>
          </div>
        )}

        {hasStarted && !isFinished && (
          <div className='mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800'>
            <span>
              <b>{solvedCount * 100}</b> / {contest.problems.length * 100} pts ·{' '}
              {solvedCount}/{contest.problems.length} solved
            </span>
            <span>
              Penalty {solvedCount ? mmss(penaltySeconds) : '—'}
            </span>
          </div>
        )}
      </section>

      {hasStarted && (
        <section className='mt-5 grid gap-3'>
          {contest.problems.map((problem, index) => {
            const problemState = state.problemStates[problem.id]
            return (
              <article
                key={problem.id}
                className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900'
              >
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <div className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
                      Problem {String.fromCharCode(65 + index)} · 100 pts
                    </div>
                    {isFinished ? (
                      <>
                        <h2 className='mt-1 text-lg font-bold'>
                          {problem.id.toUpperCase()} · {problem.title}
                        </h2>
                        <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                          <span className={`rounded-full px-2.5 py-1 font-semibold ${bandClass(problem.band)}`}>
                            {problem.band}
                          </span>
                          <span className='rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-800'>
                            Difficulty ≈ {problem.difficulty}
                          </span>
                          <span className='rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-800'>
                            {problem.topic}
                          </span>
                        </div>
                      </>
                    ) : (
                      <h2 className='mt-1 text-lg font-bold'>
                        Problem {String.fromCharCode(65 + index)}
                      </h2>
                    )}
                  </div>

                  <a
                    href={problem.url}
                    target='_blank'
                    rel='noreferrer'
                    className='rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-gray-600'
                  >
                    Open AtCoder ↗
                  </a>
                </div>

                {!isFinished && (
                  <div className='mt-4 flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => markWa(problem.id)}
                      disabled={Boolean(problemState.acAt)}
                      className='rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-gray-600'
                    >
                      WA +1
                    </button>
                    <button
                      type='button'
                      onClick={() => markAc(problem.id)}
                      disabled={Boolean(problemState.acAt)}
                      className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40'
                    >
                      {problemState.acAt ? 'AC ✓' : 'AC'}
                    </button>
                    <span className='text-sm text-gray-500'>
                      {problemState.acAt
                        ? `AC @ ${mmss(
                            Math.floor(
                              (problemState.acAt - state.startedAt) / 1000
                            )
                          )} · ${problemState.wa} WA`
                        : `${problemState.wa} WA`}
                    </span>
                  </div>
                )}

                {isFinished && (
                  <div className='mt-5 grid gap-4'>
                    <label className='text-sm font-semibold'>
                      這題比賽中屬於哪種狀況？
                      <select
                        value={problemState.afterStatus || ''}
                        onChange={event =>
                          updateProblem(problem.id, {
                            afterStatus: event.target.value
                          })
                        }
                        className='mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 font-normal dark:border-gray-600'
                      >
                        <option value=''>請選擇</option>
                        <option value='ac'>獨立 AC</option>
                        <option value='near'>有方向 / 差一點想出來</option>
                        <option value='noidea'>完全沒梗</option>
                        <option value='impl'>想法有但 implementation / WA</option>
                      </select>
                    </label>

                    <label className='text-sm font-semibold'>
                      賽中猜過哪些方向？
                      <textarea
                        value={problemState.thought || ''}
                        onChange={event =>
                          updateProblem(problem.id, {
                            thought: event.target.value
                          })
                        }
                        rows={2}
                        className='mt-2 w-full rounded-lg border border-gray-300 bg-transparent p-3 font-normal dark:border-gray-600'
                        placeholder='例如：想到 BFS，但沒想到要把 switch state 放進狀態…'
                      />
                    </label>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}

      {hasStarted && !isFinished && (
        <button
          type='button'
          onClick={finishContest}
          className='mt-5 w-full rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900'
        >
          End contest early
        </button>
      )}

      {isFinished && (
        <>
          <section className='mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900'>
            <h2 className='text-xl font-bold'>Result</h2>
            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-xl bg-gray-50 p-4 dark:bg-gray-800'>
                <div className='text-xs text-gray-500'>Score</div>
                <div className='mt-1 text-2xl font-bold'>
                  {solvedCount * 100}/{contest.problems.length * 100}
                </div>
              </div>
              <div className='rounded-xl bg-gray-50 p-4 dark:bg-gray-800'>
                <div className='text-xs text-gray-500'>Solved</div>
                <div className='mt-1 text-2xl font-bold'>
                  {solvedCount}/{contest.problems.length}
                </div>
              </div>
              <div className='rounded-xl bg-gray-50 p-4 dark:bg-gray-800'>
                <div className='text-xs text-gray-500'>Penalty</div>
                <div className='mt-1 text-2xl font-bold'>
                  {solvedCount ? mmss(penaltySeconds) : '—'}
                </div>
              </div>
            </div>
          </section>

          <section className='mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900'>
            <h2 className='text-xl font-bold'>晚上補題 · Discord 式復盤</h2>
            <p className='mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300'>
              不要一次補全部。優先補「差一點想出來」與「知道工具但沒做出 reduction」的題。
              每題先重新自己想，再寫限制 → 暴力 → 瓶頸 → 熟悉模型 → 轉換。
            </p>

            {reviewOrder.length > 0 ? (
              <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30'>
                <b>建議補題順序：</b>{' '}
                {reviewOrder.map(problem => problem.id.toUpperCase()).join(' → ')}
              </div>
            ) : (
              <div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30'>
                這場沒有未解題。可以挑最慢 AC 的一題做「為什麼我會想到」復盤。
              </div>
            )}

            <div className='mt-5 grid gap-4'>
              {contest.problems.map(problem => {
                const problemState = state.problemStates[problem.id]
                return (
                  <div
                    key={problem.id}
                    className='rounded-xl border border-gray-200 p-4 dark:border-gray-700'
                  >
                    <div className='font-bold'>
                      {problem.id.toUpperCase()} · {problem.title}
                    </div>
                    <div className='mt-3 grid gap-3 md:grid-cols-2'>
                      <label className='text-sm font-semibold'>
                        關掉題解後，用自己的話重推
                        <textarea
                          value={problemState.summary || ''}
                          onChange={event =>
                            updateProblem(problem.id, {
                              summary: event.target.value
                            })
                          }
                          rows={4}
                          className='mt-2 w-full rounded-lg border border-gray-300 bg-transparent p-3 font-normal dark:border-gray-600'
                          placeholder='限制 → 暴力 → 瓶頸 → 關鍵觀察 → 解法骨架'
                        />
                      </label>
                      <label className='text-sm font-semibold'>
                        下次看到什麼 clue 要想到這招？
                        <textarea
                          value={problemState.trigger || ''}
                          onChange={event =>
                            updateProblem(problem.id, {
                              trigger: event.target.value
                            })
                          }
                          rows={4}
                          className='mt-2 w-full rounded-lg border border-gray-300 bg-transparent p-3 font-normal dark:border-gray-600'
                          placeholder='不要只寫 BIT / BFS，要寫「什麼題面訊號」'
                        />
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export async function getStaticPaths() {
  return {
    paths: CP_CONTESTS.map(contest => ({
      params: { slug: contest.slug }
    })),
    fallback: false
  }
}

export async function getStaticProps({ params, locale }) {
  const contest = getCpContest(params.slug)
  if (!contest) return { notFound: true }

  const props = await fetchGlobalAllData({ from: 'cp-contest', locale })
  props.contest = contest
  props.meta = {
    title: `${contest.title} | CP Training`,
    description: `${contest.durationMinutes}-minute competitive programming mashup.`
  }

  return { props, revalidate: 3600 }
}
