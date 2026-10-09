import { render, screen } from '@testing-library/react'
import ProfileHome from '@/themes/claude/components/ProfileHome'

jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback) => key === 'AUTHOR' ? 'Benjamin' : fallback }))
jest.mock('@/components/SmartLink', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }))

test('shows custom homepage text safely without executing HTML', () => {
  const text = 'My introduction\n<script>alert("hello")</script>'
  const { container } = render(<ProfileHome homepage={{ useCustomReadme: true, readmeTitle: 'About me', readmeText: text }} />)
  expect(screen.getByText('About me')).toBeInTheDocument()
  expect(screen.getByText(/My introduction/)).toHaveTextContent('alert("hello")')
  expect(container.querySelector('script')).toBeNull()
})

test('continues using Notion content when the custom README is disabled', () => {
  render(<ProfileHome homepage={{ useCustomReadme: false, readmeTitle: 'README.md', readmeText: 'Draft not published' }}
    readmePage={{ readmeHtml: '<p>Current Notion introduction</p>' }} />)
  expect(screen.getByText('Current Notion introduction')).toBeInTheDocument()
  expect(screen.queryByText('Draft not published')).not.toBeInTheDocument()
})
