import { useState } from 'react';
import { 
  Container, Heading, VStack, FormControl, FormLabel, Input, 
  Textarea, Button, Select, useToast, useColorModeValue, SimpleGrid,
  FormHelperText, Progress, Text, Box, Icon
} from '@chakra-ui/react';
import ResizeTextarea from 'react-textarea-autosize'; 
import { FaBookOpen } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { getEmbedding } from '../lib/googleAI'; 
import { analyzeEmotion } from '../lib/emotionAnalysis'; 
import { useAuth } from '../context/AuthContext';
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

export const SubmitBook = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const glass = useLiquidGlass();
  
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Submitting...');

  // Ambient Orbs
  const orb1 = useColorModeValue("teal.200", "teal.900");
  const orb2 = useColorModeValue("blue.200", "blue.900");
  
  // Semi-transparent inputs to match the glass theme
  const inputBg = useColorModeValue('whiteAlpha.600', 'blackAlpha.300');
  const inputHoverBg = useColorModeValue('whiteAlpha.800', 'blackAlpha.400');
  const inputFocusBg = useColorModeValue('white', 'gray.800');

  const [formData, setFormData] = useState({
    title: '', author: '', description: '', category: 'Fiction',
    image_url: '', isbn13: '', published_year: '', num_pages: ''
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.title || !formData.author || !formData.description) {
      toast({ title: 'Please fill in required fields', status: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const combinedText = `Title: ${formData.title}. Author: ${formData.author}. Category: ${formData.category}. Description: ${formData.description}`;
      
      setLoadingText("Loading AI Emotion Model...");
      let emotions = { joy: 0, sadness: 0, fear: 0, surprise: 0 };
      try { emotions = await analyzeEmotion(formData.description); } 
      catch (e) { console.warn("Emotion analysis failed:", e); }

      setLoadingText("Generating Search Vector...");
      let embedding = null;
      try { embedding = await getEmbedding(combinedText); } 
      catch (e) { console.warn("Embedding failed"); }

      setLoadingText("Saving to Database...");
      const payload = {
        title: formData.title, author: formData.author, description: formData.description,
        broad_category: formData.category, image_url: formData.image_url || null,
        isbn13: formData.isbn13 ? parseInt(formData.isbn13) : null,
        published_year: formData.published_year ? parseInt(formData.published_year) : null,
        num_pages: formData.num_pages ? parseInt(formData.num_pages) : null,
        owner_id: user.id, status: 'pending_approval', 
        embedding: embedding, emotion_joy: emotions.joy, emotion_sadness: emotions.sadness,
        emotion_fear: emotions.fear, emotion_surprise: emotions.surprise || 0
      };

      const { error } = await supabase.from('books').insert(payload as any);
      if (error) throw error;

      toast({ title: 'Book Submitted!', description: 'AI Analysis complete. Waiting for admin approval.', status: 'success', duration: 5000 });
      navigate('/dashboard'); 

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Submission Failed', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box position="relative" w="100%" minH="100vh">
      {/* Background Glowing Orbs */}
      <Box position="absolute" top="10%" left="10%" w={{ base: "300px", md: "500px" }} h={{ base: "300px", md: "500px" }} bg={orb1} filter="blur(120px)" opacity={0.5} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="absolute" bottom="10%" right="10%" w={{ base: "250px", md: "400px" }} h={{ base: "250px", md: "400px" }} bg={orb2} filter="blur(100px)" opacity={0.4} borderRadius="full" zIndex={0} pointerEvents="none" />

      <Container maxW="container.md" py={12} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch" p={{ base: 6, md: 10 }} bg={glass.bg} backdropFilter={glass.filter} borderRadius="3xl" shadow={glass.shadow} border={glass.border}>
          
          <Box textAlign="center" mb={2}>
            <Icon as={FaBookOpen} size="32px" color="blue.400" mb={4} />
            <Heading size="xl" letterSpacing="tight" bgGradient="linear(to-r, blue.400, teal.400)" bgClip="text">List a Book</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')} mt={2}>Share your library with the community</Text>
          </Box>
          
          <SimpleGrid columns={[1, 2]} spacing={6}>
            <FormControl isRequired>
              <FormLabel fontWeight="medium">Book Title</FormLabel>
              <Input name="title" value={formData.title} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" placeholder="e.g. The Hobbit" border="none" />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="medium">Author</FormLabel>
              <Input name="author" value={formData.author} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" placeholder="e.g. J.R.R. Tolkien" border="none" />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={[1, 2]} spacing={6}>
            <FormControl isRequired>
              <FormLabel fontWeight="medium">Category</FormLabel>
              <Select name="category" value={formData.category} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" border="none">
                <option value="Fiction">Fiction</option>
                <option value="Nonfiction">Nonfiction</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Mystery">Mystery</option>
                <option value="Romance">Romance</option>
                <option value="Biography">Biography</option>
                <option value="History">History</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium">Published Year</FormLabel>
              <Input name="published_year" type="number" value={formData.published_year} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" placeholder="e.g. 1937" border="none" />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={[1, 2]} spacing={6}>
            <FormControl>
              <FormLabel fontWeight="medium">ISBN-13</FormLabel>
              <Input name="isbn13" type="number" value={formData.isbn13} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" placeholder="e.g. 9780007525492" border="none" />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium">Page Count</FormLabel>
              <Input name="num_pages" type="number" value={formData.num_pages} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" placeholder="e.g. 310" border="none" />
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired>
            <FormLabel fontWeight="medium">Description</FormLabel>
            <Textarea 
              as={ResizeTextarea} minRows={3} resize="none" overflow="hidden"
              name="description" value={formData.description} onChange={handleChange} 
              variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} 
              borderRadius="xl" border="none" placeholder="Detailed description helps the AI analyze emotions accurately..." 
            />
            <FormHelperText mt={2} color={useColorModeValue('gray.600', 'gray.400')}>
              Our AI will read this to determine the book's emotional vibe.
            </FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="medium">Cover Image URL</FormLabel>
            <Input name="image_url" value={formData.image_url} onChange={handleChange} variant="filled" bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'blue.400' }} borderRadius="xl" placeholder="https://..." border="none" />
          </FormControl>

          {loading && (
            <Box p={4} bg={useColorModeValue('whiteAlpha.600', 'blackAlpha.300')} borderRadius="xl" backdropFilter="blur(10px)">
              <Text mb={2} fontSize="sm" fontWeight="bold" color={useColorModeValue('blue.600', 'blue.300')}>{loadingText}</Text>
              <Progress size="xs" isIndeterminate colorScheme="blue" borderRadius="full" bg="transparent" />
            </Box>
          )}

          <Button 
            colorScheme="blue" size="lg" borderRadius="full"
            onClick={handleSubmit} isLoading={loading} isDisabled={loading} mt={4}
            bgGradient="linear(to-r, blue.400, teal.400)" border="none" color="white"
            boxShadow="0 4px 15px rgba(49, 151, 149, 0.4)"
            _hover={{ transform: 'translateY(-2px)', bgGradient: "linear(to-r, blue.500, teal.500)" }}
          >
            Submit Book
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};