const BLOCK_SELECTOR =
  '.notion-text, .notion-list-item, .notion-h, .notion-quote, .notion-callout'

function trimMarker(fragment, fromEnd, length) {
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  if (fromEnd) nodes.reverse()

  for (const node of nodes) {
    const count = Math.min(length, node.textContent.length)
    node.textContent = fromEnd
      ? node.textContent.slice(0, -count)
      : node.textContent.slice(count)
    length -= count
    if (!node.textContent) node.remove()
    if (!length) break
  }
}

function setExpanded(spoiler, content, focusables, expanded) {
  spoiler.setAttribute('aria-expanded', String(expanded))
  spoiler.setAttribute(
    'aria-label',
    expanded
      ? '隱藏文字；按 Enter 或空白鍵收起'
      : '隱藏文字；按 Enter 或空白鍵顯示'
  )
  content.setAttribute('aria-hidden', String(!expanded))
  content.inert = !expanded
  for (const [element, tabIndex] of focusables) {
    if (expanded) {
      if (tabIndex === null) element.removeAttribute('tabindex')
      else element.setAttribute('tabindex', tabIndex)
    } else {
      element.tabIndex = -1
    }
  }
}

function makeSpoiler(fragment) {
  const spoiler = document.createElement('span')
  spoiler.className = 'spoiler-text'
  spoiler.setAttribute('role', 'button')
  spoiler.tabIndex = 0
  const content = document.createElement('span')
  content.appendChild(fragment)
  spoiler.appendChild(content)
  const focusables = [...content.querySelectorAll('a, button, [tabindex]')].map(
    element => [element, element.getAttribute('tabindex')]
  )
  setExpanded(spoiler, content, focusables, false)
  spoiler.addEventListener('click', event => {
    const link = event.target.closest?.('a')
    if (link && spoiler.getAttribute('aria-expanded') === 'true') return
    if (link) event.preventDefault()
    setExpanded(
      spoiler,
      content,
      focusables,
      spoiler.getAttribute('aria-expanded') !== 'true'
    )
  })
  spoiler.addEventListener('keydown', event => {
    if (event.target !== spoiler || !['Enter', ' '].includes(event.key)) return
    event.preventDefault()
    setExpanded(
      spoiler,
      content,
      focusables,
      spoiler.getAttribute('aria-expanded') !== 'true'
    )
  })
  return spoiler
}

function renderBlock(block, marker) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      return parent?.closest('.spoiler-text, code, pre, script, style') ||
        parent?.closest(BLOCK_SELECTOR) !== block
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
    }
  })
  const nodes = []
  let text = ''
  while (walker.nextNode()) {
    nodes.push({ node: walker.currentNode, start: text.length })
    text += walker.currentNode.textContent
  }
  if (!text.includes(marker)) return

  const locate = index => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (index >= nodes[i].start) {
        return [nodes[i].node, index - nodes[i].start]
      }
    }
  }
  const matches = []
  let start = 0
  while ((start = text.indexOf(marker, start)) !== -1) {
    const end = text.indexOf(marker, start + marker.length)
    if (end === -1) break
    if (end > start + marker.length) matches.push([start, end + marker.length])
    start = end + marker.length
  }

  for (const [from, to] of matches.reverse()) {
    const range = document.createRange()
    range.setStart(...locate(from))
    range.setEnd(...locate(to))
    const fragment = range.extractContents()
    trimMarker(fragment, true, marker.length)
    trimMarker(fragment, false, marker.length)
    range.insertNode(makeSpoiler(fragment))
  }
}

export function renderSpoilers(root, marker = '||') {
  if (!root || !marker) return
  root
    .querySelectorAll(BLOCK_SELECTOR)
    .forEach(block => renderBlock(block, marker))
}
