import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const app = <App />
const router = import.meta.env.BASE_URL === '/'
  ? <BrowserRouter>{app}</BrowserRouter>
  : <HashRouter>{app}</HashRouter>

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {router}
  </React.StrictMode>,
)
