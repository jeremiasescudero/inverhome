import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  reload: () => void
}

/**
 * Runs a service call and exposes the loading/error/data triple every screen
 * needs. Responses that arrive after the dependencies changed are discarded,
 * so fast filter typing cannot render a stale list.
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)
  const requestId = useRef(0)

  // The factory identity changes on every render; deps are the real trigger.
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  useEffect(() => {
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest
    setLoading(true)
    setError(undefined)

    factoryRef
      .current()
      .then((result) => {
        if (requestId.current !== currentRequest) return
        setData(result)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (requestId.current !== currentRequest) return
        setError(cause instanceof Error ? cause : new Error('Error inesperado'))
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return { data, error, loading, reload }
}
