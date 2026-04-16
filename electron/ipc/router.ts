import { router } from './trpc'
import { configRouter } from './config.router'
import { agentRouter } from './agent.router'

export const appRouter = router({
  config: configRouter,
  agent: agentRouter
})

export type AppRouter = typeof appRouter
