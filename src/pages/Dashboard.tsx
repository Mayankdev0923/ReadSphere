import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Grid, VStack, HStack, Text, Badge, Button, 
  Image, Divider, useToast, SimpleGrid, useColorModeValue, AspectRatio, 
  Spinner, Tooltip, Icon
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Ensure this image exists in your assets folder
import coverPlaceholder from '../assets/cover-not-found.jpg'; 

export const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // --- 1. STYLES (Defined at top level) ---
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Specific styles for Pending/Request cards
  const pendingBg = useColorModeValue('yellow.50', 'gray.700');
  const pendingBorder = useColorModeValue('yellow.200', 'gray.600');

  // --- 2. STATE ---
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // A. Fetch Transactions (Rentals)
      const { data: rentalData, error: rentalError } = await supabase
        .from('transactions')
        .select('*, book:books(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (rentalError) throw rentalError;
      if (rentalData) setRentals(rentalData);

      // B. Fetch Wishlist
      const { data: wishData, error: wishError } = await supabase
        .from('wishlists')
        .select('*, book:books(*)')
        .eq('user_id', user.id);

      if (wishError) throw wishError;
      if (wishData) setWishlist(wishData || []);

      // C. Fetch My Listings (Books I submitted)
      const { data: listingsData, error: listError } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) throw listError;
      if (listingsData) setMyListings(listingsData);

    } catch (error: any) {
      console.error("Dashboard Load Error:", error);
      toast({ title: 'Error loading data', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- 4. ACTIONS ---

  const handleReturnBook = async (transactionId: number, bookId: number) => {
    // Mark transaction as returned
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'returned', returned_at: new Date().toISOString() })
      .eq('id', transactionId);

    if (!error) {
      // Make book available again
      await supabase.from('books').update({ status: 'available' }).eq('id', bookId);
      toast({ title: 'Book Returned', status: 'success' });
      fetchData();
    } else {
      toast({ title: 'Return Failed', description: error.message, status: 'error' });
    }
  };

  const handleCancelRequest = async (transactionId: number) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (!error) {
      toast({ title: 'Request Cancelled', status: 'info' });
      fetchData();
    } else {
      toast({ title: 'Cancellation Failed', status: 'error' });
    }
  };

  const handleDeleteListing = async (bookId: number) => {
    if (!window.confirm("Remove this book permanently?")) return;
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);
    
    if (!error) {
      toast({ title: 'Listing Removed', status: 'success' });
      fetchData();
    } else {
      toast({ title: 'Error', description: 'Could not delete book. It might have history.', status: 'error' });
    }
  };

  // --- 5. FILTERS ---
  const activeRentals = rentals.filter(r => ['approved', 'active'].includes(r.status));
  const pendingRentals = rentals.filter(r => r.status === 'pending');
  const historyRentals = rentals.filter(r => r.status === 'returned');

  // --- 6. RENDER ---
  if (loading) return <Container p={10} centerContent><Spinner size="xl" /></Container>;

  return (
    <Container maxW="container.xl" py={10}>
      <Grid templateColumns={{ base: '1fr', md: '280px 1fr' }} gap={8}>
        
        {/* --- LEFT SIDEBAR: STATS --- */}
        <VStack 
          align="stretch" 
          spacing={4} 
          bg={bg} 
          p={6} 
          borderRadius="lg" 
          shadow="sm" 
          h="fit-content" 
          borderWidth="1px" 
          borderColor={borderColor}
        >
          <Heading size="md">My Library</Heading>
          <Text color="gray.500" fontSize="sm" noOfLines={1} title={user?.email}>
            {user?.email}
          </Text>
          <Divider />
          <HStack justify="space-between">
            <Text>Reading Now</Text>
            <Badge colorScheme="green">{activeRentals.length}</Badge>
          </HStack>
          <HStack justify="space-between">
            <Text>Pending Requests</Text>
            <Badge colorScheme="yellow">{pendingRentals.length}</Badge>
          </HStack>
          <HStack justify="space-between">
            <Text>My Listings</Text>
            <Badge colorScheme="blue">{myListings.length}</Badge>
          </HStack>
          <HStack justify="space-between">
            <Text>History</Text>
            <Badge colorScheme="gray">{historyRentals.length}</Badge>
          </HStack>
          <HStack justify="space-between">
            <Text>Wishlist</Text>
            <Badge colorScheme="purple">{wishlist.length}</Badge>
          </HStack>
        </VStack>

        {/* --- MAIN CONTENT AREA --- */}
        <VStack align="stretch" spacing={10}>
          
          {/* A. CURRENTLY READING */}
          <Box>
            <Heading size="md" mb={5}>Currently Reading</Heading>
            {activeRentals.length === 0 ? (
              <Box p={6} borderWidth="1px" borderRadius="md" bg={bg} borderColor={borderColor} borderStyle="dashed">
                <Text color="gray.500">You have no active rentals.</Text>
                <Button size="sm" mt={3} colorScheme="blue" variant="outline" as={Link} to="/">
                  Browse Books
                </Button>
              </Box>
            ) : (
              <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                {activeRentals.map((r) => (
                  <HStack key={r.id} p={4} borderWidth="1px" borderRadius="lg" align="start" bg={cardBg} borderColor={borderColor} shadow="sm">
                    <Box 
                      as={Link} to={`/book/${r.book?.id}`} 
                      flexShrink={0} 
                      borderRadius="md" 
                      overflow="hidden"
                      w="70px"
                    >
                      <AspectRatio ratio={2/3}>
                        <Image src={r.book?.image_url || coverPlaceholder} fallbackSrc={coverPlaceholder} objectFit="cover" />
                      </AspectRatio>
                    </Box>
                    <VStack align="start" spacing={1} w="100%">
                      <Text fontWeight="bold" noOfLines={1} as={Link} to={`/book/${r.book?.id}`} _hover={{ color: 'blue.500' }}>
                        {r.book?.title || "Unknown Book"}
                      </Text>
                      <Badge colorScheme="green">Active</Badge>
                      <Text fontSize="xs" color="gray.500">
                        Due: {r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A'}
                      </Text>
                      <Button size="xs" colorScheme="blue" mt={2} onClick={() => handleReturnBook(r.id, r.book_id)}>
                        Return Book
                      </Button>
                    </VStack>
                  </HStack>
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* B. PENDING REQUESTS */}
          {pendingRentals.length > 0 && (
            <Box>
              <Heading size="md" mb={5}>Pending Requests</Heading>
              <VStack align="stretch" spacing={3}>
                {pendingRentals.map((r) => (
                  <HStack 
                    key={r.id} 
                    p={3} 
                    bg={pendingBg} 
                    borderRadius="lg" 
                    borderWidth="1px" 
                    borderColor={pendingBorder}
                    justify="space-between"
                  >
                    <HStack spacing={4}>
                      <Box as={Link} to={`/book/${r.book?.id}`} w="50px" h="75px" borderRadius="md" overflow="hidden" flexShrink={0}>
                         <Image src={r.book?.image_url || coverPlaceholder} fallbackSrc={coverPlaceholder} w="100%" h="100%" objectFit="cover" />
                      </Box>
                      <Box>
                        <Text fontWeight="bold" noOfLines={1} as={Link} to={`/book/${r.book?.id}`}>{r.book?.title}</Text>
                        <Badge colorScheme="yellow" mt={1}>Waiting for Approval</Badge>
                      </Box>
                    </HStack>
                    <Tooltip label="Cancel Request">
                      <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleCancelRequest(r.id)}>Cancel</Button>
                    </Tooltip>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* C. MY LISTINGS (Books I Submitted) */}
          <Box>
            <Heading size="md" mb={5}>My Listings</Heading>
            {myListings.length === 0 ? (
              <Text color="gray.500" fontSize="sm">You haven't listed any books yet.</Text>
            ) : (
              <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                {myListings.map((book) => (
                  <HStack key={book.id} p={4} borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={borderColor} shadow="sm" align="start" justify="space-between">
                    {/* Left Side: Image + Info */}
                    <HStack align="start" spacing={4}>
                      <Box w="60px" flexShrink={0} borderRadius="md" overflow="hidden">
                         <Image src={book.image_url || coverPlaceholder} fallbackSrc={coverPlaceholder} objectFit="cover" />
                      </Box>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" noOfLines={1}>{book.title}</Text>
                        <HStack>
                          {book.status === 'pending_approval' && <Badge colorScheme="yellow">Pending Review</Badge>}
                          {book.status === 'available' && <Badge colorScheme="green">Listed & Active</Badge>}
                          {book.status === 'rented' && <Badge colorScheme="blue">Rented Out</Badge>}
                          {book.status === 'rejected' && <Badge colorScheme="red">Rejected</Badge>}
                        </HStack>
                        <Text fontSize="xs" color="gray.500">Added: {new Date(book.created_at).toLocaleDateString()}</Text>
                      </VStack>
                    </HStack>

                    {/* Right Side: Actions (Delete if rejected) */}
                    {book.status === 'rejected' && (
                      <Tooltip label="Delete this listing">
                        <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleDeleteListing(book.id)}>
                          <Icon as={DeleteIcon} />
                        </Button>
                      </Tooltip>
                    )}
                  </HStack>
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* D. PREVIOUSLY READ (HISTORY) */}
          <Box>
            <Heading size="md" mb={5}>Previously Read</Heading>
            {historyRentals.length === 0 ? (
              <Text color="gray.500" fontSize="sm">You haven't finished any books yet.</Text>
            ) : (
              <SimpleGrid columns={[2, 3, 4, 5]} spacing={5}>
                {historyRentals.map((r) => (
                  <Box 
                    key={r.id} 
                    as={Link} 
                    to={`/book/${r.book?.id}`}
                    _hover={{ transform: 'translateY(-4px)' }} 
                    transition="all 0.2s"
                    opacity={0.85}
                  >
                    <Box borderRadius="md" overflow="hidden" shadow="sm" mb={2}>
                      <AspectRatio ratio={2/3}>
                        <Image src={r.book?.image_url || coverPlaceholder} fallbackSrc={coverPlaceholder} objectFit="cover" filter="grayscale(20%)" />
                      </AspectRatio>
                    </Box>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{r.book?.title}</Text>
                    <Text fontSize="xs" color="gray.500">Returned: {new Date(r.returned_at).toLocaleDateString()}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>

          <Divider />

          {/* E. WISHLIST */}
          <Box>
            <Heading size="md" mb={5}>My Wishlist</Heading>
            {wishlist.length === 0 ? (
              <Text color="gray.500">Your wishlist is empty.</Text>
            ) : (
              <SimpleGrid columns={[2, 3, 4, 5]} spacing={5}>
                {wishlist.map((w) => (
                  <Box 
                    key={w.id} 
                    as={Link} 
                    to={`/book/${w.book?.id}`}
                    _hover={{ transform: 'translateY(-4px)' }} 
                    transition="all 0.2s"
                  >
                    <Box borderRadius="md" overflow="hidden" shadow="md" mb={2}>
                      <AspectRatio ratio={2/3}>
                        <Image src={w.book?.image_url || coverPlaceholder} fallbackSrc={coverPlaceholder} objectFit="cover" />
                      </AspectRatio>
                    </Box>
                    <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{w.book?.title}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
          
        </VStack>
      </Grid>
    </Container>
  );
};