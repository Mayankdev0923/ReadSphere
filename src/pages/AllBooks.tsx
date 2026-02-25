import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, SimpleGrid, Spinner, Text, VStack, 
  Input, InputGroup, InputLeftElement, Select, useColorModeValue, 
  Flex, Icon, Button, Wrap, WrapItem
} from '@chakra-ui/react';
import { FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { BookCard, useLiquidGlass } from './home'; 

const CATEGORIES = ['All', 'Fiction', 'Nonfiction', 'Sci-Fi', 'Mystery', 'Romance', 'Biography', 'History'];

export const AllBooks = () => {
  const glass = useLiquidGlass();
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availability, setAvailability] = useState('all'); // 'all', 'available', 'rented'

  // Ambient Orbs
  const orb1 = useColorModeValue("teal.200", "teal.900");
  const orb2 = useColorModeValue("purple.200", "purple.900");

  // UI Colors
  const inputBg = useColorModeValue('whiteAlpha.600', 'blackAlpha.300');
  const inputHoverBg = useColorModeValue('whiteAlpha.800', 'blackAlpha.400');
  const inputFocusBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    fetchAllBooks();
  }, []);

  // Run filters and sorting locally whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [books, searchQuery, sortOption, selectedCategory, availability]);

  const fetchAllBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*, owner:profiles(full_name)')
        .in('status', ['available', 'rented'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setBooks(data || []);
      setFilteredBooks(data || []);
    } catch (err) {
      console.error('Error fetching all books:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...books];

    // 1. Text Search (Title & Author)
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title?.toLowerCase().includes(lowerQ) || 
        b.author?.toLowerCase().includes(lowerQ)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(b => b.broad_category === selectedCategory);
    }

    // 3. Availability Filter
    if (availability !== 'all') {
      result = result.filter(b => b.status === availability);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOption === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOption === 'a-z') return a.title.localeCompare(b.title);
      if (sortOption === 'z-a') return b.title.localeCompare(a.title);
      return 0;
    });

    setFilteredBooks(result);
  };

  if (loading) return <Container py={20} centerContent><Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" /></Container>;

  return (
    <Box position="relative" w="100%" minH="100vh" overflow="hidden">
      {/* Background Glowing Orbs */}
      <Box position="fixed" top="10%" left="-5%" w={{ base: "300px", md: "500px" }} h={{ base: "300px", md: "500px" }} bg={orb1} filter="blur(120px)" opacity={0.4} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="fixed" bottom="-10%" right="-5%" w={{ base: "250px", md: "400px" }} h={{ base: "250px", md: "400px" }} bg={orb2} filter="blur(100px)" opacity={0.3} borderRadius="full" zIndex={0} pointerEvents="none" />

      <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
        <VStack align="stretch" spacing={8}>
          
          {/* Header */}
          <Box>
            <Heading size={{ base: "xl", md: "2xl" }} letterSpacing="tight" bgGradient="linear(to-r, blue.400, teal.400)" bgClip="text" mb={2}>
              The Complete Library
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg" fontWeight="medium">
              Browse every title available on the platform.
            </Text>
          </Box>

          {/* Controls Panel (Glassmorphism) */}
          <Box 
            bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} 
            boxShadow={glass.shadow} borderRadius="3xl" p={{ base: 4, md: 6 }}
          >
            <Flex direction={{ base: "column", md: "row" }} gap={4} mb={6}>
              
              {/* Search Bar */}
              <InputGroup flex={2} size="lg">
                <InputLeftElement pointerEvents="none"><Icon as={FaSearch} color="gray.400" /></InputLeftElement>
                <Input 
                  placeholder="Search by title or author..." 
                  variant="filled" borderRadius="full" border="none"
                  bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'teal.400' }}
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              {/* Status Filter */}
              <Select 
                flex={1} size="lg" variant="filled" borderRadius="full" border="none"
                bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'teal.400' }}
                value={availability} onChange={(e) => setAvailability(e.target.value)}
                icon={<Icon as={FaFilter} />}
              >
                <option value="all">All Books</option>
                <option value="available">Available Now</option>
                <option value="rented">Currently Rented</option>
              </Select>

              {/* Sort Dropdown */}
              <Select 
                flex={1} size="lg" variant="filled" borderRadius="full" border="none"
                bg={inputBg} _hover={{ bg: inputHoverBg }} _focus={{ bg: inputFocusBg, ring: 2, ringColor: 'teal.400' }}
                value={sortOption} onChange={(e) => setSortOption(e.target.value)}
                icon={<Icon as={FaSortAmountDown} />}
              >
                <option value="newest">Newest Additions</option>
                <option value="oldest">Oldest Additions</option>
                <option value="a-z">Title (A-Z)</option>
                <option value="z-a">Title (Z-A)</option>
              </Select>
            </Flex>

            {/* Category Pills */}
            <Wrap spacing={3}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <WrapItem key={cat}>
                    <Button
                      size="sm" borderRadius="full" px={5}
                      bg={isSelected ? useColorModeValue('teal.500', 'teal.400') : inputBg}
                      color={isSelected ? 'white' : textColor}
                      border={glass.border}
                      _hover={{ bg: isSelected ? useColorModeValue('teal.600', 'teal.500') : inputHoverBg }}
                      onClick={() => setSelectedCategory(cat)}
                      boxShadow={isSelected ? '0 4px 12px rgba(49, 151, 149, 0.3)' : 'none'}
                    >
                      {cat}
                    </Button>
                  </WrapItem>
                );
              })}
            </Wrap>
          </Box>

          {/* Results Metadata */}
          <Text color={useColorModeValue('gray.500', 'gray.400')} fontWeight="medium">
            Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
          </Text>

          {/* Book Grid */}
          {filteredBooks.length === 0 ? (
            <Flex 
              w="100%" h="300px" bg={glass.bg} border={glass.border} borderRadius="3xl" 
              align="center" justify="center" direction="column" shadow={glass.shadow}
            >
              <Icon as={FaSearch} size="40px" color="gray.400" mb={4} />
              <Text color="gray.500" fontSize="xl" fontWeight="medium">No books match your criteria.</Text>
              <Button mt={4} colorScheme="teal" variant="outline" borderRadius="full" onClick={() => {
                setSearchQuery(''); setSelectedCategory('All'); setAvailability('all');
              }}>
                Clear Filters
              </Button>
            </Flex>
          ) : (
            // FIXED: base: 2 means 2 columns on mobile
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={{ base: 3, md: 8 }}>
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};