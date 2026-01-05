import { Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/home';
import { BookDetails } from './pages/BookDetails';
import { SubmitBook } from './pages/SubmitBook';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login'; // Assuming you have a basic Auth page

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Box pt={4}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetails />} />
          <Route path="/submit-book" element={<SubmitBook />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;