import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Input, SimpleGrid, Image, Text, 
  VStack, Badge, Button, Flex, useToast,
  useColorModeValue, Icon, Skeleton,  AspectRatio
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa'; 
import { useRecommendation } from '../hooks/useRecommendation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import local asset for fallback
import coverPlaceholder from '../assets/cover-not-found.jpg'; 

// --- Helper: Skeleton Card (Shown while fetching data) ---
const BookCardSkeleton = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      borderWidth="1px" 
      borderColor={borderColor}
      borderRadius="lg" 
      overflow="hidden" 
      bg={bg}
    >
      <Skeleton height="260px" width="100%" />
      <Box p="4">
        <Skeleton height="20px" width="70%" mb={2} />
        <Skeleton height="16px" width="50%" />
      </Box>
    </Box>
  );
};

// --- Component: BookCard ---
interface BookCardProps {
  book: any;
  label?: string;
}

const BookCard = ({ book, label }: BookCardProps) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // FIX: Reset loading state when the book changes (prevents reused cards from showing wrong state)
  useEffect(() => {
    setIsImageLoaded(false);
  }, [book.image_url]);
  
  // Dark Mode Styles
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverShadow = useColorModeValue('lg', 'dark-lg');
  const textColor = useColorModeValue('gray.500', 'gray.400');

  // Fallback Logic
  const imageSource = book.image_url ? book.image_url : coverPlaceholder;

  return (
    <Box 
      borderWidth="1px" 
      borderColor={borderColor}
      borderRadius="lg" 
      overflow="hidden" 
      bg={bg} 
      _hover={{ shadow: hoverShadow, transform: 'translateY(-4px)' }} 
      transition="all 0.2s"
      cursor="pointer"
      onClick={() => navigate(`/book/${book.id}`)}
      position="relative"
    >
      {/* IMAGE LOADING HANDLING:
         We wrap the Image in a Skeleton. The Skeleton is visible (isLoaded={false})
         until the image fires its onLoad event.
      */}
      <Skeleton isLoaded={isImageLoaded} startColor="gray.100" endColor="gray.300">
        <AspectRatio ratio={2/3}>
          <Image 
            src={imageSource} 
            alt={book.title} 
            objectFit="cover" 
            w="100%"
            h="100%"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(true)} // Stop loading even if error (fallback will show)
            fallbackSrc={coverPlaceholder} 
            transition="opacity 0.3s"
          />
        </AspectRatio>
      </Skeleton>
      
      <Box p="4">
        {label && (
          <Badge colorScheme="purple" mb={2} borderRadius="full" px={2}>
            {label}
          </Badge>
        )}

        <Heading size="sm" noOfLines={1} mb={1} title={book.title}>
          {book.title}
        </Heading>
        
        <Text fontSize="sm" color={textColor} noOfLines={1} mb={3}>
          {book.author || 'Unknown Author'}
        </Text>
        
        {book.similarity > 0 && (
          <Badge 
            colorScheme={book.similarity > 0.8 ? 'green' : 'blue'} 
            variant="subtle"
            fontSize="xs"
          >
            {(book.similarity * 100).toFixed(0)}% Match
          </Badge>
        )}
      </Box>
    </Box>
  );
};

// --- Main Page Component ---
export const Home = () => {
  const { user } = useAuth();
  const { 
    searchBooks, 
    getHistoryRecommendations, 
    getWishlistRecommendations, 
    getTrendingBooks 
  } = useRecommendation();
  
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState('');
  
  // Data Sections
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [historyRecs, setHistoryRecs] = useState<any[]>([]);
  const [wishlistRecs, setWishlistRecs] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);

  // Styles
  const heroBg = useColorModeValue('blue.50', 'blue.900');
  const heroTextColor = useColorModeValue('gray.600', 'blue.100');
  const inputBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const trendingData = await getTrendingBooks();
      setTrending(trendingData || []);

      if (user) {
        const [history, wishlist] = await Promise.all([
          getHistoryRecommendations(),
          getWishlistRecommendations()
        ]);
        setHistoryRecs(history || []);
        setWishlistRecs(wishlist || []);
      }
    } catch (err) {
      console.error("Home Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchBooks(query);
      setSearchResults(results || []);
      if (!results || results.length === 0) {
        toast({ title: 'No matches found', status: 'info' });
      }
    } catch (error) {
      toast({ title: 'Search failed', status: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      
      {/* Hero Section */}
      <VStack 
        spacing={6} 
        mb={12} 
        textAlign="center" 
        py={16} 
        bg={heroBg} 
        borderRadius="2xl"
        px={4}
      >
        <Heading size="2xl" lineHeight="shorter">
          Find your next story
        </Heading>
        <Text fontSize="lg" color={heroTextColor} maxW="600px">
          Powered by AI. Search by <b>plot</b>, <b>emotion</b>, or <b>vibe</b>.
        </Text>
        
        <Flex w="100%" maxW="600px" gap={2}>
          <Input 
            bg={inputBg}
            placeholder="Describe the book you want..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            size="lg"
            border="none"
            _focus={{ ring: 2, ringColor: 'blue.400' }}
          />
          <Button 
            colorScheme="blue" 
            size="lg" 
            onClick={handleSearch}
            isLoading={searchLoading}
            leftIcon={<Icon as={FaSearch} />}
          >
            Search
          </Button>
        </Flex>
      </VStack>

      {/* LOADING STATE:
          Instead of a Spinner, show a grid of Skeleton Cards.
          This prevents layout shift and looks professional.
      */}
      {loading && (
        <Box mb={12}>
          <Heading size="lg" mb={6}><Skeleton width="200px" height="30px" /></Heading>
          <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={6}>
             {[...Array(5)].map((_, i) => (
               <BookCardSkeleton key={i} />
             ))}
          </SimpleGrid>
        </Box>
      )}

      {/* CONTENT SECTIONS */}
      
      {!loading && (
        <>
          {/* 1. Search Results */}
          {searchResults.length > 0 && (
            <Box mb={16}>
              <Heading size="lg" mb={6}>Search Results</Heading>
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={6}>
                {searchResults.map((book) => (
                  <BookCard key={book.id} book={book} label="Result" />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* 2. History (Logged In) */}
          {historyRecs.length > 0 && (
            <Box mb={16}>
              <Heading size="lg" mb={2}>Because you read similar books</Heading>
              <Text mb={6} color="gray.500" fontSize="sm">Based on your rental history</Text>
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={6}>
                {historyRecs.map((book) => (
                  <BookCard key={book.id} book={book} label="For You" />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* 3. Wishlist (Logged In) */}
          {wishlistRecs.length > 0 && (
            <Box mb={16}>
              <Heading size="lg" mb={2}>Inspired by your Wishlist</Heading>
              <Text mb={6} color="gray.500" fontSize="sm">Similar to books you saved</Text>
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={6}>
                {wishlistRecs.map((book) => (
                  <BookCard key={book.id} book={book} label="Wishlist Match" />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* 4. Trending (Always Visible) */}
          <Box mb={12}>
            <Heading size="lg" mb={6}>Trending Now</Heading>
            {trending.length === 0 ? (
              <Text color="gray.500">No books found.</Text>
            ) : (
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={6}>
                {trending.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </SimpleGrid>
            )}
          </Box>
        </>
      )}

    </Container>
  );
};