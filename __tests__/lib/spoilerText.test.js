import { renderSpoilers } from '@/lib/spoilerText'

function article(html) {
  document.body.innerHTML = `<article class="notion-page-content-inner">${html}</article>`
  return document.querySelector('article')
}

describe('Notion inline spoilers', () => {
  test('preserves formatted text and links across rich-text segments', () => {
    const root = article(
      '<div class="notion-text">Before ||<b>bold</b> and <a href="/post">linked</a> text|| after</div>'
    )
    renderSpoilers(root)
    const spoiler = root.querySelector('.spoiler-text')
    expect(spoiler.textContent).toBe('bold and linked text')
    expect(spoiler.querySelector('b').textContent).toBe('bold')
    expect(spoiler.querySelector('a').getAttribute('href')).toBe('/post')
    expect(root.textContent).toBe('Before bold and linked text after')
    expect(spoiler.getAttribute('aria-expanded')).toBe('false')
    expect(spoiler.querySelector('a').tabIndex).toBe(-1)

    spoiler.click()
    expect(spoiler.getAttribute('aria-expanded')).toBe('true')
    expect(spoiler.querySelector('a').hasAttribute('tabindex')).toBe(false)
    const linkClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    })
    spoiler.querySelector('a').dispatchEvent(linkClick)
    expect(linkClick.defaultPrevented).toBe(false)
    expect(spoiler.getAttribute('aria-expanded')).toBe('true')
    spoiler.click()
    expect(spoiler.getAttribute('aria-expanded')).toBe('false')
  })

  test('handles multiple spoilers, split markers, and repeated rendering', () => {
    const root = article(
      '<div class="notion-text">A <b>|</b>|one|| and ||two|<em>|</em> end</div>'
    )
    renderSpoilers(root)
    renderSpoilers(root)
    expect(
      [...root.querySelectorAll('.spoiler-text')].map(e => e.textContent)
    ).toEqual(['one', 'two'])
    expect(root.textContent).toBe('A one and two end')
  })

  test('supports keyboard activation and leaves unrelated content alone', () => {
    const root = article(
      '<div class="notion-text">||secret|| <code>||code||</code> ||unfinished</div>' +
        '<div class="notion-text">Other block ||also unfinished</div>'
    )
    renderSpoilers(root)
    const spoiler = root.querySelector('.spoiler-text')
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    spoiler.dispatchEvent(event)
    expect(spoiler.getAttribute('aria-expanded')).toBe('true')
    spoiler.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    )
    expect(spoiler.getAttribute('aria-expanded')).toBe('false')
    expect(root.querySelector('code').textContent).toBe('||code||')
    expect(root.textContent).toContain('||unfinished')
    expect(root.querySelectorAll('.spoiler-text')).toHaveLength(1)
  })
})
