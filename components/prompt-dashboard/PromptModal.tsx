'use client'

import { useMemo, useState } from 'react'
import { Check, Clipboard, Copy, ExternalLink, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Prompt = {
  id: string
  category_id: string
  title: string
  description: string | null
  prompt_template: string
  variables: string[]
  output_format: string | null
}

export default function PromptModal({
  prompt,
  categoryName,
  onClose,
}: {
  prompt: Prompt
  categoryName: string
  onClose: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const variables = useMemo(
    () => (Array.isArray(prompt.variables) ? prompt.variables : []),
    [prompt.variables],
  )

  function generate() {
    let result = prompt.prompt_template
    for (const key of variables) {
      result = result.replaceAll('{{' + key + '}}', values[key]?.trim() || '[' + key.replaceAll('_', ' ') + ']')
    }
    setOutput(result)
  }

  async function log(action: string, outputData = output) {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return
    await supabase.from('prompt_activity_logs').insert({
      user_id: user.id,
      prompt_id: prompt.id,
      category_id: prompt.category_id,
      action,
      input_data: values,
      output_data: outputData,
    })
  }

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    await log('Copied')
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function saveOutput() {
    setSaving(true)
    await log('Saved')
    setSaving(false)
  }

  function whatsapp() {
    const text = output || prompt.prompt_template
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer')
    void log('Shared')
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        className="w-full max-w-6xl max-h-[94vh] overflow-y-auto bg-jet border border-darkgrey rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-jet/95 backdrop-blur border-b border-darkgrey px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-orange text-xs uppercase tracking-[0.18em] font-bold">{categoryName}</p>
            <h2 id="prompt-title" className="font-heading text-2xl sm:text-3xl font-bold text-paper truncate">{prompt.title}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 p-2 rounded-full border border-darkgrey hover:border-orange text-mist hover:text-paper" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-0">
          <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-darkgrey">
            <p className="text-mist text-sm leading-6 mb-6">{prompt.description}</p>

            {variables.length > 0 && (
              <div className="space-y-4">
                {variables.map((key) => (
                  <label key={key} className="block">
                    <span className="block text-paper text-xs uppercase tracking-wider font-bold mb-1.5">
                      {key.replaceAll('_', ' ')}
                    </span>
                    {key === 'notes' || key === 'materials' ? (
                      <textarea
                        rows={3}
                        value={values[key] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        placeholder={'Enter ' + key.replaceAll('_', ' ') + '...'}
                        className="field resize-y"
                      />
                    ) : (
                      <input
                        value={values[key] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        placeholder={'Enter ' + key.replaceAll('_', ' ') + '...'}
                        className="field"
                      />
                    )}
                  </label>
                ))}
              </div>
            )}

            <button onClick={generate} className="btn mt-6 w-full bg-orange text-black hover:bg-orange/90">
              <Clipboard className="w-4 h-4" /> Build Prompt
            </button>
          </div>

          <div className="p-5 sm:p-7 bg-[#0d0f12]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-paper font-heading font-bold uppercase">Generated Prompt</p>
                <p className="text-xs text-mist">{prompt.output_format || 'Reusable AI prompt'}</p>
              </div>
              <button onClick={copyOutput} disabled={!output} className="btn-dark !px-3 !py-2 text-xs disabled:opacity-40">
                {copied ? <Check className="w-4 h-4 text-whatsapp" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Your completed prompt will appear here. You can edit it before copying."
              className="w-full min-h-[340px] resize-y font-mono text-sm leading-6"
            />

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={saveOutput} disabled={!output || saving} className="btn-dark text-xs disabled:opacity-40">
                {saving ? 'Saving…' : 'Save activity'}
              </button>
              <button onClick={whatsapp} disabled={!output} className="btn-wa text-xs disabled:opacity-40">WhatsApp</button>
              <button onClick={() => void log('Exported')} disabled={!output} className="btn-outline text-xs disabled:opacity-40">
                <ExternalLink className="w-4 h-4" /> Export
              </button>
            </div>

            <p className="text-[11px] text-mist mt-5">
              NGMS prompt workspace. This MVP builds and records reusable prompts. AI-provider generation can be connected later without replacing the prompt library.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
