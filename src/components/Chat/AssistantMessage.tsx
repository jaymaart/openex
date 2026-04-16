import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function AssistantMessage({ content }: { content: string }) {
  if (!content) return null

  return (
    <div className="max-w-[85%] text-sm text-zinc-100 leading-relaxed prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const inline = !match
            if (inline) {
              return (
                <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs font-mono text-zinc-200" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem', margin: '0.5rem 0' }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>
          },
          ul({ children }) {
            return <ul className="mb-2 list-disc pl-4 space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="mb-2 list-decimal pl-4 space-y-1">{children}</ol>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
