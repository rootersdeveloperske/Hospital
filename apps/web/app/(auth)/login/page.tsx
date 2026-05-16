import React from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold">Login</h2>
        <form className="mt-4 space-y-4">
          <div>
            <label className="block text-sm">Email</label>
            <input type="email" className="w-full mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" className="w-full mt-1 p-2 border rounded" />
          </div>
          <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
        </form>
      </div>
    </div>
  )
}
