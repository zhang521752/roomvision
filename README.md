# 栖界AI - 智能室内设计工作室

这是最终定稿版本。根目录 `index.html` 是唯一前端入口，Vite 端口和 Express 后端根路由都会打开同一版页面，避免旧稿和定稿入口混用。

## 启动

```bash
npm run dev
```

- Vite 前端: `http://localhost:5173`
- Express 后端: `http://localhost:3001`
- 两个地址都会显示最终稿首页

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`。
