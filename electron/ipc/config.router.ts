import { router, publicProcedure } from './trpc'
import { z } from 'zod'
import { getConfig, setConfig, hasConfig } from '../config/store'

const providerSchema = z.union([
  z.literal('openai-compat'),
  z.literal('anthropic')
])

const configSchema = z.object({
  activeProvider: providerSchema,
  providers: z.object({
    'openai-compat': z.object({
      baseUrl: z.string(),
      apiKey: z.string(),
      model: z.string()
    }),
    anthropic: z.object({
      apiKey: z.string(),
      model: z.string()
    })
  }),
  approval: z.union([z.literal('auto'), z.literal('manual'), z.literal('smart')]),
  workingDir: z.string()
})

export const configRouter = router({
  get: publicProcedure.query(() => getConfig()),
  set: publicProcedure.input(configSchema).mutation(({ input }) => {
    setConfig(input)
    return { ok: true }
  }),
  hasConfig: publicProcedure.query(() => hasConfig())
})
