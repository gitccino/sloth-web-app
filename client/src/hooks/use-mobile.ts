import * as React from 'react'
import { useMobileStore } from '@/lib/store'

export function useIsMobile() {
  const { isMobile, init } = useMobileStore()

  React.useEffect(() => {
    init()
  }, [init])

  return isMobile
}
