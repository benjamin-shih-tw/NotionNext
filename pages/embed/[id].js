import Head from 'next/head'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import NotionPage from '@/components/NotionPage'
import { fetchPageFromNotion } from '@/lib/db/notion/getNotionPost'

const ALLOWED_PAGE_IDS = new Set([
  "38f92ab76d40807c8365dacdcacd8790",
  "39092ab76d4080479532e765d7a6b59e",
  "38a92ab76d4080ad99d2ff847b5de635",
  "39192ab76d4080b8adcdfa2880de9b64",
  "2f392ab76d4080d7a19af426c0398dce",
  "37e92ab76d4080378ac7e507609fd393",
  "37e92ab76d4080cea63ddd66fb4205b8",
  "37e92ab76d408078a97eef443858b3de",
  "37e92ab76d4080ceb6b1d80eb7566a49",
  "37e92ab76d4080d29382c27edb67d8d5",
  "37e92ab76d4080a58161e64bf8bb982b",
  "37e92ab76d4080bd8565df68351c9ff3",
  "37e92ab76d4080d88d8fff71abbe5c6b",
  "37e92ab76d4080ef8fd6c1dbafacf768",
  "37e92ab76d4080c68054cf028dd73ed0",
  "2e392ab76d4080f59f95d0827281ae23",
  "2e392ab76d4080e395f4f494a3e8f880",
  "2f092ab76d408081a00fe22eef47cad3",
  "2e392ab76d40804a8528e27899e46dc3",
  "2e392ab76d4080028b6ffbb7dc2b29ed",
  "2e392ab76d40803e83b7ec46acf28ffb",
  "2e392ab76d40806c873ac58c7f3d77a3",
  "33092ab76d40808c9a81d540a6d662a1",
  "33092ab76d408008a0a7c08a54a35c52",
  "36e92ab76d40806bbf5af50e80105a2b",
  "3d492ab76d40807c8646ecb550723470",
  "2e392ab76d408025afbff43f58e25219",
  "2e392ab76d408076acd9d02a39ee64f3",
  "2e392ab76d4080a894fed635920f9c3c",
  "33092ab76d4080ee9d38f7836636d5fa",
  "33092ab76d40806a80b9c4a4d2d3fec0",
  "33092ab76d408075bf02c0aecbacaf15",
  "33092ab76d4080e79badf5a1f860fc8c",
  "33092ab76d4080199eaafc456a0f2fb7",
  "33092ab76d40802f813ed4ca344b6864",
  "33092ab76d40803f9b93ca26e064c1bf",
  "3e892ab76d40810eb347d20c7c2e4a46",
  "38f92ab76d4080d4b7f4c56c089daf56",
  "3e892ab76d408152ab1fed571053561b",
  "3e892ab76d408180afe2c76f78173c80",
  "3e892ab76d4081929b7ccd6ec43fe656",
  "3e892ab76d4081eeac7af300f0d7c881",
  "3e892ab76d4081d8b08ddf594b1d9995",
  "3e892ab76d408161a791d38e24ca3677",
  "2e392ab76d408019a704c34f01b2ab1c",
  "36e92ab76d408039a26fcdf344458652",
  "33092ab76d408052ab69d57ace25461e",
  "3e892ab76d408119bd53ce739e81f39f",
  "3e892ab76d4081dd8547f9c0bddea98f"
])

export async function getServerSideProps({ params }) {
  const id = String(params?.id || '').replace(/-/g, '')
  if (!ALLOWED_PAGE_IDS.has(id)) {
    return { notFound: true }
  }

  const post = await fetchPageFromNotion(id)
  if (!post) return { notFound: true }

  return {
    props: {
      post,
      pageId: id
    }
  }
}

export default function CodingCourseEmbed({ post, pageId }) {
  const rootRef = useRef(null)
  const router = useRouter()
  const darkMode = router.query.theme === 'dark'

  useEffect(() => {
    const sendHeight = () => {
      const root = rootRef.current
      if (!root) return
      const height = Math.ceil(
        Math.max(
          root.scrollHeight,
          root.getBoundingClientRect().height,
          document.documentElement.scrollHeight
        )
      )
      window.parent?.postMessage(
        {
          type: 'coding-course:notion-height',
          pageId,
          height
        },
        '*'
      )
    }

    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(sendHeight)
        : null

    if (observer && rootRef.current) observer.observe(rootRef.current)

    const mutationObserver =
      typeof MutationObserver === 'function'
        ? new MutationObserver(sendHeight)
        : null

    if (mutationObserver && rootRef.current) {
      mutationObserver.observe(rootRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
    }

    window.addEventListener('load', sendHeight, true)
    document.fonts?.ready?.then(sendHeight).catch(() => {})
    const timer = setTimeout(sendHeight, 300)

    return () => {
      observer?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('load', sendHeight, true)
      clearTimeout(timer)
    }
  }, [pageId, darkMode])

  return (
    <>
      <Head>
        <title>{post?.title || 'Coding Course'}</title>
        <meta name='robots' content='noindex,nofollow' />
      </Head>

      <main
        ref={rootRef}
        className={darkMode ? 'coding-course-embed dark-mode' : 'coding-course-embed'}>
        <NotionPage post={post} darkMode={darkMode} />
      </main>

      <style jsx global>{`
        html,
        body,
        #__next {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 0 !important;
          background: transparent !important;
        }

        body {
          overflow: hidden !important;
        }

        .coding-course-embed {
          width: 100%;
          background: transparent;
          color: #111;
        }

        .coding-course-embed.dark-mode {
          color: #eee;
        }

        .coding-course-embed #notion-article,
        .coding-course-embed .notion,
        .coding-course-embed .notion-page,
        .coding-course-embed .notion-page-content {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          background: transparent !important;
        }

        .coding-course-embed .notion-page {
          padding: 0 !important;
        }

        .coding-course-embed .notion-page-content {
          padding-left: 0 !important;
          padding-right: 0 !important;
          padding-bottom: 0 !important;
        }

        .coding-course-embed .notion-title,
        .coding-course-embed .notion-header {
          display: none !important;
        }

        .coding-course-embed .notion-asset-wrapper {
          max-width: 100% !important;
        }

        .coding-course-embed .notion-asset-wrapper img {
          max-width: 100% !important;
          height: auto !important;
        }
      `}</style>
    </>
  )
}
