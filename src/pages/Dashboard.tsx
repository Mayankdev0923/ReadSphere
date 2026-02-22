import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Grid, VStack, HStack, Text, Badge, Button, 
  Image, useToast, SimpleGrid, useColorModeValue, AspectRatio, 
  Spinner, Icon, Progress, Flex
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { FaBookOpen, FaClock, FaHeart, FaUpload, FaHistory, FaExchangeAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import coverPlaceholder from '../assets/cover-not-found.png'; 

// --- LIQUID GLASS STYLES ---
const useLiquidGlass = () => {
  const bg = useColorModeValue(
    "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%)", 
    "linear-gradient(135deg, rgba(40, 40, 40, 0.4) 0%, rgba(10, 10, 10, 0.1) 100%)"
  );
  const solidBg = useColorModeValue("rgba(255, 255, 255, 0.7)", "rgba(30, 30, 30, 0.6)");
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

  return { bg, solidBg, shadow, hoverShadow, border, filter };
};

export const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const glass = useLiquidGlass();
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);

  // Ambient Orbs
  const orb1 = useColorModeValue("blue.300", "blue.900");
  const orb2 = useColorModeValue("purple.300", "purple.900");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: rentalData } = await supabase.from('transactions').select('*, book:books(*)').eq('user_id', user.id).order('created_at', { ascending: false });
      if (rentalData) setRentals(rentalData);

      const { data: wishData } = await supabase.from('wishlists').select('*, book:books(*)').eq('user_id', user.id);
      if (wishData) setWishlist(wishData || []);

      const { data: listingsData } = await supabase.from('books').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (listingsData) setMyListings(listingsData);
    } catch (error: any) {
      toast({ title: 'Error loading data', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Requests a return for admin verification
  const handleReturnRequest = async (transactionId: number) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'pending_return' })
      .eq('id', transactionId);

    if (!error) {
      toast({ 
        title: 'Return Requested', 
        description: 'Admin will verify the book once received.', 
        status: 'info' 
      });
      fetchData();
    } else {
      toast({ title: 'Request Failed', description: error.message, status: 'error' });
    }
  };

  const handleCancelRequest = async (transactionId: number) => {
    if (!window.confirm("Cancel this request?")) return;
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (!error) { toast({ title: 'Request Cancelled', status: 'info' }); fetchData(); }
  };

  const handleDeleteListing = async (bookId: number) => {
    if (!window.confirm("Remove this book permanently?")) return;
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (!error) { toast({ title: 'Listing Removed', status: 'success' }); fetchData(); }
  };

  const activeRentals = rentals.filter(r => ['approved', 'active', 'pending_return'].includes(r.status));
  const pendingRentals = rentals.filter(r => r.status === 'pending');
  const historyRentals = rentals.filter(r => r.status === 'returned');

  const calculateProgress = (dueDate: string, approvalDate: string) => {
    if (!dueDate || !approvalDate) return { percent: 0, daysLeft: 0 };
    const total = new Date(dueDate).getTime() - new Date(approvalDate).getTime();
    const elapsed = new Date().getTime() - new Date(approvalDate).getTime();
    const daysLeft = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    let percent = (elapsed / total) * 100;
    return { percent: Math.min(Math.max(percent, 0), 100), daysLeft };
  };

  if (loading) return <Container p={20} centerContent><Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" /></Container>;

  return (
    <Box position="relative" w="100%" minH="100vh">
      {/* Background Glowing Orbs */}
      <Box position="absolute" top="5%" left="-10%" w="500px" h="500px" bg={orb1} filter="blur(120px)" opacity={0.4} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="absolute" top="40%" right="-5%" w="400px" h="400px" bg={orb2} filter="blur(100px)" opacity={0.3} borderRadius="full" zIndex={0} pointerEvents="none" />

      <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
        {/* --- HEADER --- */}
        <VStack align="start" mb={10} spacing={1}>
          <Heading size="2xl" letterSpacing="tight" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Command Center
          </Heading>
          <Text color={textColor} fontSize="lg">Welcome back, {user?.email}</Text>
        </VStack>

        {/* --- 1. METRICS GRID --- */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={12}>
          {[
            { label: 'Reading Now', count: activeRentals.length, icon: FaBookOpen, color: 'green' },
            { label: 'Pending Requests', count: pendingRentals.length, icon: FaClock, color: 'yellow' },
            { label: 'My Listings', count: myListings.length, icon: FaUpload, color: 'blue' },
            { label: 'History', count: historyRentals.length, icon: FaHistory, color: 'gray' },
            { label: 'Wishlist', count: wishlist.length, icon: FaHeart, color: 'pink' }
          ].map((stat, i) => (
            <VStack 
              key={i} bg={glass.solidBg} backdropFilter={glass.filter} 
              border={glass.border} boxShadow={glass.shadow} borderRadius="2xl" 
              p={5} align="start" transition="all 0.3s" _hover={{ transform: 'translateY(-4px)' }}
            >
              <HStack w="100%" justify="space-between">
                <Box p={2} borderRadius="lg" bg={`${stat.color}.100`} color={`${stat.color}.600`}><Icon as={stat.icon} /></Box>
                <Heading size="lg">{stat.count}</Heading>
              </HStack>
              <Text fontWeight="medium" color={textColor} fontSize="sm" mt={2}>{stat.label}</Text>
            </VStack>
          ))}
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={10}>
          {/* --- LEFT COLUMN --- */}
          <VStack align="stretch" spacing={10}>
            {/* CURRENTLY READING */}
            <Box>
              <Heading size="lg" mb={6} letterSpacing="tight" display="flex" alignItems="center" gap={3}>
                <Icon as={FaBookOpen} color="blue.500" /> Currently Reading
              </Heading>
              
              {activeRentals.length === 0 ? (
                <Flex bg={glass.bg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" p={10} justify="center" align="center" direction="column" shadow={glass.shadow}>
                  <Text color={textColor} mb={4} fontWeight="medium">Your reading list is empty.</Text>
                  <Button borderRadius="full" colorScheme="blue" as={Link} to="/">Browse Books</Button>
                </Flex>
              ) : (
                <SimpleGrid columns={[1, 1, 2]} spacing={6}>
                  {activeRentals.map((r) => {
                    const { percent, daysLeft } = calculateProgress(r.due_date, r.approval_date);
                    const isPendingReturn = r.status === 'pending_return';

                    return (
                      <VStack key={r.id} p={5} borderRadius="3xl" bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} shadow={glass.shadow} align="stretch" spacing={4} transition="all 0.3s" _hover={{ shadow: glass.hoverShadow, transform: 'translateY(-4px)' }}>
                        <HStack align="start" spacing={5}>
                          <Box as={Link} to={`/book/${r.book?.id}`} flexShrink={0} borderRadius="xl" overflow="hidden" w="80px" shadow="md">
                            <AspectRatio ratio={2/3}><Image src={r.book?.image_url || coverPlaceholder} objectFit="cover" /></AspectRatio>
                          </Box>
                          <VStack align="start" spacing={1} w="100%">
                            <Text fontWeight="bold" fontSize="lg" noOfLines={1} as={Link} to={`/book/${r.book?.id}`} _hover={{ color: 'blue.500' }}>{r.book?.title}</Text>
                            <Badge colorScheme={isPendingReturn ? "orange" : "green"} borderRadius="full" variant="subtle">
                              {isPendingReturn ? "Return Verification Pending" : "Active"}
                            </Badge>
                            
                            <Box w="100%" mt={3}>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="xs" color={textColor} fontWeight="bold">Time Remaining</Text>
                                <Text fontSize="xs" color={daysLeft <= 3 ? 'red.500' : textColor} fontWeight="bold">{daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}</Text>
                              </HStack>
                              <Progress value={percent} size="xs" colorScheme={daysLeft <= 3 ? 'red' : 'blue'} borderRadius="full" />
                            </Box>
                          </VStack>
                        </HStack>
                        <Button 
                          w="100%" size="sm" borderRadius="full" 
                          colorScheme={isPendingReturn ? "orange" : "blue"} 
                          variant={isPendingReturn ? "subtle" : "outline"}
                          onClick={() => !isPendingReturn && handleReturnRequest(r.id)}
                          isDisabled={isPendingReturn}
                          leftIcon={isPendingReturn ? <Icon as={FaClock} /> : <Icon as={FaExchangeAlt} />}
                        >
                          {isPendingReturn ? "Verification Pending" : "Return Book"}
                        </Button>
                      </VStack>
                    );
                  })}
                </SimpleGrid>
              )}
            </Box>

            {/* PREVIOUSLY READ */}
            {historyRentals.length > 0 && (
              <Box>
                <Heading size="lg" mb={6} letterSpacing="tight" display="flex" alignItems="center" gap={3}>
                  <Icon as={FaHistory} color="gray.500" /> Reading History
                </Heading>
                <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                  {historyRentals.map((r) => (
                    <Box key={r.id} as={Link} to={`/book/${r.book?.id}`} p={3} bg={glass.bg} border={glass.border} borderRadius="2xl" _hover={{ shadow: glass.hoverShadow, transform: 'translateY(-4px)' }} transition="all 0.3s">
                      <Box borderRadius="xl" overflow="hidden" shadow="sm" mb={3}><AspectRatio ratio={2/3}><Image src={r.book?.image_url || coverPlaceholder} objectFit="cover" filter="grayscale(20%)" /></AspectRatio></Box>
                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{r.book?.title}</Text>
                      <Text fontSize="xs" color="gray.500">Returned {new Date(r.returned_at).toLocaleDateString()}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>

          {/* --- RIGHT COLUMN --- */}
          <VStack align="stretch" spacing={10}>
            {/* PENDING REQUESTS */}
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}><Icon as={FaClock} color="yellow.500"/> Pending Requests</Heading>
              {pendingRentals.length === 0 ? (
                <Text color={textColor} fontSize="sm" p={4} bg={glass.bg} border={glass.border} borderRadius="2xl">No pending requests.</Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {pendingRentals.map((r) => (
                    <HStack key={r.id} p={3} bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="2xl" justify="space-between" shadow="sm">
                      <HStack spacing={4}>
                        <Box as={Link} to={`/book/${r.book?.id}`} w="45px" borderRadius="md" overflow="hidden"><AspectRatio ratio={2/3}><Image src={r.book?.image_url || coverPlaceholder} /></AspectRatio></Box>
                        <Box><Text fontWeight="bold" fontSize="sm" noOfLines={1} maxW="150px">{r.book?.title}</Text><Badge colorScheme="yellow" borderRadius="full" fontSize="2xs">Awaiting Approval</Badge></Box>
                      </HStack>
                      <Button size="sm" borderRadius="full" colorScheme="red" variant="ghost" onClick={() => handleCancelRequest(r.id)}><DeleteIcon /></Button>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>

            {/* MY LISTINGS */}
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}><Icon as={FaUpload} color="purple.500"/> My Listings</Heading>
              {myListings.length === 0 ? (
                <Text color={textColor} fontSize="sm" p={4} bg={glass.bg} border={glass.border} borderRadius="2xl">You haven't listed any books.</Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {myListings.map((book) => (
                    <HStack key={book.id} p={3} bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="2xl" shadow="sm" justify="space-between">
                      <HStack spacing={4}>
                        <Box w="45px" borderRadius="md" overflow="hidden"><AspectRatio ratio={2/3}><Image src={book.image_url || coverPlaceholder} /></AspectRatio></Box>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1} maxW="150px">{book.title}</Text>
                          <Badge fontSize="2xs" borderRadius="full" colorScheme={book.status === 'available' ? 'green' : 'yellow'}>{book.status.replace('_', ' ')}</Badge>
                        </VStack>
                      </HStack>
                      {book.status === 'rejected' && <Button size="sm" borderRadius="full" colorScheme="red" variant="ghost" onClick={() => handleDeleteListing(book.id)}><DeleteIcon /></Button>}
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>

            {/* WISHLIST */}
            <Box>
              <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}><Icon as={FaHeart} color="pink.500"/> Wishlist</Heading>
              {wishlist.length === 0 ? (
                <Text color={textColor} fontSize="sm" p={4} bg={glass.bg} border={glass.border} borderRadius="2xl">Your wishlist is empty.</Text>
              ) : (
                <SimpleGrid columns={2} spacing={4}>
                  {wishlist.map((w) => (
                    <Box key={w.id} as={Link} to={`/book/${w.book?.id}`} p={2} bg={glass.solidBg} border={glass.border} borderRadius="xl" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
                      <Box borderRadius="lg" overflow="hidden" mb={2}><AspectRatio ratio={2/3}><Image src={w.book?.image_url || coverPlaceholder} /></AspectRatio></Box>
                      <Text fontSize="xs" fontWeight="bold" noOfLines={1} textAlign="center">{w.book?.title}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        </Grid>
      </Container>
    </Box>
  );
};