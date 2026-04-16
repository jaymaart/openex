import type { Config } from '../../shared/types'
import type { Provider } from './types'
import { createOpenAICompatProvider } from './openai-compat'
import { createAnthropicProvider } from './anthropic'

export function getProvider(config: Config): Provider {
  const { activeProvider, providers } = config
  if (activeProvider === 'anthropic') {
    const { apiKey, model } = providers.anthropic
    return createAnthropicProvider(apiKey, model)
  }
  const { baseUrl, apiKey, model } = providers['openai-compat']
  return createOpenAICompatProvider(baseUrl, apiKey, model)
}
