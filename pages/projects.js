import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getBenjaminRepos } from '@/lib/github'
import { DynamicLayout } from '@/themes/theme'

export default function Projects(props) {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutProjects' {...props} />
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'projects', locale })
  props.githubRepos = await getBenjaminRepos()
  return { props, revalidate: 3600 }
}
