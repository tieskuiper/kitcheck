// Lets plain Node run src/lib/*.ts, whose imports leave out the ".ts" extension (Vite style)
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      try { return next(`${specifier}.ts`, context) } catch { /* fall through */ }
    }
    return next(specifier, context)
  },
})
