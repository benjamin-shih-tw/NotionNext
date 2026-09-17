import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { CP_CONTESTS, CP_STORAGE_PREFIX } from '@/lib/cp/contests'

const emptyProgress = contest => ({
  started: false,
  finished: false,
  solved: 0,
  total: contest.problems.length,
  score: 0
})

export default function CpHome() {
  const [progress, setProgress] = useState({})

  useEffect(() => {
    const next = {}
    CP_CONTESTS.forEach(contest => {
      try {
        const raw = localStorage.getItem(CP_STORAGE_PREFIX + contest.slug)
        if (!raw) {
          next[contest.slug] = emptyProgress(contest)
          return
        }
        const saved = JSON.parse(raw)
        const states = Object.values(saved.problemStates || {})
        const solved = states.filter(item => item.acAt).length
        next[contest.slug] = {
          started: Boolean(saved.startedAt),
          finished: Boolean(saved.finishedAt),
          solved,
          total: contest.problems.length,
          score: solved * 100
        }
      } catch {
        next[contest.slug] = emptyProgress(contest)
      }
    })
    setProgress(next)
  }, [])

  const groups = useMemo(() => {
    return CP_CONTESTS.reduce((acc, contest) => {
      if (!acc[contest.day]) acc[contest.day] = []
      acc[contest.day].push(contest)
      return acc
    }, {})
  }, [])

  return (
    <main className='mx-auto w-full max-w-5xl px-4 py-8 md:px-6'>
      <section className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
        <div className='text-sm font-semibold uppercase tracking-wider text-blue-600'>
          Competitive Programming Training
        </div>
        <h1 className='mt-2 text-3xl font-bold'>Week 1 Mashup</h1>
        <p className='mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300'>
          平日每天兩場 50 分鐘 mini mashup，每場 3 題、棕到綠；週末一場
          150 分鐘 5 題 big mashup、棕到青。比賽開始前不顯示題型與難度，
          結束後才揭露並進入補題流程。
        </p>

        <div className='mt-5 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-xl bg-gray-50 p-4 dark:bg-gray-800'>
            <div className='text-xs text-gray-500'>Weekday</div>
            <div className='mt-1 text-xl font-bold'>10 場 × 50 min</div>
          </div>
          <div className='rounded-xl bg-gray-50 p-4 dark:bg-gray-800'>
            <div className='text-xs text-gray-500'>Weekend</div>
            <div className='mt-1 text-xl font-bold'>1 場 × 150 min</div>
          </div>
          <div className='rounded-xl bg-gray-50 p-4 dark:bg-gray-800'>
            <div className='text-xs text-gray-500'>Contest rule</div>
            <div className='mt-1 text-xl font-bold'>WA +5 min</div>
          </div>
        </div>
      </section>

      <section className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100'>
        <b>訓練規則：</b>白天模擬賽禁止 AI、Hint、題解。卡住要練切題。
        晚上再補最值得補的 1–2 題，並寫下「下次看到什麼 clue 要想到這招」。
      </section>

      <div className='mt-8 grid gap-7'>
        {Object.entries(groups).map(([day, contests]) => (
          <section key={day}>
            <div className='mb-3 flex items-end justify-between gap-3'>
              <h2 className='text-xl font-bold'>{day}</h2>
              <span className='text-xs text-gray-500'>
                {day === 'Weekend' ? '5 problems' : '2 contests'}
              </span>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              {contests.map(contest => {
                const p = progress[contest.slug] || emptyProgress(contest)
                return (
                  <Link
                    key={contest.slug}
                    href={`/cp/${contest.slug}`}
                    className='group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
                          {contest.kind === 'big'
                            ? 'Big Mashup'
                            : `Session ${contest.session}`}
                        </div>
                        <div className='mt-1 text-lg font-bold'>
                          {contest.durationMinutes} 分鐘 · {contest.problems.length} 題
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.finished
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.started
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {p.finished ? '完成' : p.started ? '進行中' : '未開始'}
                      </span>
                    </div>

                    <div className='mt-5 flex items-center justify-between text-sm'>
                      <span className='text-gray-500'>
                        {p.solved}/{p.total} solved · {p.score} pts
                      </span>
                      <span className='font-semibold text-blue-600 group-hover:underline'>
                        {p.finished ? '查看復盤 →' : p.started ? '繼續 →' : '開始 →'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <section className='mt-8 rounded-2xl border border-gray-200 p-5 text-sm leading-6 dark:border-gray-700'>
        <div className='font-bold'>資料保存</div>
        <p className='mt-1 text-gray-600 dark:text-gray-300'>
          計時、WA、AC、賽後卡點與重推筆記都存在這個瀏覽器的 localStorage。
          重新整理頁面不會讓計時重來；換裝置則不會自動同步。
        </p>
      </section>
    </main>
  )
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'cp', locale })
  props.meta = {
    title: '競程訓練 | Blog of Benjaminshih',
    description: 'Competitive programming mashup contest runner.'
  }
  return { props, revalidate: 3600 }
}
