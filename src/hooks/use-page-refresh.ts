"use client"

import { useEffect, useRef } from "react"

export const PAGE_REFRESH_EVENT = "dashboard:refresh"

/**
 * Subscribes a page's data-fetch function to the global header refresh event.
 * The DashboardHeader dispatches `dashboard:refresh` when its refresh button
 * is clicked; pages that load client-side data should call this hook so the
 * button actually reloads the current page.
 */
export function usePageRefresh(refresh: () => void) {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    const handler = () => {
      refreshRef.current()
    }
    window.addEventListener(PAGE_REFRESH_EVENT, handler)
    return () => window.removeEventListener(PAGE_REFRESH_EVENT, handler)
  }, [])
}
