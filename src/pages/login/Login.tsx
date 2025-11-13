import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginMutation } from 'store/api'
import { useDispatch } from 'react-redux'
import { loginUser } from 'store/reducers/user.slice'

export const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await login({ username, password }).unwrap()
      console.log('Login response:', response)

      // Dispatch to Redux
      dispatch(
        loginUser({
          user: { id: response.user_id, username: response.username },
          token: response.token,
        })
      )

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (<div className="flex h-screen w-full justify-center items-center bg-gray-100">
    <div className="bg-white shadow-xl rounded-lg p-8 w-[350px]"><h2
      className="text-2xl font-semibold mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4"> {/* Username Input */}
        <div className="flex flex-col"><label className="text-sm font-medium text-gray-700">Username</label> <input
          type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300" /></div>
        {/* Password Input */}
        <div className="flex flex-col"><label className="text-sm font-medium text-gray-700">Password</label> <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300" /></div>
        {/* Error Message */} {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>)} {/* Submit Button */}
        <button type="submit" disabled={isLoading}
                className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"> {isLoading ? 'Logging in...' : 'Login'} </button>
      </form>
    </div>
  </div>)
}
export default Login