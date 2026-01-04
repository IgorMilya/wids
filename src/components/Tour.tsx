import { useEffect, useRef } from 'react'
import { useTour, createTourSteps } from 'hooks'
import { ROUTES } from 'routes/routes.utils'

const TOUR_STARTED_KEY = 'wisp_tour_started'
const TOUR_COMPLETED_KEY = 'wisp_tour_completed'

if (typeof window !== 'undefined') {
  (window as any).resetTour = () => {
    localStorage.removeItem(TOUR_STARTED_KEY)
    localStorage.removeItem(TOUR_COMPLETED_KEY)
    console.log('Tour reset! Refresh the page and navigate to Scanner to start the tour.')
  }
}

export const Tour = () => {
  const { markTourCompleted, initializeTour, navigate, location } = useTour()
  const tourStartedRef = useRef(false)

  useEffect(() => {
    const tourStarted = localStorage.getItem(TOUR_STARTED_KEY) === 'true'
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
    const isNewUser = !tourStarted && !tourCompleted

    if (isNewUser && location.pathname === ROUTES.SCANNER && !tourStartedRef.current) {
      console.log('Tour: New user detected, starting tour...')
      
      const checkAndStartTour = (retries = 0) => {
        const scannerTitle = document.querySelector('[data-tour="scanner-title"]')
        if (scannerTitle) {
          console.log('Tour: Element found, initializing tour...')
          tourStartedRef.current = true
          localStorage.setItem(TOUR_STARTED_KEY, 'true')
          
          try {
            const tour = initializeTour()
            createTourSteps(tour, navigate, markTourCompleted)
            setTimeout(() => {
              tour.start()
              console.log('Tour: Started successfully')
            }, 300)
          } catch (error) {
            console.error('Tour: Error starting tour', error)
          }
        } else if (retries < 20) {
          console.log(`Tour: Element not found, retrying... (${retries + 1}/20)`)
          setTimeout(() => checkAndStartTour(retries + 1), 500)
        } else {
          console.error('Tour: Failed to find element after 20 retries')
          console.log('Tour: Available elements:', document.querySelectorAll('[data-tour]'))
        }
      }

      checkAndStartTour(0)
      const timer = setTimeout(() => checkAndStartTour(0), 1000)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, initializeTour, navigate, markTourCompleted])

  return null
}
