import { FC, useState, useEffect } from 'react'
import { Button } from 'UI'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangeUsernameMutation,
  useChangePasswordMutation,
} from 'store/api'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from 'store/store'
import { updateUsername } from 'store/reducers/user.slice'

type TabType = 'network' | 'username' | 'password'

const Profile: FC = () => {
  const { data: profile, isLoading } = useGetProfileQuery()
  const [updateProfile] = useUpdateProfileMutation()
  const [changeUsername] = useChangeUsernameMutation()
  const [changePassword] = useChangePasswordMutation()
  const user = useSelector((state: RootState) => state.user.user)
  const dispatch = useDispatch()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('network')

  // Profile settings state
  const [profilingPreference, setProfilingPreference] = useState('balanced')
  const [speedNetworkPreference, setSpeedNetworkPreference] = useState('medium')
  const [confidenceLevel, setConfidenceLevel] = useState('medium')
  const [profileType, setProfileType] = useState('personal')
  const [networkPreference, setNetworkPreference] = useState('balanced')
  const [preferredAuth, setPreferredAuth] = useState<string[]>(['WPA3', 'WPA2'])
  const [minSignalStrength, setMinSignalStrength] = useState(50)
  const [maxRiskLevel, setMaxRiskLevel] = useState('M')

  // Username/Password state
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usernameChanged, setUsernameChanged] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (profile) {
      setProfilingPreference(profile.profiling_preference)
      setSpeedNetworkPreference(profile.speed_network_preference)
      setConfidenceLevel(profile.confidence_level)
      setProfileType(profile.profile_type)
      setNetworkPreference(profile.network_preference)
      setPreferredAuth(profile.preferred_authentication || ['WPA3', 'WPA2'])
      setMinSignalStrength(profile.min_signal_strength || 50)
      setMaxRiskLevel(profile.max_risk_level || 'M')
      setIsInitialLoad(false)
    }
    if (user?.username) {
      setUsername(user.username)
    }
  }, [profile, user])

  // Auto-adjust min_signal_strength based on speed_network_preference
  useEffect(() => {
    if (isInitialLoad || !profile) return // Only auto-adjust after initial load and user changes
    
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
  }, [speedNetworkPreference, isInitialLoad, profile])

  // Auto-adjust max_risk_level based on confidence_level
  useEffect(() => {
    if (isInitialLoad || !profile) return // Only auto-adjust after initial load
    
    switch (confidenceLevel) {
      case 'high':
        // High confidence = stricter: only Low or Medium risk allowed
        if (maxRiskLevel === 'H' || maxRiskLevel === 'C') {
          setMaxRiskLevel('M')
        }
        break
      case 'medium':
        // Medium confidence: allow up to High risk, but not Critical
        if (maxRiskLevel === 'C') {
          setMaxRiskLevel('H')
        }
        break
      case 'low':
        // Low confidence allows all risk levels - no auto-adjust needed
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confidenceLevel, isInitialLoad, profile])

  // Auto-adjust settings based on profiling_preference (only suggest, don't force)
  useEffect(() => {
    if (isInitialLoad || !profile) return // Only auto-adjust after initial load
    
    // Note: We don't auto-adjust other fields here to avoid loops
    // This is just for information - the filtering logic uses profiling_preference
  }, [profilingPreference, isInitialLoad, profile])

  // Auto-adjust settings based on profile_type
  useEffect(() => {
    if (isInitialLoad || !profile) return // Only auto-adjust after initial load
    
    if (profileType === 'work' || profileType === 'public') {
      // Work and public: stricter security - enforce Low/Medium risk only
      if (maxRiskLevel === 'H' || maxRiskLevel === 'C') {
        setMaxRiskLevel('M')
      }
      // Only allow secure authentication for work/public - enforce WPA3/WPA2 only
      const hasUnsecureAuth = preferredAuth.some(auth => auth !== 'WPA3' && auth !== 'WPA2')
      const hasSecureAuth = preferredAuth.includes('WPA3') || preferredAuth.includes('WPA2')
      
      // If there's unsecure auth or no secure auth, replace with only secure
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType, isInitialLoad, profile])

  const handleAuthToggle = (auth: string) => {
    setPreferredAuth(prev =>
      prev.includes(auth)
        ? prev.filter(a => a !== auth)
        : [...prev, auth]
    )
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        profiling_preference: profilingPreference,
        speed_network_preference: speedNetworkPreference,
        confidence_level: confidenceLevel,
        profile_type: profileType,
        network_preference: networkPreference,
        preferred_authentication: preferredAuth,
        min_signal_strength: minSignalStrength,
        max_risk_level: maxRiskLevel,
      }).unwrap()
      alert('Profile updated successfully!')
    } catch (error: any) {
      alert(`Failed to update profile: ${error?.data?.error || error?.message || 'Unknown error'}`)
    }
  }

  const handleChangeUsername = async () => {
    if (!username.trim()) {
      alert('Username cannot be empty')
      return
    }
    try {
      const response = await changeUsername({ username: username.trim() }).unwrap()
      dispatch(updateUsername(response.username))
      setUsernameChanged(true)
      setTimeout(() => setUsernameChanged(false), 3000)
      alert('Username updated successfully!')
    } catch (error: any) {
      alert(`Failed to update username: ${error?.data?.error || error?.message || 'Unknown error'}`)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap()
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordChanged(true)
      setTimeout(() => setPasswordChanged(false), 3000)
      alert('Password updated successfully!')
    } catch (error: any) {
      alert(`Failed to update password: ${error?.data?.error || error?.message || 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-5 w-full">
        <h1 className="font-bold text-[20px] mb-[10px]">Profile Settings</h1>
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
    <div className="p-5 w-full max-w-4xl">
      <h1 className="font-bold text-[20px] mb-6">Profile Settings</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#3e3caa] text-[#3e3caa]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Network Profiling Preferences Tab */}
        {activeTab === 'network' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Network Profiling Preferences</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Profiling Preference</label>
          <select
            value={profilingPreference}
            onChange={(e) => setProfilingPreference(e.target.value)}
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
            onChange={(e) => setSpeedNetworkPreference(e.target.value)}
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
            onChange={(e) => setConfidenceLevel(e.target.value)}
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
            onChange={(e) => setProfileType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Network Preference</label>
          <select
            value={networkPreference}
            onChange={(e) => setNetworkPreference(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="more_speed_less_security">More Speed, Less Security</option>
            <option value="balanced">Balanced</option>
            <option value="more_security_less_speed">More Security, Less Speed</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Preferred Authentication Types</label>
          <div className="flex flex-wrap gap-3">
            {['WPA3', 'WPA2', 'WPA', 'Open'].map((auth) => (
              <label key={auth} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferredAuth.includes(auth)}
                  onChange={() => handleAuthToggle(auth)}
                  className="mr-2"
                />
                {auth}
              </label>
            ))}
          </div>
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
            <option value="H">High</option>
            <option value="C">Critical</option>
          </select>
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
            <h2 className="text-lg font-semibold mb-4">Change Username</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleChangeUsername}
              disabled={!username.trim() || username === user?.username}
            >
              {usernameChanged ? 'Username Updated!' : 'Update Username'}
            </Button>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              {passwordChanged ? 'Password Updated!' : 'Update Password'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile

