// No-op Next.js adapter.
//
// The v0 sandbox injects NEXT_ADAPTER_PATH pointing at a platform-provided
// adapter module. This project started life as a non-Next (Express) app, so
// that file was never provisioned and Next 16 crashes on startup trying to
// import it. next.config.mjs falls back to this local passthrough whenever the
// platform adapter is missing, keeping the dev server bootable.
export const name = 'v0-local-noop-adapter'

export function modifyConfig(config) {
  return config
}
