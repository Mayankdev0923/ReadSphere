import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Box, useColorModeValue, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Button, Input, Text, 
  useToast, Textarea, VStack, FormControl, FormLabel 
} from '@chakra-ui/react';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/home';
import { BookDetails } from './pages/BookDetails';
import { SubmitBook } from './pages/SubmitBook';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { AllBooks } from './pages/AllBooks';
import { Login } from './pages/Login';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

// --- NEW COMPONENT: Smart Profile Completion Check ---
const ProfileCompletionModal = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Field states
  const [mobile, setMobile] = useState('');
  const [interests, setInterests] = useState('');
  
  // What is the user missing?
  const [missingMobile, setMissingMobile] = useState(false);
  const [missingInterests, setMissingInterests] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('mobile_number, interests').eq('id', user.id).single();
        if (data) {
          const noMobile = !data.mobile_number;
          const noInterests = !data.interests;
          
          setMissingMobile(noMobile);
          setMissingInterests(noInterests);

          // If either is missing, show the modal
          if (noMobile || noInterests) {
            setIsOpen(true);
          }
        }
      }
    };
    checkProfile();
  }, [user]);

  const handleSave = async () => {
    const updates: any = {};

    // Validate only the fields that are being asked for
    if (missingMobile) {
      if (!mobile || mobile.length < 10) {
        return toast({ title: 'Please enter a valid mobile number.', status: 'warning' });
      }
      updates.mobile_number = mobile;
    }

    if (missingInterests) {
      if (!interests.trim()) {
        return toast({ title: 'Please enter at least one interest.', status: 'warning' });
      }
      updates.interests = interests;
    }

    setLoading(true);
    const { error } = await supabase.from('profiles').update(updates).eq('id', user?.id);
    
    if (!error) {
      setIsOpen(false);
      toast({ title: 'Profile Complete!', description: 'Thanks for updating your details.', status: 'success' });
    } else {
      toast({ title: 'Update Failed', description: error.message, status: 'error' });
    }
    setLoading(false);
  };

  // Generate dynamic subtitle based on what's missing
  let subtitle = '';
  if (missingMobile && missingInterests) {
    subtitle = "To keep our community safe for book handoffs and provide personalized AI recommendations, we need a couple more details.";
  } else if (missingMobile) {
    subtitle = "To keep our community safe and coordinate book handoffs easily, please provide a mobile number.";
  } else if (missingInterests) {
    subtitle = "Tell us what you love to read! We'll use this to power your personalized AI recommendations on the Home page.";
  }

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false} isCentered size="md">
      <ModalOverlay backdropFilter="blur(15px)" bg="blackAlpha.700" />
      <ModalContent bg={useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(30, 30, 30, 0.85)')} backdropFilter="blur(20px)" borderRadius="2xl" border="1px solid rgba(255,255,255,0.2)" shadow="2xl">
        <ModalHeader bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text" fontSize="2xl" pb={1}>
          Complete Your Profile
        </ModalHeader>
        <ModalBody pb={6}>
          <Text mb={6} color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm" lineHeight="1.6">
            {subtitle}
          </Text>

          <VStack spacing={5} align="stretch">
            {missingMobile && (
              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Mobile Number</FormLabel>
                <Input 
                  placeholder="e.g. +91 9876543210" size="lg" variant="filled" borderRadius="xl" border="none"
                  bg={useColorModeValue('whiteAlpha.600', 'blackAlpha.300')}
                  _focus={{ bg: useColorModeValue('white', 'gray.800'), ring: 2, ringColor: 'blue.400' }}
                  value={mobile} onChange={(e) => setMobile(e.target.value)}
                />
              </FormControl>
            )}

            {missingInterests && (
              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Your Favorite Genres / Interests</FormLabel>
                <Textarea 
                  placeholder="e.g. Cyberpunk, history, lighthearted romances, tech startups..." 
                  size="lg" variant="filled" borderRadius="xl" border="none" rows={3}
                  bg={useColorModeValue('whiteAlpha.600', 'blackAlpha.300')}
                  _focus={{ bg: useColorModeValue('white', 'gray.800'), ring: 2, ringColor: 'purple.400' }}
                  value={interests} onChange={(e) => setInterests(e.target.value)}
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter pt={0}>
          <Button 
            colorScheme="blue" w="100%" borderRadius="full" size="lg" 
            bgGradient="linear(to-r, blue.400, purple.500)" border="none"
            _hover={{ transform: 'scale(1.02)' }}
            onClick={handleSave} isLoading={loading}
          >
            Save and Continue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

function App() {
  const appBg = useColorModeValue('gray.50', 'gray.900');
  const doodleOpacity = useColorModeValue(0.03, 0.04);
  const doodleFilter = useColorModeValue('invert(0)', 'invert(1)');

  return (
    <Box minH="100vh" bg={appBg} position="relative" overflowX="hidden">
      
      {/* Smart Profile Prompt injected here - runs globally */}
      <ProfileCompletionModal />

      <Box
        position="fixed" top={0} left={0} right={0} bottom={0} zIndex={0} pointerEvents="none" 
        bgImage="url('/doodle-pattern.png')" bgRepeat="repeat" bgSize={{ base: "500px", md: "800px" }} 
        opacity={doodleOpacity} filter={doodleFilter} transition="filter 0.3s ease" 
      />

      <Box position="relative" zIndex={1}>
        <Navbar />
        <Box pt={{ base: '100px', md: '120px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:id" element={<BookDetails />} />
            <Route path="/submit-book" element={<SubmitBook />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/all-books" element={<AllBooks />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;