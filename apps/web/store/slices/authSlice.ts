import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type User = {
  id: string
  email: string
  name: string
  role: string
}

type AuthState = {
  user?: User | null
  token?: string | null
}

const initialState: AuthState = {
  user: null,
  token: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
    },
    logout(state) {
      state.user = null
      state.token = null
    }
  }
})

export const { setUser, setToken, logout } = authSlice.actions
export default authSlice.reducer
