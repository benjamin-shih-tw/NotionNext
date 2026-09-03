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
