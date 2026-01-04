import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

const TOUR_COMPLETED_KEY = 'wisp_tour_completed'
const TOUR_STARTED_KEY = 'wisp_tour_started'

export const useTour = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const tourRef = useRef<Shepherd.Tour | null>(null)
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const hasCompletedTour = (): boolean => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
  }

  const markTourCompleted = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    localStorage.removeItem(TOUR_STARTED_KEY)
  }

  const isNewUser = (): boolean => {
    return localStorage.getItem(TOUR_STARTED_KEY) !== 'true' && !hasCompletedTour()
  }

  const markTourStarted = () => {
    localStorage.setItem(TOUR_STARTED_KEY, 'true')
  }

  const initializeTour = () => {
    if (tourRef.current) {
      try {
        (tourRef.current as any).cancel()
      } catch (e) {
        console.log(e);
        
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

  const startTour = () => {
    if (hasCompletedTour()) {
      return
    }

    markTourStarted()
    setIsTourActive(true)
  }

  const stopTour = () => {
    if (tourRef.current) {
      tourRef.current.complete()
      tourRef.current = null
    }
    setIsTourActive(false)
  }

  useEffect(() => {
    return () => {
      if (tourRef.current) {
        try {
          (tourRef.current as any).cancel()
        } catch (e) {
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
