import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import { Header } from './components/layout';
import Footer from './components/layout/Footer';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
