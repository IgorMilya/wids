import { combineReducers, configureStore } from '@reduxjs/toolkit'

import { api } from './api'
import { userReducer } from './reducers'

const rootReducer = combineReducers({
  user: userReducer,
  [api.reducerPath]: api.reducer,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
