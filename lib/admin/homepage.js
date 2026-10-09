const TEXT_FIELDS = {
  pageTitle: 200, pageDescription: 1000,
  heroLabel: 200, heroTitle: 500, heroDescription: 3000,
  notesButton: 100, projectsButton: 100,
  welcomeLabel: 200, welcomeTitle: 500, welcomeDescription: 3000,
  activityLabel: 200, activityTitle: 200,
  notesLabel: 200, notesTitle: 200,
  projectsLabel: 200, projectsTitle: 200
}

export function validateHomepage(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  for (const [field, maximum] of Object.entries(TEXT_FIELDS)) {
    if (typeof input[field] !== 'string' || input[field].length > maximum) return null
  }
  if (!['pageTitle', 'heroTitle', 'welcomeTitle', 'notesButton', 'projectsButton'].every(field => input[field].trim())) return null
  return Object.fromEntries(Object.keys(TEXT_FIELDS).map(field => [field, input[field]]))
}
