const TEXT_FIELDS = {
  pageTitle: 200,
  pageDescription: 1000,
  readmeTitle: 200,
  readmeText: 20000
}

export function validateHomepage(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  if (typeof input.useCustomReadme !== 'boolean') return null
  for (const [field, maximum] of Object.entries(TEXT_FIELDS)) {
    if (typeof input[field] !== 'string' || input[field].length > maximum) return null
  }
  if (!input.pageTitle.trim() || !input.readmeTitle.trim()) return null
  if (input.useCustomReadme && !input.readmeText.trim()) return null
  return {
    pageTitle: input.pageTitle,
    pageDescription: input.pageDescription,
    readmeTitle: input.readmeTitle,
    useCustomReadme: input.useCustomReadme,
    readmeText: input.readmeText
  }
}
