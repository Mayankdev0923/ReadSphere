import { Routes, Route } from 'react-router-dom';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/home';
import { BookDetails } from './pages/BookDetails';
import { SubmitBook } from './pages/SubmitBook';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';

function App() {
  // 1. Base App Background
  const appBg = useColorModeValue('gray.50', 'gray.900');

  // 2. Doodle Layer Styling
  // Extremely low opacity so it feels like a subtle texture
  const doodleOpacity = useColorModeValue(0.03, 0.04);
  
  // THE MAGIC TRICK: 
  // invert(0) keeps the black doodles black for light mode.
  // invert(1) turns the black doodles perfectly white for dark mode.
  const doodleFilter = useColorModeValue('invert(0)', 'invert(1)');

  return (
    <Box minH="100vh" bg={appBg} position="relative" overflowX="hidden">
      
      {/* --- FAINT DOODLE BACKGROUND LAYER --- */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        pointerEvents="none" // Ensures you can still click buttons through the background
        bgImage="url('/doodle-pattern.png')" 
        bgRepeat="repeat"
        bgSize={{ base: "500px", md: "800px" }} // Scales the doodles nicely for mobile vs desktop
        opacity={doodleOpacity}
        filter={doodleFilter}
        transition="filter 0.3s ease" // Smooth transition when toggling themes
      />

      {/* --- MAIN APP CONTENT --- */}
      <Box position="relative" zIndex={1}>
        <Navbar />
        
        {/* Padding to prevent content from hiding under the floating navbar */}
        <Box pt={{ base: '100px', md: '120px' }}>
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
      
    </Box>
  );
}

export default App;