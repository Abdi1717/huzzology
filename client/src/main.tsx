/**
 * Huzzology Client - React Application Entry Point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/lib/routes';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="huzzology-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
); 