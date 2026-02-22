import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Input, SimpleGrid, Image, Text, 
  VStack, Badge, Button, Flex, useToast,
  useColorModeValue, Icon, Skeleton, AspectRatio
} from '@chakra-ui/react';
import { FaMagic } from 'react-icons/fa';
import { useRecommendation } from '../hooks/useRecommendation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import coverPlaceholder from '../assets/cover-not-found.jpg'; 

// --- LIQUID GLASS STYLES (Reusable) ---
export const useLiquidGlass = () => {
  const bg = useColorModeValue(
    "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%)", 
    "linear-gradient(135deg, rgba(40, 40, 40, 0.4) 0%, rgba(10, 10, 10, 0.1) 100%)"
  );
  const shadow = useColorModeValue(
    `0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.05)`, 
    `0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.3)`
  );
  const hoverShadow = useColorModeValue(
    `0 16px 48px 0 rgba(31, 38, 135, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.05)`, 
    `0 16px 48px 0 rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px rgba(0, 0, 0, 0.3)`
  );
  const border = useColorModeValue("1px solid rgba(255, 255, 255, 0.4)", "1px solid rgba(255, 255, 255, 0.05)");
  const filter = "blur(20px) saturate(180%)";

  return { bg, shadow, hoverShadow, border, filter };
};

// --- Helper: Skeleton Card ---
const BookCardSkeleton = () => {
  const glass = useLiquidGlass();

  return (
    <Box 
      bg={glass.bg} backdropFilter={glass.filter} 
      boxShadow={glass.shadow} border={glass.border}
      borderRadius="3xl" p={3}
    >
      <Skeleton height="240px" width="100%" borderRadius="2xl" />
      <Box p={3} mt={2}>
        <Skeleton height="20px" width="70%" mb={3} />
        <Skeleton height="16px" width="50%" />
      </Box>
    </Box>
  );
};

// --- Component: BookCard ---
interface BookCardProps { book: any; label?: string; }

const BookCard = ({ book, label }: BookCardProps) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const glass = useLiquidGlass();
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  
  useEffect(() => setIsImageLoaded(false), [book.image_url]);
  const imageSource = book.image_url ? book.image_url : coverPlaceholder;

  return (
    <Box 
      bg={glass.bg} backdropFilter={glass.filter} 
      boxShadow={glass.shadow} border={glass.border}
      borderRadius="3xl" p={3} 
      cursor="pointer" position="relative"
      _hover={{ boxShadow: glass.hoverShadow, transform: 'translateY(-6px)' }} 
      transition="all 0.4s cubic-bezier(.08,.52,.52,1)" 
      onClick={() => navigate(`/book/${book.id}`)}
    >
      <Skeleton isLoaded={isImageLoaded} startColor="gray.100" endColor="gray.300" borderRadius="2xl">
        <Box borderRadius="2xl" overflow="hidden" position="relative">
          <AspectRatio ratio={2/3} w="100%">
            <Image 
              src={imageSource} alt={book.title} objectFit="cover" w="100%" h="100%"
              onLoad={() => setIsImageLoaded(true)} onError={() => setIsImageLoaded(true)} 
              fallbackSrc={coverPlaceholder} transition="transform 0.5s ease"
              _hover={{ transform: 'scale(1.08)' }} 
            />
          </AspectRatio>
        </Box>
      </Skeleton>
      
      <Box px={2} pt={4} pb={2}>
        {label && (
          <Badge 
            bgGradient="linear(to-r, purple.400, pink.400)" color="white" border="none"
            mb={3} borderRadius="full" px={3} py={1} fontSize="2xs" fontWeight="bold"
            boxShadow="0 2px 10px rgba(213, 63, 140, 0.4)"
          >
            {label}
          </Badge>
        )}
        <Heading size="sm" noOfLines={1} mb={1} color={headingColor} letterSpacing="tight">{book.title}</Heading>
        <Text fontSize="sm" color={textColor} noOfLines={1} mb={3} fontWeight="medium">{book.author || 'Unknown Author'}</Text>
        
        {book.similarity > 0 && (
          <Badge colorScheme={book.similarity > 0.8 ? 'green' : 'blue'} variant="subtle" fontSize="xs" borderRadius="md" bg={useColorModeValue('whiteAlpha.600', 'blackAlpha.300')} backdropFilter="blur(4px)">
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
  const { searchBooks, getHistoryRecommendations, getWishlistRecommendations, getTrendingBooks } = useRecommendation();
  const glass = useLiquidGlass();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState('');
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [historyRecs, setHistoryRecs] = useState<any[]>([]);
  const [wishlistRecs, setWishlistRecs] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);

  // Vibrant Orbs for the Hero background
  const orb1 = useColorModeValue("purple.300", "purple.900");
  const orb2 = useColorModeValue("blue.300", "blue.900");
  const orb3 = useColorModeValue("pink.300", "pink.900");

  const heroTextColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => { loadInitialData(); }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const trendingData = await getTrendingBooks();
      setTrending(trendingData || []);
      if (user) {
        const [history, wishlist] = await Promise.all([getHistoryRecommendations(), getWishlistRecommendations()]);
        setHistoryRecs(history || []);
        setWishlistRecs(wishlist || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchBooks(query);
      setSearchResults(results || []);
      if (!results || results.length === 0) toast({ title: 'No matches found', status: 'info' });
    } catch (error) { toast({ title: 'Search failed', status: 'error' }); } 
    finally { setSearchLoading(false); }
  };

  return (
    <Container maxW="container.xl" py={4} mb={20}>
      
      {/* --- HERO SECTION WITH GLOWING ORBS & LIQUID GLASS --- */}
      <Box position="relative" w="100%" borderRadius="3xl" mb={16} mt={4}>
        
        {/* Glowing Ambient Orbs (Behind the glass) */}
        <Box position="absolute" top="-10%" left="0%" w={{ base: "300px", md: "500px" }} h={{ base: "300px", md: "500px" }} bg={orb1} filter="blur(100px)" opacity={0.6} borderRadius="full" zIndex={0} />
        <Box position="absolute" bottom="-10%" right="10%" w={{ base: "250px", md: "400px" }} h={{ base: "250px", md: "400px" }} bg={orb2} filter="blur(90px)" opacity={0.5} borderRadius="full" zIndex={0} />
        <Box position="absolute" top="20%" right="-5%" w={{ base: "200px", md: "350px" }} h={{ base: "200px", md: "350px" }} bg={orb3} filter="blur(100px)" opacity={0.5} borderRadius="full" zIndex={0} />

        {/* The Glass Panel */}
        <VStack 
          position="relative" zIndex={1}
          bg={glass.bg} backdropFilter={glass.filter} 
          boxShadow={glass.shadow} border={glass.border}
          borderRadius="3xl" px={{ base: 6, md: 12 }} py={{ base: 16, md: 28 }}
          textAlign="center" spacing={8}
        >
          <Badge 
  colorScheme="blue" variant="subtle" px={4} py={1.5} borderRadius="full" 
  backdropFilter="blur(10px)" bg={useColorModeValue('whiteAlpha.600', 'blackAlpha.300')}
  display="flex" alignItems="center" gap={2}
>
  <Icon as={FaMagic} /> AI-Powered Library
</Badge>

          <Heading size="3xl" letterSpacing="tight" lineHeight="1.1" maxW="800px">
            Find your next story <br/>
            <Text as="span" bgGradient="linear(to-r, blue.500, purple.500, pink.500)" bgClip="text">
              as unique as you are.
            </Text>
          </Heading>
          
          <Text fontSize="xl" color={heroTextColor} maxW="600px" fontWeight="medium">
            Search by plot, emotion, character vibes, or simply describe what you're in the mood for.
          </Text>
          
          <Flex 
            w="100%" maxW="650px" gap={3} mt={4} direction={{ base: "column", md: "row" }}
            bg={useColorModeValue('rgba(255,255,255,0.6)', 'rgba(0,0,0,0.3)')} 
            backdropFilter="blur(12px)" border={glass.border} p={2} 
            borderRadius={{ base: "2xl", md: "full" }} // <-- Fixed: adapts to mobile
            boxShadow="inset 0 2px 4px rgba(0,0,0,0.05)"
          >
            <Input 
              bg="transparent" border="none" fontSize="lg" pl={{ base: 4, md: 6 }}
              placeholder="e.g. A dystopian novel with a strong female lead..." 
              _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              _focus={{ ring: 0, outline: 'none' }}
              h="54px"
            />
            <Button 
              colorScheme="blue" size="lg" px={10} h="54px"
              w={{ base: "100%", md: "auto" }} // <-- Fixed: Full width on mobile
              borderRadius={{ base: "xl", md: "full" }} // <-- Fixed: Adapts to mobile
              onClick={handleSearch} isLoading={searchLoading}
              bgGradient="linear(to-r, blue.400, purple.500)" border="none"
              _hover={{ transform: 'scale(1.02)', bgGradient: "linear(to-r, blue.500, purple.600)" }}
              boxShadow="0 4px 15px rgba(0, 118, 255, 0.4)"
            >
              Discover
            </Button>
          </Flex>
        </VStack>
      </Box>

      {/* --- SKELETON LOADING --- */}
      {loading && (
        <Box mb={12}>
          <Heading size="lg" mb={8}><Skeleton width="200px" height="30px" borderRadius="md" startColor="gray.100" endColor="gray.300" /></Heading>
          <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={6}>
             {[...Array(5)].map((_, i) => <BookCardSkeleton key={i} />)}
          </SimpleGrid>
        </Box>
      )}

      {/* --- CONTENT SECTIONS --- */}
      {!loading && (
        <VStack spacing={20} align="stretch" position="relative" zIndex={2}>
          
          {searchResults.length > 0 && (
            <Box>
              <Heading size="xl" mb={8} letterSpacing="tight">Search Results</Heading>
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={8}>
                {searchResults.map((book) => <BookCard key={book.id} book={book} label="Result" />)}
              </SimpleGrid>
            </Box>
          )}

          {historyRecs.length > 0 && (
            <Box>
              <Box mb={8}>
                <Heading size="xl" letterSpacing="tight" mb={2}>Because you read similar books</Heading>
                <Text color="gray.500" fontSize="md" fontWeight="medium">Curated from your rental history</Text>
              </Box>
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={8}>
                {historyRecs.map((book) => <BookCard key={book.id} book={book} label="For You" />)}
              </SimpleGrid>
            </Box>
          )}

          {wishlistRecs.length > 0 && (
            <Box>
              <Box mb={8}>
                <Heading size="xl" letterSpacing="tight" mb={2}>Inspired by your Wishlist</Heading>
                <Text color="gray.500" fontSize="md" fontWeight="medium">Matches for books you've saved</Text>
              </Box>
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={8}>
                {wishlistRecs.map((book) => <BookCard key={book.id} book={book} label="Wishlist Match" />)}
              </SimpleGrid>
            </Box>
          )}

          <Box>
            <Heading size="xl" mb={8} letterSpacing="tight">Trending Now</Heading>
            {trending.length === 0 ? (
              <Text color="gray.500">No books found.</Text>
            ) : (
              <SimpleGrid columns={[1, 2, 3, 4, 5]} spacing={8}>
                {trending.map((book) => <BookCard key={book.id} book={book} />)}
              </SimpleGrid>
            )}
          </Box>
          
        </VStack>
      )}

    </Container>
  );
};