import { render, screen } from '@testing-library/react'
import NotebookHome from '@/themes/simple/components/NotebookHome'
import homepage from '@/data/homepage.json'

jest.mock('@/components/SmartLink', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }))

test('preserves the current notebook text before any edits', () => {
  render(<NotebookHome />)
  expect(screen.getByText(/寫下值得留下的筆記/)).toBeInTheDocument()
  expect(screen.getByText('嗨，歡迎來到我的筆記本。')).toBeInTheDocument()
})

test('renders edited homepage text safely and preserves article and project links', () => {
  const { container } = render(<NotebookHome homepage={{
    ...homepage, heroTitle: 'My homepage', heroDescription: '<script>alert("hello")</script>',
    welcomeTitle: 'Welcome to my current website'
  }} posts={[{ id: 'note', slug: 'Science-Fair', href: '/science-fair', title: 'Notion article' }]}
    githubRepos={[{ name: 'My project', html_url: 'https://github.com/example/project', fork: false }]} />)
  expect(screen.getByText('My homepage')).toBeInTheDocument()
  expect(screen.getByText('<script>alert("hello")</script>')).toBeInTheDocument()
  expect(container.querySelector('script')).toBeNull()
  expect(screen.getByRole('link', { name: /Notion article/ })).toHaveAttribute('href', '/science-fair')
  expect(screen.getByRole('link', { name: /My project/ })).toHaveAttribute('href', 'https://github.com/example/project')
})
