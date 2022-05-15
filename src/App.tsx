import 'bootstrap/dist/css/bootstrap.min.css';
import { AES, enc, SHA512 } from 'crypto-js';
import { md, pki } from 'node-forge';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import './App.scss';
import Dialog from './components/Dialog';
import Login from './pages/Login';
import Main from './pages/Main';
import Register from './pages/Register';

(window as any).AES = AES;
(window as any).pki = pki;
(window as any).enc = enc;
(window as any).SHA512 = SHA512;
(window as any).md = md;

function App() {

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
      <ToastContainer position="bottom-center" theme="dark" />
    </RecoilRoot>
  )
}

export default App;
