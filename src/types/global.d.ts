declare module '*.css'
declare module '*.scss'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.mp3'
declare module '*.wav'

interface ImportMetaEnv {
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
