import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './src/store'
import HybridConfigDemo from './index.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HybridConfigDemo />
    </Provider>
  </React.StrictMode>,
)
