// env.d.ts
/// <reference types="vite/client" />
/// <reference types="node" />
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CHUNK_SIZE: string // atau number, tergantung pada tipe yang diharapkan
    }
  }
}
