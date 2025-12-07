import { FC, useState, useEffect } from 'react'
import { Form, Formik, FormikHelpers } from 'formik'
import { Button, Input } from 'UI'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangeUsernameMutation,
  useChangePasswordMutation,
  useAddLogMutation,
} from 'store/api'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from 'store/store'
import { updateUsername, setTokens } from 'store/reducers/user.slice'
import {
  passwordChangeInitialValues,
  passwordChangeValidationSchema,
  usernameChangeInitialValues,
  usernameChangeValidationSchema,
} from './ProfileForm.utils'

type TabType = 'network' | 'username' | 'password'

const Profile: FC = () => {
  const { data: profile, isLoading } = useGetProfileQuery()
  const [updateProfile] = useUpdateProfileMutation()
  const [changeUsername] = useChangeUsernameMutation()
  const [changePassword] = useChangePasswordMutation()
  const [addLog] = useAddLogMutation()
  const user = useSelector((state: RootState) => state.user.user)
  const dispatch = useDispatch()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('network')

  // Profile settings state
  const [profilingPreference, setProfilingPreference] = useState('balanced')
  const [speedNetworkPreference, setSpeedNetworkPreference] = useState('medium')
  const [confidenceLevel, setConfidenceLevel] = useState('medium')
  const [profileType, setProfileType] = useState('personal')
  const [preferredAuth, setPreferredAuth] = useState<string[]>(['WPA3', 'WPA2'])
  const [minSignalStrength, setMinSignalStrength] = useState(50)
  const [maxRiskLevel, setMaxRiskLevel] = useState('M')

  // Success state
  const [usernameChanged, setUsernameChanged] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Track when user manually changes values (not from database load)
  const [userChangedSpeed, setUserChangedSpeed] = useState(false)
  const [userChangedConfidence, setUserChangedConfidence] = useState(false)
  const [userChangedProfiling, setUserChangedProfiling] = useState(false)
  const [userChangedProfileType, setUserChangedProfileType] = useState(false)
  
  // Track previous values for change detection
  const [previousProfile, setPreviousProfile] = useState<typeof profile | null>(null)
  const [previousUsername, setPreviousUsername] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      // Load stored values exactly as they are in the database (including 0, null, etc.)
      setProfilingPreference(profile.profiling_preference)
      setSpeedNetworkPreference(profile.speed_network_preference)
      setConfidenceLevel(profile.confidence_level)
      setProfileType(profile.profile_type)
      setPreferredAuth([...(profile.preferred_authentication || ['WPA3', 'WPA2'])]) // Create a copy to avoid read-only issues
      
      // Use nullish coalescing to preserve 0 values (only default if null/undefined)
      setMinSignalStrength(profile.min_signal_strength ?? 50)
      setMaxRiskLevel(profile.max_risk_level ?? 'M')
      
      // Store previous profile for change detection (only on initial load)
      if (isInitialLoad) {
        // Initial load - set previous profile to current state for comparison
        // Create a deep copy to avoid read-only issues with RTK Query response
        setPreviousProfile({
          ...profile,
          preferred_authentication: [...(profile.preferred_authentication || [])],
        })
        setIsInitialLoad(false)
        // Reset user change flags on initial load
        setUserChangedSpeed(false)
        setUserChangedConfidence(false)
        setUserChangedProfiling(false)
        setUserChangedProfileType(false)
      }
      // If not initial load and previousProfile exists, keep it (user is editing)
      // previousProfile will be updated after successful save
    }
    if (user?.username) {
      // Store previous username for change detection
      if (!previousUsername) {
        setPreviousUsername(user.username)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user])

  // Auto-adjust min_signal_strength based on speed_network_preference
  // Only when user manually changes speed preference, not on initial load
  useEffect(() => {
    if (isInitialLoad || !profile || !userChangedSpeed) return
    
    switch (speedNetworkPreference) {
      case 'high':
        if (minSignalStrength < 70) {
          setMinSignalStrength(70)
        }
        break
      case 'medium':
        if (minSignalStrength > 60 || (minSignalStrength < 40 && minSignalStrength !== 50)) {
          setMinSignalStrength(50)
        }
        break
      case 'low':
        if (minSignalStrength > 40 && minSignalStrength !== 30) {
          setMinSignalStrength(30)
        }
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedNetworkPreference, isInitialLoad, profile, userChangedSpeed])

  // Auto-adjust max_risk_level based on confidence_level
  // Only when user manually changes confidence level, not on initial load
  useEffect(() => {
    if (isInitialLoad || !profile || !userChangedConfidence) return
    
    // Force immediate update based on current confidence level
    switch (confidenceLevel) {
      case 'high':
        // High confidence = stricter: only Low or Medium risk allowed
        // If current risk is High or Critical, set to Medium
        if (maxRiskLevel === 'H' || maxRiskLevel === 'C') {
          setMaxRiskLevel('M')
        }
        break
      case 'medium':
        // Medium confidence: allow up to High risk, but not Critical
        // If current risk is Critical, set to High
        if (maxRiskLevel === 'C') {
          setMaxRiskLevel('H')
        }
        break
      case 'low':
        // Low confidence allows all risk levels - no auto-adjust needed
        break
    }
  }, [confidenceLevel, maxRiskLevel, isInitialLoad, profile, userChangedConfidence])

  // Auto-adjust settings based on profiling_preference
  // Only when user manually changes profiling preference, not on initial load
  useEffect(() => {
    if (isInitialLoad || !profile || !userChangedProfiling) return
    
    switch (profilingPreference) {
      case 'speed':
        // Speed priority: set high speed preference and allow higher risk
        setSpeedNetworkPreference('high')
        // Allow higher risk levels for speed priority (up to High, not Critical)
        if (maxRiskLevel === 'L' || maxRiskLevel === 'M' || maxRiskLevel === 'C') {
          setMaxRiskLevel('H')
        }
        // Auto-set minimum signal strength to high if not already set high enough
        // Set this directly here since we're auto-changing speed
        if (minSignalStrength < 70) {
          setMinSignalStrength(70)
        }
        break
      case 'security':
        // Security priority: focus on secure networks only
        // Don't change Speed Network Preference - leave it as user set
        // Set Preferred Authentication Types to only WPA3 and WPA2 (most secure)
        const hasOnlySecureAuth = preferredAuth.length === 2 && 
          preferredAuth.includes('WPA3') && 
          preferredAuth.includes('WPA2') &&
          !preferredAuth.some(auth => auth !== 'WPA3' && auth !== 'WPA2')
        if (!hasOnlySecureAuth) {
          setPreferredAuth(['WPA3', 'WPA2'])
        }
        // Set Maximum Risk Level to Medium (allows Low and Medium only)
        if (maxRiskLevel === 'H' || maxRiskLevel === 'C') {
          setMaxRiskLevel('M')
        }
        // Don't touch minimum signal strength - not relevant for security
        break
      case 'balanced':
        // Balanced: set medium speed preference and medium risk
        setSpeedNetworkPreference('medium')
        // Allow up to High risk but not Critical for balanced
        if (maxRiskLevel === 'C') {
          setMaxRiskLevel('H')
        }
        // Auto-set minimum signal strength to medium if needed
        // Set this directly here since we're auto-changing speed
        if (minSignalStrength < 40 || minSignalStrength > 60) {
          setMinSignalStrength(50)
        }
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilingPreference, isInitialLoad, profile, userChangedProfiling])

  // Auto-adjust settings based on profile_type
  // Only when user manually changes profile type, not on initial load
  useEffect(() => {
    if (isInitialLoad || !profile || !userChangedProfileType) return
    
    if (profileType === 'work') {
      // Work: stricter security - enforce Low/Medium risk only
      // If current risk is High or Critical, set to Medium
      if (maxRiskLevel === 'H' || maxRiskLevel === 'C') {
        setMaxRiskLevel('M')
      }
      
      // Only allow secure authentication for work - enforce WPA3/WPA2 only
      const hasUnsecureAuth = preferredAuth.some(auth => auth !== 'WPA3' && auth !== 'WPA2')
      const hasSecureAuth = preferredAuth.includes('WPA3') || preferredAuth.includes('WPA2')
      
      // If there's unsecure auth (like WPA or Open) or no secure auth, replace with only secure
      if (hasUnsecureAuth || !hasSecureAuth) {
        const newAuth = preferredAuth.filter(auth => auth === 'WPA3' || auth === 'WPA2')
        // Ensure at least WPA3 or WPA2 is present
        if (newAuth.length === 0) {
          setPreferredAuth(['WPA3', 'WPA2'])
        } else {
          setPreferredAuth(newAuth)
        }
      }
    }
  }, [profileType, maxRiskLevel, preferredAuth, isInitialLoad, profile, userChangedProfileType])

  const handleAuthToggle = (auth: string) => {
    // In security mode or work mode: only allow WPA3 and WPA2, and prevent unchecking them
    const isSecurityMode = profilingPreference === 'security'
    const isWorkMode = profileType === 'work'
    
    if (isSecurityMode || isWorkMode) {
      // Prevent toggling non-secure auth types
      if (auth !== 'WPA3' && auth !== 'WPA2') {
        return
      }
      // Prevent unchecking secure auth types (must have at least one)
      if (preferredAuth.includes(auth) && preferredAuth.filter(a => a === 'WPA3' || a === 'WPA2').length <= 1) {
        return // Don't allow unchecking if it's the last secure auth type
      }
    }
    
    setPreferredAuth(prev =>
      prev.includes(auth)
        ? prev.filter(a => a !== auth)
        : [...prev, auth]
    )
  }

  const handleSaveProfile = async () => {
    try {
      // Detect what changed by comparing with previous profile
      const changedFields: string[] = []
      
      if (previousProfile) {
        if (previousProfile.profiling_preference !== profilingPreference) {
          changedFields.push(`Profiling Preference: ${previousProfile.profiling_preference} → ${profilingPreference}`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Profiling Preference changed from "${previousProfile.profiling_preference}" to "${profilingPreference}"`,
          }).catch(console.error)
        }
        
        if (previousProfile.speed_network_preference !== speedNetworkPreference) {
          changedFields.push(`Speed Network Preference: ${previousProfile.speed_network_preference} → ${speedNetworkPreference}`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Speed Network Preference changed from "${previousProfile.speed_network_preference}" to "${speedNetworkPreference}"`,
          }).catch(console.error)
        }
        
        if (previousProfile.confidence_level !== confidenceLevel) {
          changedFields.push(`Confidence Level: ${previousProfile.confidence_level} → ${confidenceLevel}`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Confidence Level changed from "${previousProfile.confidence_level}" to "${confidenceLevel}"`,
          }).catch(console.error)
        }
        
        if (previousProfile.profile_type !== profileType) {
          changedFields.push(`Profile Type: ${previousProfile.profile_type} → ${profileType}`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Profile Type changed from "${previousProfile.profile_type}" to "${profileType}"`,
          }).catch(console.error)
        }
        
        const prevAuthStr = [...(previousProfile.preferred_authentication || [])].sort().join(', ')
        const newAuthStr = [...preferredAuth].sort().join(', ')
        if (prevAuthStr !== newAuthStr) {
          changedFields.push(`Preferred Authentication: [${prevAuthStr}] → [${newAuthStr}]`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Preferred Authentication changed from [${prevAuthStr}] to [${newAuthStr}]`,
          }).catch(console.error)
        }
        
        if (previousProfile.min_signal_strength !== minSignalStrength) {
          changedFields.push(`Minimum Signal Strength: ${previousProfile.min_signal_strength}% → ${minSignalStrength}%`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Minimum Signal Strength changed from ${previousProfile.min_signal_strength}% to ${minSignalStrength}%`,
          }).catch(console.error)
        }
        
        if (previousProfile.max_risk_level !== maxRiskLevel) {
          changedFields.push(`Maximum Risk Level: ${previousProfile.max_risk_level} → ${maxRiskLevel}`)
          addLog({
            network_ssid: '-',
            action: 'PROFILE_SETTING_CHANGED',
            details: `Maximum Risk Level changed from "${previousProfile.max_risk_level}" to "${maxRiskLevel}"`,
          }).catch(console.error)
        }
      }
      
      await updateProfile({
        profiling_preference: profilingPreference,
        speed_network_preference: speedNetworkPreference,
        confidence_level: confidenceLevel,
        profile_type: profileType,
        preferred_authentication: preferredAuth,
        min_signal_strength: minSignalStrength,
        max_risk_level: maxRiskLevel,
      }).unwrap()
      
      // Update previous profile after successful save to reflect new values
      setPreviousProfile({
        ...profile!,
        profiling_preference: profilingPreference,
        speed_network_preference: speedNetworkPreference,
        confidence_level: confidenceLevel,
        profile_type: profileType,
        preferred_authentication: [...preferredAuth], // Create a copy to avoid read-only issues
        min_signal_strength: minSignalStrength,
        max_risk_level: maxRiskLevel,
      })
      
      // Reset user change flags after successful save
      setUserChangedSpeed(false)
      setUserChangedConfidence(false)
      setUserChangedProfiling(false)
      setUserChangedProfileType(false)
      
      // Log summary if multiple fields changed
      if (changedFields.length > 1) {
        addLog({
          network_ssid: '-',
          action: 'PROFILE_UPDATED',
          details: `Profile updated: ${changedFields.length} settings changed`,
        }).catch(console.error)
      } else if (changedFields.length === 0) {
        // No changes detected (user clicked save without changes)
        addLog({
          network_ssid: '-',
          action: 'PROFILE_SAVE_ATTEMPTED',
          details: 'Profile save attempted but no changes detected',
        }).catch(console.error)
      }
      
      alert('Profile updated successfully!')
    } catch (error: any) {
      addLog({
        network_ssid: '-',
        action: 'PROFILE_UPDATE_FAILED',
        details: `Failed to update profile: ${error?.data?.error || error?.message || 'Unknown error'}`,
      }).catch(console.error)
      alert(`Failed to update profile: ${error?.data?.error || error?.message || 'Unknown error'}`)
    }
  }

  const handleChangeUsername = async (
    values: { username: string },
    { resetForm }: FormikHelpers<{ username: string }>
  ) => {
    const oldUsername = previousUsername || user?.username || ''
    const newUsername = values.username.trim()
    
    if (oldUsername === newUsername) {
      alert('Username is unchanged')
      return
    }
    
    try {
      const response = await changeUsername({ username: newUsername }).unwrap()
      
      // Update tokens with new JWT that contains updated username
      if (response.token && response.refresh_token) {
        dispatch(setTokens({
          token: response.token,
          refresh_token: response.refresh_token
        }))
      }
      
      // Update username in Redux store
      dispatch(updateUsername(response.username))
      setPreviousUsername(newUsername)
      setUsernameChanged(true)
      setTimeout(() => setUsernameChanged(false), 3000)
      
      // Log username change
      addLog({
        network_ssid: '-',
        action: 'USERNAME_CHANGED',
        details: `Username changed from "${oldUsername}" to "${newUsername}"`,
      }).catch(console.error)
      
      alert('Username updated successfully!')
      resetForm()
    } catch (error: any) {
      addLog({
        network_ssid: '-',
        action: 'USERNAME_CHANGE_FAILED',
        details: `Failed to change username: ${error?.data?.error || error?.message || 'Unknown error'}`,
      }).catch(console.error)
      alert(`Failed to update username: ${error?.data?.error || error?.message || 'Unknown error'}`)
    }
  }

  const handleChangePassword = async (
    values: { currentPassword: string; newPassword: string; confirmPassword: string },
    { resetForm }: FormikHelpers<{ currentPassword: string; newPassword: string; confirmPassword: string }>
  ) => {
    try {
      await changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      }).unwrap()
      
      // Log successful password change (don't log the actual password)
      addLog({
        network_ssid: '-',
        action: 'PASSWORD_CHANGED',
        details: `Password changed successfully (length: ${values.newPassword.length} characters)`,
      }).catch(console.error)
      
      setPasswordChanged(true)
      setTimeout(() => setPasswordChanged(false), 3000)
      alert('Password updated successfully!')
      resetForm()
    } catch (error: any) {
      addLog({
        network_ssid: '-',
        action: 'PASSWORD_CHANGE_FAILED',
        details: `Failed to change password: ${error?.data?.error || error?.message || 'Unknown error'}`,
      }).catch(console.error)
      alert(`Failed to update password: ${error?.data?.error || error?.message || 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full">
        <h1 className="font-bold text-lg small-laptop:text-xl mb-2 small-laptop:mb-[10px]">Profile Settings</h1>
        <p>Loading...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'network' as TabType, label: 'Network Profiling Preferences' },
    { id: 'username' as TabType, label: 'Change Username' },
    { id: 'password' as TabType, label: 'Change Password' },
  ]

  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full large-laptop:max-w-4xl">
      <h1 className="font-bold text-lg small-laptop:text-xl normal-laptop:text-[20px] mb-4 small-laptop:mb-5 normal-laptop:mb-6">Profile Settings</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4 small-laptop:mb-5 normal-laptop:mb-6 overflow-x-auto">
        <nav className="flex space-x-4 small-laptop:space-x-6 normal-laptop:space-x-8 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="outline"
              className={`!py-3 small-laptop:!py-4 !px-1 !border-b-2 !font-medium !text-xs small-laptop:!text-sm !whitespace-nowrap !transition-colors !bg-transparent !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto !justify-start !gap-0 ${
                activeTab === tab.id
                  ? '!border-[#3e3caa] !text-[#3e3caa]'
                  : '!border-transparent !text-gray-500 hover:!text-gray-700 hover:!border-gray-300'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-4 small-laptop:p-5 normal-laptop:p-6">
        {/* Network Profiling Preferences Tab */}
        {activeTab === 'network' && (
          <div>
            <h2 className="text-base small-laptop:text-lg font-semibold mb-3 small-laptop:mb-4">Network Profiling Preferences</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Profiling Preference</label>
          <select
            value={profilingPreference}
            onChange={(e) => {
              setProfilingPreference(e.target.value)
              setUserChangedProfiling(true)
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="speed">Speed</option>
            <option value="security">Security</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Speed Network Preference</label>
          <select
            value={speedNetworkPreference}
            onChange={(e) => {
              setSpeedNetworkPreference(e.target.value)
              setUserChangedSpeed(true)
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Confidence Level</label>
          <select
            value={confidenceLevel}
            onChange={(e) => {
              setConfidenceLevel(e.target.value)
              setUserChangedConfidence(true)
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Profile Type</label>
          <select
            value={profileType}
            onChange={(e) => {
              setProfileType(e.target.value)
              setUserChangedProfileType(true)
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Preferred Authentication Types</label>
          <div className="flex flex-wrap gap-3">
            {['WPA3', 'WPA2', 'WPA', 'Open'].map((auth) => {
              const isSecurityMode = profilingPreference === 'security'
              const isWorkMode = profileType === 'work'
              const isSecureAuth = auth === 'WPA3' || auth === 'WPA2'
              const isDisabled = (isSecurityMode || isWorkMode) && !isSecureAuth
              
              return (
                <label 
                  key={auth} 
                  className={`flex items-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={preferredAuth.includes(auth)}
                    onChange={() => handleAuthToggle(auth)}
                    disabled={isDisabled}
                    className="mr-2"
                  />
                  {auth}
                </label>
              )
            })}
          </div>
          {(profilingPreference === 'security' || profileType === 'work') && (
            <p className="text-xs text-gray-500 mt-1">
              {profilingPreference === 'security' ? 'Security mode: ' : 'Work mode: '}
              Only WPA3 and WPA2 allowed
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Minimum Signal Strength: {minSignalStrength}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={minSignalStrength}
            onChange={(e) => setMinSignalStrength(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Maximum Risk Level</label>
          <select
            value={maxRiskLevel}
            onChange={(e) => setMaxRiskLevel(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="L">Low</option>
            <option value="M">Medium</option>
            <option value="H" disabled={profilingPreference === 'security' || profileType === 'work'}>High</option>
            <option value="C" disabled={profilingPreference === 'security' || profileType === 'work'}>Critical</option>
          </select>
          {(profilingPreference === 'security' || profileType === 'work') && (
            <p className="text-xs text-gray-500 mt-1">
              {profilingPreference === 'security' ? 'Security mode: ' : 'Work mode: '}
              Only Low and Medium risk levels allowed
            </p>
          )}
        </div>

            <div className="mt-6">
              <Button variant="secondary" onClick={handleSaveProfile}>
                Save Profile Settings
              </Button>
            </div>
          </div>
        )}

        {/* Change Username Tab */}
        {activeTab === 'username' && (
          <div>
            <h2 className="text-base small-laptop:text-lg font-semibold mb-3 small-laptop:mb-4">Change Username</h2>
            <Formik
              initialValues={{
                ...usernameChangeInitialValues,
                username: user?.username || '',
              }}
              validationSchema={usernameChangeValidationSchema}
              onSubmit={handleChangeUsername}
              enableReinitialize
            >
              {({ values, isSubmitting }) => (
                <Form className="flex flex-col gap-4">
                  <Input
                    name="username"
                    labelText="Username"
                    type="text"
                    placeholder="Enter new username"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={isSubmitting || !values.username.trim() || values.username === user?.username}
                  >
                    {isSubmitting ? 'Updating...' : usernameChanged ? 'Username Updated!' : 'Update Username'}
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div>
            <h2 className="text-base small-laptop:text-lg font-semibold mb-3 small-laptop:mb-4">Change Password</h2>
            <Formik
              initialValues={passwordChangeInitialValues}
              validationSchema={passwordChangeValidationSchema}
              onSubmit={handleChangePassword}
            >
              {({ isSubmitting }) => (
                <Form className="flex flex-col gap-4">
                  <Input
                    name="currentPassword"
                    labelText="Current Password"
                    type="password"
                    placeholder="Enter current password"
                  />
                  <Input
                    name="newPassword"
                    labelText="New Password"
                    type="password"
                    placeholder="Enter new password"
                  />
                  <Input
                    name="confirmPassword"
                    labelText="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : passwordChanged ? 'Password Updated!' : 'Update Password'}
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile

