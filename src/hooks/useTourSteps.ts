import Shepherd from 'shepherd.js'
import { ROUTES } from 'routes/routes.utils'

export const createTourSteps = (
  tour: Shepherd.Tour,
  navigate: (path: string) => void,
  onComplete: () => void
) => {
  // Step 1: Welcome and explain Scanner page
  tour.addStep({
    id: 'welcome-scanner',
    text: 'Welcome to WISP! This is the Scanner page where you can discover and analyze Wi-Fi networks. Let\'s start by exploring the main features.',
    attachTo: {
      element: '[data-tour="scanner-title"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Next',
        action: () => {
          navigate(ROUTES.SCANNER)
          setTimeout(() => tour.next(), 500)
        },
      },
    ],
  })

  // Step 2: Explain Scan button - make it clickable and auto-scan on Next
  tour.addStep({
    id: 'scan-button',
    text: 'Click the "Scan" button to discover all available Wi-Fi networks in your area. The scan will show you networks with their security information.',
    attachTo: {
      element: '[data-tour="scan-button"]',
      on: 'top',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next (Auto-Scan)',
        action: () => {
          // Auto-trigger scan when clicking Next
          // The Button component renders a button element, so data-tour should be on the button
          const scanButton = document.querySelector('button[data-tour="scan-button"]') as HTMLElement
          
          if (scanButton && !scanButton.disabled && !scanButton.textContent?.includes('Scanning')) {
            // Trigger click event directly
            scanButton.click()
            // Wait for scan to complete, then proceed
            setTimeout(() => {
              tour.next()
            }, 3000) // Wait 3 seconds for scan to complete
          } else {
            // If scan button not found or already scanning, proceed anyway
            tour.next()
          }
        },
      },
    ],
  })

  // Step 3: Explain filters
  tour.addStep({
    id: 'filters',
    text: 'Use the search bar and risk level filters to find specific networks. You can filter by SSID, encryption type, authentication method, or risk level (Critical, High, Medium, Low, Whitelisted).',
    attachTo: {
      element: '[data-tour="scanner-search"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: () => {
          // Wait a bit for networks to appear after scan
          setTimeout(() => tour.next(), 500)
        },
      },
    ],
  })

  // Step 4: Show network row and make it clickable
  tour.addStep({
    id: 'network-row',
    text: 'After scanning, you\'ll see a list of available networks. Click on any network row to expand it and see detailed information and actions.',
    attachTo: {
      element: '[data-tour="network-row"]',
      on: 'top',
    },
    canClickTarget: true,
    beforeShowPromise: () => {
      // Wait for networks to appear after scan
      return new Promise((resolve) => {
        let retries = 0
        const checkForNetworks = () => {
          const networkRow = document.querySelector('[data-tour="network-row"]')
          if (networkRow || retries >= 15) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkForNetworks, 300)
          }
        }
        checkForNetworks()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next (Click Network)',
        action: () => {
          // Try to click the first network row to expand it
          const networkRow = document.querySelector('[data-tour="network-row"]') as HTMLElement
          if (networkRow) {
            networkRow.click()
            // Wait a bit for the network details to expand
            setTimeout(() => {
              // Check if network actions are now visible
              const networkActions = document.querySelector('[data-tour="network-actions"]')
              if (networkActions) {
                tour.next()
              } else {
                // If actions not visible, proceed anyway
                setTimeout(() => tour.next(), 500)
              }
            }, 500)
          } else {
            // If no networks found, skip to next step
            tour.next()
          }
        },
      },
    ],
  })

  // Step 5: Explain network actions (Blacklist, Whitelist, Connect) - after network is expanded
  tour.addStep({
    id: 'network-actions',
    text: 'When you click on a network, you can see actions: Connect to join the network, Blacklist to mark as unsafe (won\'t show in future scans), and Whitelist to mark as trusted (always shown with low risk).',
    attachTo: {
      element: '[data-tour="network-actions"]',
      on: 'top',
    },
    beforeShowPromise: () => {
      // Wait for network actions to appear after network is expanded
      return new Promise((resolve) => {
        let retries = 0
        const checkForActions = () => {
          const networkActions = document.querySelector('[data-tour="network-actions"]')
          if (networkActions || retries >= 10) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkForActions, 200)
          }
        }
        checkForActions()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: () => {
          console.log('Tour: Navigating to Blacklist page...')
          navigate(ROUTES.BLACKLIST)
          // Wait for navigation and element to be available
          setTimeout(() => {
            const checkElement = (retries = 0) => {
              const element = document.querySelector('[data-tour="blacklist-title"]')
              if (element) {
                console.log('Tour: Blacklist element found, proceeding to next step')
                // Small delay to ensure page is fully rendered
                setTimeout(() => {
                  tour.next()
                }, 300)
              } else if (retries < 20) {
                console.log(`Tour: Blacklist element not found, retrying... (${retries + 1}/20)`)
                setTimeout(() => checkElement(retries + 1), 200)
              } else {
                console.error('Tour: Failed to find blacklist element after 20 retries')
              }
            }
            checkElement()
          }, 500)
        },
      },
    ],
  })

  // Step 6: Blacklist page - explain search and storage
  tour.addStep({
    id: 'blacklist-page',
    text: 'This is the Blacklist page. Here you can see all networks you\'ve marked as unsafe. Use the search bar to find specific networks by SSID, or filter by date to see when networks were blacklisted.',
    attachTo: {
      element: '[data-tour="blacklist-title"]',
      on: 'bottom',
    },
    beforeShowPromise: () => {
      // Wait for blacklist page element to be available
      return new Promise((resolve) => {
        let retries = 0
        const checkElement = () => {
          const element = document.querySelector('[data-tour="blacklist-title"]')
          if (element || retries >= 15) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkElement, 200)
          }
        }
        checkElement()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: () => {
          navigate(ROUTES.SCANNER)
          setTimeout(() => tour.back(), 500)
        },
      },
      {
        text: 'Next',
        action: () => {
          navigate(ROUTES.WHITELIST)
          setTimeout(() => {
            const checkElement = (retries = 0) => {
              const element = document.querySelector('[data-tour="whitelist-title"]')
              if (element) {
                setTimeout(() => {
                  tour.next()
                }, 300)
              } else if (retries < 20) {
                setTimeout(() => checkElement(retries + 1), 200)
              }
            }
            checkElement()
          }, 500)
        },
      },
    ],
  })

  // Step 7: Whitelist page - explain search and storage
  tour.addStep({
    id: 'whitelist-page',
    text: 'This is the Whitelist page. Networks you mark as trusted are stored here. You can search by SSID or filter by date. Whitelisted networks always appear in scans with low risk, regardless of their actual security level.',
    attachTo: {
      element: '[data-tour="whitelist-title"]',
      on: 'bottom',
    },
    beforeShowPromise: () => {
      // Wait for whitelist page element to be available
      return new Promise((resolve) => {
        let retries = 0
        const checkElement = () => {
          const element = document.querySelector('[data-tour="whitelist-title"]')
          if (element || retries >= 15) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkElement, 200)
          }
        }
        checkElement()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: () => {
          navigate(ROUTES.BLACKLIST)
          setTimeout(() => tour.back(), 500)
        },
      },
      {
        text: 'Next',
        action: () => {
          navigate(ROUTES.LOGS)
          setTimeout(() => {
            const checkElement = (retries = 0) => {
              const element = document.querySelector('[data-tour="logs-title"]')
              if (element) {
                setTimeout(() => {
                  tour.next()
                }, 300)
              } else if (retries < 20) {
                setTimeout(() => checkElement(retries + 1), 200)
              }
            }
            checkElement()
          }, 500)
        },
      },
    ],
  })

  // Step 8: Logs page - explain what's there and how to search
  tour.addStep({
    id: 'logs-page-intro',
    text: 'The Logs page records all your Wi-Fi activities: scans, connections, blacklist/whitelist actions, and more. This helps you track your network security history.',
    attachTo: {
      element: '[data-tour="logs-title"]',
      on: 'bottom',
    },
    beforeShowPromise: () => {
      // Wait for logs page element to be available
      return new Promise((resolve) => {
        let retries = 0
        const checkElement = () => {
          const element = document.querySelector('[data-tour="logs-title"]')
          if (element || retries >= 15) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkElement, 200)
          }
        }
        checkElement()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: () => {
          navigate(ROUTES.WHITELIST)
          setTimeout(() => tour.back(), 500)
        },
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 9: Logs page - explain search functionality
  tour.addStep({
    id: 'logs-search',
    text: 'Use the search filters to find specific log entries: search by SSID, filter by action type (like CONNECTED, SCAN_START), or filter by date range. You can also export all logs to CSV for analysis.',
    attachTo: {
      element: '[data-tour="logs-search"]',
      on: 'top',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: () => {
          navigate(ROUTES.ANALYTICS)
          setTimeout(() => {
            const checkElement = (retries = 0) => {
              const element = document.querySelector('[data-tour="analytics-summary"]')
              if (element) {
                setTimeout(() => {
                  tour.next()
                }, 300)
              } else if (retries < 20) {
                setTimeout(() => checkElement(retries + 1), 200)
              }
            }
            checkElement()
          }, 500)
        },
      },
    ],
  })

  // Step 10: Analytics page - explain summary cards
  tour.addStep({
    id: 'analytics-summary',
    text: 'The Analytics Dashboard shows your Wi-Fi security statistics. The summary cards display: Total Scans, Successful Connections, High Risk Connections, and Unique Networks discovered.',
    attachTo: {
      element: '[data-tour="analytics-summary"]',
      on: 'bottom',
    },
    beforeShowPromise: () => {
      // Wait for analytics page element to be available
      return new Promise((resolve) => {
        let retries = 0
        const checkElement = () => {
          const element = document.querySelector('[data-tour="analytics-summary"]')
          if (element || retries >= 15) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkElement, 200)
          }
        }
        checkElement()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: () => {
          navigate(ROUTES.LOGS)
          setTimeout(() => tour.back(), 500)
        },
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 11: Analytics page - explain risk distribution chart
  tour.addStep({
    id: 'analytics-risk-chart',
    text: 'The Risk Level Distribution pie chart shows the breakdown of your connections by security risk: High Risk (red), Medium Risk (orange), and Low Risk (green). This helps you understand your overall security posture.',
    attachTo: {
      element: '[data-tour="analytics-risk-chart"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 12: Analytics page - explain connection status chart
  tour.addStep({
    id: 'analytics-connection-chart',
    text: 'The Connection Status chart shows the ratio of successful vs failed connection attempts. This helps you identify connection issues and network reliability.',
    attachTo: {
      element: '[data-tour="analytics-connection-chart"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 13: Analytics page - explain threat distribution
  tour.addStep({
    id: 'analytics-threat-chart',
    text: 'The Threat Type Distribution shows different security threats detected: Rogue APs, Evil Twins, Weak Encryption, Deauth Attacks, and more. Use the time filters (Day/Week/Month/Year/All) to analyze threats over different periods.',
    attachTo: {
      element: '[data-tour="analytics-threat-chart"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 14: Analytics page - explain channel usage
  tour.addStep({
    id: 'analytics-channel-chart',
    text: 'The Channel Usage bar chart shows how many access points are using each Wi-Fi channel. This helps identify channel congestion and optimize network selection.',
    attachTo: {
      element: '[data-tour="analytics-channel-chart"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 15: Analytics page - explain blacklist/whitelist stats
  tour.addStep({
    id: 'analytics-list-stats',
    text: 'The Blacklist vs Whitelist section shows statistics about your list management: total networks, additions/removals today, this week, and this month. This tracks your security management activity.',
    attachTo: {
      element: '[data-tour="analytics-list-stats"]',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: () => {
          navigate(ROUTES.PROFILE)
          setTimeout(() => {
            const checkElement = (retries = 0) => {
              const element = document.querySelector('[data-tour="profile-title"]')
              if (element) {
                setTimeout(() => {
                  tour.next()
                }, 300)
              } else if (retries < 20) {
                setTimeout(() => checkElement(retries + 1), 200)
              }
            }
            checkElement()
          }, 500)
        },
      },
    ],
  })

  // Step 16: Profile page - explain profiling preferences (make title clickable/highlighted)
  tour.addStep({
    id: 'profile-intro',
    text: 'The Profile page lets you customize how WISP filters and displays networks. These settings help prioritize networks based on your preferences for speed, security, or a balanced approach.',
    attachTo: {
      element: '[data-tour="profile-title"]',
      on: 'bottom',
    },
    canClickTarget: true,
    beforeShowPromise: () => {
      // Wait for profile page element to be available
      return new Promise((resolve) => {
        let retries = 0
        const checkElement = () => {
          const element = document.querySelector('[data-tour="profile-title"]')
          if (element || retries >= 15) {
            resolve(undefined)
          } else {
            retries++
            setTimeout(checkElement, 200)
          }
        }
        checkElement()
      })
    },
    buttons: [
      {
        text: 'Back',
        action: () => {
          navigate(ROUTES.ANALYTICS)
          setTimeout(() => tour.back(), 500)
        },
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 17: Profile page - explain profiling preference filter (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-profiling-preference',
    text: 'Profiling Preference determines your priority: Speed (prioritizes fast networks), Security (only shows secure networks), or Balanced (mix of both). This affects which networks are shown in scans.',
    attachTo: {
      element: '[data-tour="profile-profiling-preference-select"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 18: Profile page - explain speed network preference (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-speed-preference',
    text: 'Speed Network Preference sets minimum signal strength requirements: High (70%+), Medium (50%+), or Low (any signal). Higher signal means faster, more reliable connections.',
    attachTo: {
      element: '[data-tour="profile-speed-preference-select"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 19: Profile page - explain confidence level (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-confidence',
    text: 'Confidence Level adjusts how strict the risk filtering is: High (only Low/Medium risk), Medium (up to High risk), or Low (allows all risk levels). Higher confidence means stricter security filtering.',
    attachTo: {
      element: '[data-tour="profile-confidence-select"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 20: Profile page - explain profile type (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-type',
    text: 'Profile Type sets context-specific security: Personal (more flexible) or Work (stricter, only secure networks). Work mode enforces stronger authentication requirements.',
    attachTo: {
      element: '[data-tour="profile-type-select"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 21: Profile page - explain preferred authentication (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-auth',
    text: 'Preferred Authentication Types lets you choose which security protocols to allow: WPA3 (most secure), WPA2, WPA, or Open. In Security or Work mode, only WPA3 and WPA2 are allowed.',
    attachTo: {
      element: '[data-tour="profile-auth"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 22: Profile page - explain signal strength slider (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-signal',
    text: 'Minimum Signal Strength slider (0-100%) sets the weakest signal you\'ll accept. Higher values filter out weak networks but may reduce available options. Set to 0 to see all networks regardless of signal.',
    attachTo: {
      element: '[data-tour="profile-signal-slider"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Step 23: Profile page - explain max risk level (make it clickable/highlighted)
  tour.addStep({
    id: 'profile-risk',
    text: 'Maximum Risk Level sets the highest risk you\'ll accept: Low (safest), Medium, High, or Critical. Networks above this level won\'t appear in scans. In Security or Work mode, only Low and Medium are allowed.',
    attachTo: {
      element: '[data-tour="profile-risk-select"]',
      on: 'bottom',
    },
    canClickTarget: true,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Complete Tour',
        action: () => {
          onComplete()
          tour.complete()
        },
      },
    ],
  })

  return tour
}
