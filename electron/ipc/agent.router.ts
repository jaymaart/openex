import { observable } from '@trpc/server/observable'
import { z } from 'zod'
import { router, publicProcedure } from './trpc'
import { runAgentLoop } from '../agent/loop'
import { resolveApproval } from '../agent/approval'
import type { AgentEvent } from '../../shared/types'

export const agentRouter = router({
  chat: publicProcedure
    .input(z.object({ message: z.string() }))
    .subscription(({ input }) => {
      return observable<AgentEvent>((emit) => {
        runAgentLoop(input.message, (event) => emit.next(event))
          .then(() => emit.next({ type: 'done' }))
          .catch((err) =>
            emit.next({ type: 'error', error: err?.message ?? String(err) })
          )
        // No cleanup needed — loop runs to completion
        return () => {}
      })
    }),

  respondToApproval: publicProcedure
    .input(z.object({ toolCallId: z.string(), approved: z.boolean() }))
    .mutation(({ input }) => {
      resolveApproval(input.toolCallId, input.approved)
      return { ok: true }
    })
})
