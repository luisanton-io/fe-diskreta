import './App.scss';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import { Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Main from './components/Main';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';

function App() {


  return (
    <RecoilRoot>
      <RecoilNexus />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Main />} />
      </Routes>
    </RecoilRoot>
  )
}

export default App;
