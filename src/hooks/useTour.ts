import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import { ROUTES } from 'routes/routes.utils'

const TOUR_COMPLETED_KEY = 'wisp_tour_completed'
const TOUR_STARTED_KEY = 'wisp_tour_started'

export const useTour = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const tourRef = useRef<Shepherd.Tour | null>(null)
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Check if user has completed the tour
  const hasCompletedTour = (): boolean => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
  }

  // Mark tour as completed
  const markTourCompleted = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    localStorage.removeItem(TOUR_STARTED_KEY)
  }

  // Check if user is a new user (just registered)
  const isNewUser = (): boolean => {
    return localStorage.getItem(TOUR_STARTED_KEY) !== 'true' && !hasCompletedTour()
  }

  // Mark tour as started
  const markTourStarted = () => {
    localStorage.setItem(TOUR_STARTED_KEY, 'true')
  }

  // Initialize tour
  const initializeTour = () => {
    if (tourRef.current) {
      // Shepherd.js Tour doesn't have destroy(), use cancel() or complete() instead
      try {
        (tourRef.current as any).cancel()
      } catch (e) {
        // Ignore if cancel doesn't work
      }
    }

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        scrollTo: { behavior: 'smooth', block: 'center' },
        classes: 'shepherd-theme-custom',
      },
    })

    tourRef.current = tour
    return tour
  }

  // Start the tour (deprecated - use initializeTour and start directly)
  const startTour = () => {
    if (hasCompletedTour()) {
      return
    }

    markTourStarted()
    setIsTourActive(true)
  }

  // Stop the tour
  const stopTour = () => {
    if (tourRef.current) {
      tourRef.current.complete()
      // Shepherd.js Tour doesn't have destroy(), just set to null
      tourRef.current = null
    }
    setIsTourActive(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        try {
          (tourRef.current as any).cancel()
        } catch (e) {
          // Ignore if cancel doesn't work
        }
        tourRef.current = null
      }
    }
  }, [])

  return {
    isTourActive,
    currentStepIndex,
    hasCompletedTour,
    isNewUser,
    startTour,
    stopTour,
    markTourCompleted,
    initializeTour,
    tourRef,
    navigate,
    location,
  }
}
