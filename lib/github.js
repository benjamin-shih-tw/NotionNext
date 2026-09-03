export async function getBenjaminRepos() {
  try {
    const response = await fetch('https://api.github.com/users/benjamin-shih-tw/repos?per_page=100&sort=updated', { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) return []
    const repos = await response.json()
    return repos.map(({ name, html_url, description, fork, language, stargazers_count, forks_count, updated_at }) => ({ name, html_url, description, fork, language, stargazers_count, forks_count, updated_at }))
  } catch (error) {
    console.warn('Unable to load GitHub projects', error)
    return []
  }
}
