
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@patternfly/react-core/dist/styles/base.css'
import './pf-theme.css'
const root = createRoot(document.getElementById('root')!)
root.render(<App />)
