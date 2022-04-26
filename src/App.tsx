import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import Dialog from './components/Dialog';
import Login from './pages/Login';
import Main from './pages/Main';
import Register from './pages/Register';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.scss';
import { AES, enc } from 'crypto-js';
import { pki } from 'node-forge';
import { Button } from 'react-bootstrap';
import { Sun, Moon } from 'react-bootstrap-icons';
import { useEffect, useState } from 'react';

(window as any).AES = AES;
(window as any).pki = pki;
(window as any).enc = enc;

function App() {

  const [darkTheme, setDarkTheme] = useState(!!document.querySelector('html')!.getAttribute('data-theme-dark'))

  const toggleTheme = () => {
    setDarkTheme(!darkTheme)
  }

  useEffect(() => {

    darkTheme
      ? document.querySelector('html')!.setAttribute('data-theme-dark', "true")
      : document.querySelector('html')!.removeAttribute('data-theme-dark')
  }, [darkTheme])

  return (
    <RecoilRoot>
      <RecoilNexus />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Main />} />
        <Route path="/:activeChat" element={<Main />} />
      </Routes>
      <Dialog />
      <ToastContainer position="bottom-center" theme="colored" />
      <Button variant="dark" className="rounded-0" onClick={toggleTheme} style={{ position: 'absolute', inset: '1em 1em auto auto ' }}>
        {darkTheme ?
          <Sun /> : <Moon />
        }
        <span className="ms-2">Toggle Theme</span>
      </Button>
    </RecoilRoot>
  )
}

export default App;
