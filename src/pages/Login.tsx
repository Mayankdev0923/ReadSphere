import { useState } from 'react';
import { 
  Button, Container, FormControl, FormLabel, Heading, Input, 
  VStack, Text, useToast, useColorModeValue, Link as ChakraLink 
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        // Handle Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Optional: Create a profile entry if you don't have a database trigger
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: email.split('@')[0], // Default name from email
            role: 'user'
          });
        }

        toast({
          title: 'Account created!',
          description: 'You can now log in.',
          status: 'success',
        });
        setIsSignUp(false); // Switch back to login view
      } else {
        // Handle Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        toast({ title: 'Welcome back!', status: 'success' });
        navigate('/'); // Redirect to Home
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={20}>
      <VStack 
        spacing={8} 
        p={8} 
        bg={bgColor} 
        boxShadow="lg" 
        borderRadius="lg"
        borderWidth="1px"
      >
        <Heading size="lg">{isSignUp ? 'Create an Account' : 'Welcome Back'}</Heading>
        
        <VStack spacing={4} w="100%">
          <FormControl isRequired>
            <FormLabel>Email Address</FormLabel>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </FormControl>

          <Button 
            w="100%" 
            colorScheme="blue" 
            onClick={handleAuth} 
            isLoading={loading}
            size="lg"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Button>
        </VStack>

        <Text fontSize="sm">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <ChakraLink 
            color="blue.500" 
            fontWeight="bold" 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </ChakraLink>
        </Text>
      </VStack>
    </Container>
  );
};