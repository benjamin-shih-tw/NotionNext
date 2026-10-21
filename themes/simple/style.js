/* eslint-disable react/no-unknown-property */
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'
/**
 * 此处样式只对当前主题生效
 * 此处不支持tailwindCSS的 @apply 语法
 * @returns
 */
const Style = () => {
  return <style jsx global>{`

  @font-face {
    font-family: 'GenSeki Gothic TW';
    src: url('/fonts/appearance/GenSekiGothic2TW-R.woff2') format('woff2');
    font-display: swap;
  }
  @font-face {
    font-family: 'GenSen Rounded TW';
    src: url('/fonts/appearance/GenSenRounded2TW-R.woff2') format('woff2');
    font-display: swap;
  }
  @font-face {
    font-family: 'Reader LuoYan Web';
    src: url('/fonts/appearance/ReaderLuoYanWeb-Thin.woff2') format('woff2');
    font-display: swap;
  }
  html[data-reader-font]:not([data-reader-font='default']) #theme-simple,
  html[data-reader-font]:not([data-reader-font='default']) #theme-simple :is(h1, h2, h3, h4, h5, h6, p, li, blockquote, .notion) {
    font-family: var(--reader-font) !important;
  }

  #theme-simple .appearance-trigger {
    position: absolute;
    right: 0.5rem;
    top: 0;
    height: 3rem;
    width: 2.5rem;
    border: 0;
    background: transparent;
    color: #9a7410;
    font-size: 1.25rem;
    cursor: pointer;
  }
  #theme-simple .appearance-dialog {
    width: min(440px, calc(100vw - 28px));
    padding: 22px;
    border: 1px solid #e8dcae;
    border-radius: 10px;
    background: #fffdf5;
    color: #332d1f;
    box-shadow: 0 20px 60px #0004;
    text-align: left;
  }
  #theme-simple .appearance-dialog::backdrop {
    background: #0008;
  }
  #theme-simple .appearance-dialog h2 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 700;
  }
  #theme-simple .appearance-dialog label {
    display: block;
    margin: 14px 0;
    font-size: 12px;
    font-weight: 600;
  }
  #theme-simple .appearance-dialog select {
    display: block;
    width: 100%;
    margin-top: 6px;
    padding: 9px;
    border: 1px solid #e8dcae;
    border-radius: 6px;
    background: #fff;
    color: #332d1f;
  }
  #theme-simple .appearance-dialog .appearance-close {
    float: right;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 22px;
    line-height: 1;
  }
  .dark #theme-simple .appearance-dialog {
    background: #202020;
    color: #eee;
    border-color: #444;
  }
  .dark #theme-simple .appearance-dialog select {
    background: #151515;
    color: #eee;
    border-color: #444;
  }

  .dark #theme-simple {
    background: #141414;
    color: #eee;
  }
  .dark #theme-simple .notebook-header {
    background-color: #1b1b1b;
    border-color: #444;
  }
  .dark #theme-simple nav {
    background: #1b1b1b;
    border-color: #444;
  }
  .dark #theme-simple .notebook-card {
    background: #202020;
    border-color: #555;
    box-shadow: 4px 5px 0 #333;
  }
  .dark #theme-simple footer {
    background: #0d0d0d;
  }

  html[data-code-theme] #theme-simple pre.notion-code,
  html[data-code-theme] #theme-simple pre[class*='language-'],
  html[data-code-theme] #theme-simple code[class*='language-'] {
    background: var(--code-bg) !important;
    color: var(--code-fg) !important;
    border-color: var(--code-border) !important;
  }
  html[data-code-theme] #theme-simple .token.comment,
  html[data-code-theme] #theme-simple .token.prolog {
    color: var(--code-comment) !important;
  }
  html[data-code-theme] #theme-simple .token.keyword,
  html[data-code-theme] #theme-simple .token.operator {
    color: var(--code-keyword) !important;
  }
  html[data-code-theme] #theme-simple .token.string,
  html[data-code-theme] #theme-simple .token.char {
    color: var(--code-string) !important;
  }
  html[data-code-theme] #theme-simple .token.number,
  html[data-code-theme] #theme-simple .token.boolean {
    color: var(--code-number) !important;
  }
  html[data-code-theme] #theme-simple .token.function {
    color: var(--code-function) !important;
  }
  html[data-code-theme] #theme-simple .token.class-name,
  html[data-code-theme] #theme-simple .token.builtin {
    color: var(--code-type) !important;
  }
  html[data-code-theme] #theme-simple .token.variable,
  html[data-code-theme] #theme-simple .token.property {
    color: var(--code-variable) !important;
  }

  // 底色
  .dark body{
      background-color: black;
  }
  // 文本不可选取
    .forbid-copy {
        user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
    }

  #theme-simple #announcement-content {
    /* background-color: #f6f6f6; */
  }

  #theme-simple .blog-item-title {
    color: #332d1f;
  }

  .dark #theme-simple .blog-item-title {
    color: #d1d5db;
  }

  .notion {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }


  /*  菜单下划线动画 */
  #theme-simple .menu-link {
      text-decoration: none;
      background-image: linear-gradient(#d5a719, #d5a719);
      background-repeat: no-repeat;
      background-position: bottom center;
      background-size: 0 2px;
      transition: background-size 100ms ease-in-out;
  }

  #theme-simple .menu-link:hover {
      background-size: 100% 2px;
      color: #9a7410;
      cursor: pointer;
  }




  #theme-simple { background: #fffdf5; color: #332d1f; }
  #theme-simple .notebook-header {
    min-height: 18rem;
    background-color: #fffaf0;
    background-image: linear-gradient(rgba(213,167,25,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(213,167,25,.06) 1px, transparent 1px);
    background-size: 100% 28px, 28px 100%;
    border-bottom: 1px solid #eadba7;
  }
  #theme-simple nav { background: rgba(255,253,245,.94); border-color: #eadba7; box-shadow: 0 2px 10px rgba(75,58,16,.05); }
  #theme-simple #container-wrapper { max-width: 1180px; }
  #theme-simple .notebook-card { background:#fffef9; border:1px solid #e8dcae; box-shadow:4px 5px 0 #f3df87; border-radius:3px; }
  #theme-simple .notebook-kicker { color:#9a7410; letter-spacing:.16em; text-transform:uppercase; font-size:.72rem; font-weight:700; }
  #theme-simple .notebook-button { display:inline-flex; align-items:center; padding:.65rem 1rem; border:1px solid #cba52c; background:#f9d95e; color:#332d1f; border-radius:3px; font-weight:600; transition:.2s; }
  #theme-simple .notebook-button:hover { transform:translateY(-2px); box-shadow:3px 4px 0 #332d1f; }
  #theme-simple footer { background:#332d1f; }

      ${themeConsoleStyle('simple', CONFIG)}
  `}</style>
}

export { Style }
