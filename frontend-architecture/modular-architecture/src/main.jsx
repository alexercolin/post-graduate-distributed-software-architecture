import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { MyListProvider } from './modules/myList'
import { router } from './router'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MyListProvider>
      <RouterProvider router={router} />
    </MyListProvider>
  </React.StrictMode>
)
