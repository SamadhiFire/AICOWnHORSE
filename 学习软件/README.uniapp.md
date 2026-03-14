# uni-app migration notes

## 1) Install deps

```bash
npm install
```

## 2) Build WeChat mini program output

```bash
npm run build:mp-weixin
```

This generates:

- `dist/build/mp-weixin`

## 3) Open in WeChat DevTools

Open either:

- project root (it uses `project.config.json` with `miniprogramRoot: dist/build/mp-weixin`)
- or directly `dist/build/mp-weixin`

## 4) LLM request requirements

- Add your API domain in WeChat MP admin as a legal `request` domain.
- Fill `API Key / Base URL / Model` in page form.
- API key is stored locally for now.
- Recommended: use your server as proxy to protect API keys.

## 5) Key source files

- `src/pages/index/index.vue`
- `src/utils/pipeline.ts`
- `src/utils/llm.ts`