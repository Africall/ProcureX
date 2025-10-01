/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MSW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Allow dynamic import of mocks module in dev without TS complaints
declare module './mocks/browser' {
  export const worker: any
}
