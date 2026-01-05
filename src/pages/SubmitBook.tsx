import { useState } from 'react';
import { 
  Container, Heading, VStack, FormControl, FormLabel, Input, 
  Textarea, Button, Select, useToast, useColorModeValue, SimpleGrid,
  FormHelperText, Progress, Text, Box
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { getEmbedding } from '../lib/googleAI'; // Ensure this file exists for Search Vector
import { analyzeEmotion } from '../lib/emotionAnalysis'; // The fixed file above
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SubmitBook = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Submitting...');
  
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: 'Fiction',
    image_url: '',
    isbn13: '',
    published_year: '',
    num_pages: ''
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
      
      // --- 1. RUN SENTIMENT ANALYSIS (Browser-side) ---
      setLoadingText("Loading AI Emotion Model (this happens once)...");
      let emotions = { joy: 0, sadness: 0, fear: 0, surprise: 0 };
      
      try {
        // This now downloads from CDN correctly
        emotions = await analyzeEmotion(formData.description);
        console.log("Emotion Analysis Result:", emotions);
      } catch (e) {
        console.warn("Emotion analysis failed:", e);
        toast({ title: 'Emotion Analysis Skipped', description: 'Using defaults.', status: 'warning' });
      }

      // --- 2. RUN VECTOR EMBEDDING (For Search) ---
      setLoadingText("Generating Search Vector...");
      let embedding = null;
      try {
        embedding = await getEmbedding(combinedText);
      } catch (e) {
        console.warn("Embedding failed");
      }

      // --- 3. UPLOAD TO SUPABASE ---
      setLoadingText("Saving to Database...");
      
      const payload = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        broad_category: formData.category,
        image_url: formData.image_url || null,
        
        isbn13: formData.isbn13 ? parseInt(formData.isbn13) : null,
        published_year: formData.published_year ? parseInt(formData.published_year) : null,
        num_pages: formData.num_pages ? parseInt(formData.num_pages) : null,
        
        owner_id: user.id,
        status: 'pending_approval', 
        
        // Save the AI Data
        embedding: embedding,
        emotion_joy: emotions.joy,
        emotion_sadness: emotions.sadness,
        emotion_fear: emotions.fear,
        emotion_surprise: emotions.surprise || 0
      };

      const { error } = await supabase.from('books').insert(payload as any);

      if (error) throw error;

      toast({
        title: 'Book Submitted!',
        description: 'AI Analysis complete. Waiting for admin approval.',
        status: 'success',
        duration: 5000,
      });
      navigate('/dashboard'); 

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Submission Failed', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack 
        spacing={6} 
        align="stretch" 
        p={8} 
        bg={bg} 
        borderRadius="xl" 
        shadow="lg" 
        borderWidth="1px" 
        borderColor={border}
      >
        <Heading size="lg">List a Book</Heading>
        
        {/* Title & Author */}
        <SimpleGrid columns={[1, 2]} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Book Title</FormLabel>
            <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. The Hobbit" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Author</FormLabel>
            <Input name="author" value={formData.author} onChange={handleChange} placeholder="e.g. J.R.R. Tolkien" />
          </FormControl>
        </SimpleGrid>

        {/* Category & Year */}
        <SimpleGrid columns={[1, 2]} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Category</FormLabel>
            <Select name="category" value={formData.category} onChange={handleChange}>
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
            <FormLabel>Published Year</FormLabel>
            <Input name="published_year" type="number" value={formData.published_year} onChange={handleChange} placeholder="e.g. 1937" />
          </FormControl>
        </SimpleGrid>

        {/* ISBN & Pages */}
        <SimpleGrid columns={[1, 2]} spacing={4}>
          <FormControl>
            <FormLabel>ISBN-13</FormLabel>
            <Input name="isbn13" type="number" value={formData.isbn13} onChange={handleChange} placeholder="e.g. 9780007525492" />
          </FormControl>

          <FormControl>
            <FormLabel>Page Count</FormLabel>
            <Input name="num_pages" type="number" value={formData.num_pages} onChange={handleChange} placeholder="e.g. 310" />
          </FormControl>
        </SimpleGrid>

        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={6} 
            placeholder="Detailed description helps the AI analyze emotions accurately..." 
          />
          <FormHelperText>
            Our AI will read this to determine if the book is Happy, Sad, or Scary.
          </FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Cover Image URL</FormLabel>
          <Input name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." />
        </FormControl>

        {loading && (
          <Box p={4} bg="blue.50" borderRadius="md">
            <Text mb={2} fontSize="sm" fontWeight="bold" color="blue.600">
              {loadingText}
            </Text>
            <Progress size="xs" isIndeterminate colorScheme="blue" />
          </Box>
        )}

        <Button 
          colorScheme="blue" 
          size="lg" 
          onClick={handleSubmit} 
          isLoading={loading}
          isDisabled={loading}
          mt={4}
        >
          Submit Book
        </Button>
      </VStack>
    </Container>
  );
};