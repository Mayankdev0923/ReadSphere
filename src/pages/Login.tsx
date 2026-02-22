import { useState } from 'react';
import { 
  Button, Container, FormControl, FormLabel, Heading, Input, 
  VStack, Text, useToast, useColorModeValue, Link as ChakraLink, Box 
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// --- LIQUID GLASS STYLES ---
const useLiquidGlass = () => {
  const bg = useColorModeValue(
    "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%)", 
    "linear-gradient(135deg, rgba(40, 40, 40, 0.4) 0%, rgba(10, 10, 10, 0.1) 100%)"
  );
  const shadow = useColorModeValue(
    `0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.05)`, 
    `0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.3)`
  );
  const border = useColorModeValue("1px solid rgba(255, 255, 255, 0.4)", "1px solid rgba(255, 255, 255, 0.05)");
  const filter = "blur(20px) saturate(180%)";

  return { bg, shadow, border, filter };
};

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();
  const glass = useLiquidGlass();

  // Ambient Orbs
  const orb1 = useColorModeValue("purple.300", "purple.900");
  const orb2 = useColorModeValue("blue.300", "blue.900");

  const inputBg = useColorModeValue('whiteAlpha.600', 'blackAlpha.300');
  const inputHoverBg = useColorModeValue('whiteAlpha.800', 'blackAlpha.400');
  const inputFocusBg = useColorModeValue('white', 'gray.800');

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: email.split('@')[0], 
            role: 'user'
          });
        }

        toast({ title: 'Account created!', description: 'You can now log in.', status: 'success' });
        setIsSignUp(false); 
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({ title: 'Welcome back!', status: 'success' });
        navigate('/'); 
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box position="relative" w="100%" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      {/* Background Glowing Orbs */}
      <Box position="absolute" top="10%" left="10%" w={{ base: "300px", md: "500px" }} h={{ base: "300px", md: "500px" }} bg={orb1} filter="blur(120px)" opacity={0.6} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="absolute" bottom="10%" right="10%" w={{ base: "250px", md: "400px" }} h={{ base: "250px", md: "400px" }} bg={orb2} filter="blur(100px)" opacity={0.5} borderRadius="full" zIndex={0} pointerEvents="none" />

      <Container maxW="container.sm" py={20} position="relative" zIndex={1}>
        <VStack 
          spacing={8} p={{ base: 8, md: 12 }} 
          bg={glass.bg} backdropFilter={glass.filter} borderRadius="3xl" shadow={glass.shadow} border={glass.border}
        >
          <Heading size="xl" letterSpacing="tight" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </Heading>
          
          <VStack spacing={5} w="100%">
            <FormControl isRequired>
              <FormLabel fontWeight="medium">Email Address</FormLabel>
              <Input 
                type="email" variant="filled" borderRadius="xl" size="lg" border="none"
                bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }}
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              />
            </FormControl>

            <FormControl isRequired>
            <FormLabel fontWeight="medium">Password</FormLabel>
            <Input 
              type="password" variant="filled" borderRadius="xl" size="lg" border="none"
              bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }}
              value={password} onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()} // <-- FIX: Press Enter to submit
            />
          </FormControl>

            <Button 
              w="100%" colorScheme="blue" borderRadius="full" size="lg" mt={4} color="white"
              bgGradient="linear(to-r, blue.400, purple.500)" border="none"
              boxShadow="0 4px 15px rgba(0, 118, 255, 0.4)"
              _hover={{ transform: 'translateY(-2px)', bgGradient: "linear(to-r, blue.500, purple.600)" }}
              onClick={handleAuth} isLoading={loading}
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </Button>
          </VStack>

          <Text fontSize="md" color={useColorModeValue('gray.600', 'gray.300')}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <ChakraLink color="blue.400" fontWeight="bold" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Log In' : 'Sign Up'}
            </ChakraLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};