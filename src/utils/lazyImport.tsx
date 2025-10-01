import { lazy } from 'react'

export function lazyImport<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(factory)
}
