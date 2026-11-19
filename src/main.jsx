import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Styles — import order matters for cascade
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/responsive.css';

createRoot(document.getElementById('root')).render(<App />);
