import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Grid, Image, Heading, Text, Button, Badge, 
  VStack, HStack, Progress, Textarea, useToast, Avatar,
  useColorModeValue, Spinner, AspectRatio, IconButton, Tooltip, Icon
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart, FaMagic } from 'react-icons/fa'; 
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

import coverPlaceholder from '../assets/cover-not-found.png'; 

// --- LIQUID GLASS STYLES (Reusable) ---
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
  const border = useColorModeValue("1px solid rgba(255, 255, 255, 0.4)", "1px solid rgba(255, 255, 255, 0.05)");
  const filter = "blur(20px) saturate(180%)";

  return { bg, solidBg, shadow, border, filter };
};

export const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const glass = useLiquidGlass();

  const [book, setBook] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [renting, setRenting] = useState(false);
  const [rentalStatus, setRentalStatus] = useState<string | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [newComment, setNewComment] = useState('');

  const textColor = useColorModeValue('gray.700', 'gray.300');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.900', 'white');

  const orb1 = useColorModeValue("blue.200", "blue.900");
  const orb2 = useColorModeValue("purple.200", "purple.900");
  const orb3 = useColorModeValue("pink.200", "pink.900");

  useEffect(() => {
    if (id) {
      fetchBookData();
      if (user) {
        checkRentalStatus();
        checkWishlistStatus();
      }
    }
  }, [id, user]);

  const fetchBookData = async () => {
    const { data: bookData, error } = await supabase.from('books').select('*, owner:profiles(full_name)').eq('id', id).single();
    if (error) {
      toast({ title: 'Error loading book', status: 'error' });
      setLoading(false);
      return;
    }
    setBook(bookData);

    const { data: reviewData } = await supabase.from('reviews').select('*, profile:profiles(full_name)').eq('book_id', id).order('created_at', { ascending: false });
    if (reviewData) setReviews(reviewData);
    setLoading(false);
  };

  const checkRentalStatus = async () => {
    const { data } = await supabase.from('transactions').select('status').eq('book_id', id).eq('user_id', user?.id).in('status', ['pending', 'approved', 'active', 'pending_return']).maybeSingle(); 
    if (data) setRentalStatus(data.status);
  };

  const checkWishlistStatus = async () => {
    const { data } = await supabase.from('wishlists').select('id').eq('book_id', id).eq('user_id', user?.id).maybeSingle();
    setIsInWishlist(!!data);
  };

  const handleToggleWishlist = async () => {
    if (!user) return navigate('/login');
    setWishlistLoading(true);

    if (isInWishlist) {
      const { error } = await supabase.from('wishlists').delete().eq('book_id', id).eq('user_id', user.id);
      if (!error) { setIsInWishlist(false); toast({ title: 'Removed from Wishlist', status: 'info', duration: 2000 }); }
    } else {
      const { error } = await supabase.from('wishlists').insert({ book_id: Number(id), user_id: user.id });
      if (!error) { setIsInWishlist(true); toast({ title: 'Added to Wishlist', status: 'success', duration: 2000 }); }
    }
    setWishlistLoading(false);
  };

  const handleRentRequest = async () => {
    if (!user) return navigate('/login');
    setRenting(true);

    if (rentalStatus) {
      toast({ title: `Already ${rentalStatus}!`, status: 'warning' });
      setRenting(false);
      return;
    }

    const { error } = await supabase.from('transactions').insert({ book_id: Number(id), user_id: user.id, status: 'pending' });
    if (error) {
      toast({ title: 'Request failed', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Request sent!', description: 'Waiting for approval.', status: 'success' });
      setRentalStatus('pending');
    }
    setRenting(false);
  };

  const handleCancelRequest = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel your request?")) return;
    
    setRenting(true);
    const { error } = await supabase.from('transactions').delete().eq('book_id', id).eq('user_id', user.id).eq('status', 'pending');
    if (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Request Cancelled', status: 'info' });
      setRentalStatus(null); 
    }
    setRenting(false);
  };

  const handlePostReview = async () => {
    if (!newComment.trim() || !user) return;
    const { error } = await supabase.from('reviews').insert({ book_id: Number(id), user_id: user.id, comment: newComment, rating: 5 });
    if (!error) {
      setNewComment('');
      fetchBookData();
      toast({ title: 'Review posted!', status: 'success' });
    }
  };

  if (loading) return <Container py={20} centerContent><Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" /></Container>;
  if (!book) return <Container py={20}>Book not found</Container>;

  const imageSource = book.image_url ? book.image_url : coverPlaceholder;

  // UPDATED: Dynamic Button Logic handling "rented" by others.
  let mainButton;
  if (rentalStatus === 'pending') {
    mainButton = <Button flex={1} size="lg" borderRadius="full" colorScheme="red" variant="outline" bg={glass.bg} backdropFilter="blur(10px)" onClick={handleCancelRequest} isLoading={renting} shadow="sm">Cancel Request</Button>;
  } else if (rentalStatus === 'active' || rentalStatus === 'approved' || rentalStatus === 'pending_return') {
    mainButton = <Button flex={1} size="lg" borderRadius="full" colorScheme="green" bgGradient="linear(to-r, green.400, teal.500)" border="none" shadow="lg" color="white" isDisabled _disabled={{ opacity: 0.8, cursor: 'not-allowed' }}>Currently Rented by You</Button>;
  } else if (book.status === 'rented') {
    mainButton = (
      <Tooltip label="This book is currently with another reader.">
        <Button flex={1} size="lg" borderRadius="full" colorScheme="gray" variant="solid" bg="gray.200" color="gray.600" cursor="not-allowed" isDisabled>
          Already on Rent
        </Button>
      </Tooltip>
    );
  } else {
    mainButton = <Button flex={1} size="lg" borderRadius="full" colorScheme="blue" bgGradient="linear(to-r, blue.400, purple.500)" border="none" onClick={handleRentRequest} isLoading={renting} isDisabled={book.status !== 'available'} shadow="lg" color="white" _hover={{ transform: 'scale(1.02)' }}>{book.status === 'available' ? 'Request Rental' : 'Unavailable'}</Button>;
  }

  return (
    // FIX: Removed overflow="hidden" here so orbs aren't cut off by the navbar
    <Box position="relative" w="100%" minH="100vh">
      
      {/* Background Glowing Orbs */}
      <Box position="absolute" top="10%" left="-5%" w={{ base: "300px", md: "500px" }} h={{ base: "300px", md: "500px" }} bg={orb1} filter="blur(120px)" opacity={0.5} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="absolute" top="30%" right="-10%" w={{ base: "250px", md: "400px" }} h={{ base: "250px", md: "400px" }} bg={orb2} filter="blur(100px)" opacity={0.4} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="absolute" bottom="10%" left="20%" w={{ base: "200px", md: "350px" }} h={{ base: "200px", md: "350px" }} bg={orb3} filter="blur(100px)" opacity={0.3} borderRadius="full" zIndex={0} pointerEvents="none" />

      <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 2.2fr' }} gap={12}>
          
          <VStack spacing={6} align="stretch">
            <Box bg={glass.bg} backdropFilter={glass.filter} border={glass.border} shadow={glass.shadow} borderRadius="3xl" p={3}>
              <Box borderRadius="2xl" overflow="hidden" shadow="inner">
                <AspectRatio ratio={2/3}>
                  <Image src={imageSource} alt={book.title} objectFit="cover" fallbackSrc={coverPlaceholder} />
                </AspectRatio>
              </Box>
            </Box>
            
            <HStack spacing={3}>
              {mainButton}
              <Tooltip label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                <IconButton 
                  aria-label="Toggle Wishlist"
                  icon={isInWishlist ? <FaHeart /> : <FaRegHeart />}
                  colorScheme={isInWishlist ? "pink" : "gray"}
                  variant={isInWishlist ? 'solid' : 'outline'}
                  bg={isInWishlist ? undefined : glass.bg}
                  backdropFilter={isInWishlist ? undefined : "blur(10px)"}
                  size="lg"
                  borderRadius="full"
                  onClick={handleToggleWishlist}
                  isLoading={wishlistLoading}
                  shadow="sm"
                />
              </Tooltip>
            </HStack>

            <Box p={6} borderRadius="3xl" bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} shadow={glass.shadow}>
              <Heading size="xs" mb={5} textTransform="uppercase" letterSpacing="widest" color={mutedText} display="flex" alignItems="center" gap={2}>
                <Icon as={FaMagic} color="purple.400" /> AI Emotion Analysis
              </Heading>
              <VStack align="stretch" spacing={5}>
                <Box>
                  <HStack justify="space-between" mb={2}><Text fontSize="xs" fontWeight="bold" color={textColor}>Joy / Happy</Text><Text fontSize="xs" color={mutedText}>{((book.emotion_joy || 0) * 100).toFixed(0)}%</Text></HStack>
                  <Progress value={(book.emotion_joy || 0) * 100} colorScheme="yellow" size="sm" borderRadius="full" bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')} />
                </Box>
                <Box>
                  <HStack justify="space-between" mb={2}><Text fontSize="xs" fontWeight="bold" color={textColor}>Sadness / Drama</Text><Text fontSize="xs" color={mutedText}>{((book.emotion_sadness || 0) * 100).toFixed(0)}%</Text></HStack>
                  <Progress value={(book.emotion_sadness || 0) * 100} colorScheme="blue" size="sm" borderRadius="full" bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')} />
                </Box>
                <Box>
                  <HStack justify="space-between" mb={2}><Text fontSize="xs" fontWeight="bold" color={textColor}>Suspense / Fear</Text><Text fontSize="xs" color={mutedText}>{((book.emotion_fear || 0) * 100).toFixed(0)}%</Text></HStack>
                  <Progress value={(book.emotion_fear || 0) * 100} colorScheme="purple" size="sm" borderRadius="full" bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')} />
                </Box>
              </VStack>
            </Box>
          </VStack>

          <Box pt={{ base: 2, md: 4 }}>
            <Badge bgGradient="linear(to-r, purple.400, pink.400)" color="white" mb={4} borderRadius="full" px={4} py={1} fontSize="sm" shadow="sm">
              {book.broad_category}
            </Badge>
            <Heading size="3xl" mb={3} letterSpacing="tight" color={headingColor} lineHeight="1.2">{book.title}</Heading>
            <Text fontSize="2xl" color={useColorModeValue('blue.600', 'blue.300')} mb={8} fontWeight="medium">{book.author}</Text>
            
            <Box bg={glass.bg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" p={8} shadow={glass.shadow} mb={12}>
              <Text fontSize="lg" lineHeight="1.8" color={textColor}>
                {book.description}
              </Text>
            </Box>
            
            <Heading size="xl" mb={8} letterSpacing="tight" color={headingColor}>Community Reviews ({reviews.length})</Heading>
            
            {user && (
              <Box p={6} borderRadius="3xl" bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} shadow={glass.shadow} mb={10}>
                <HStack mb={4} align="center">
                  <Avatar size="sm" name={user.email} />
                  <Text fontWeight="medium" color={textColor}>Add your review</Text>
                </HStack>
                <VStack w="100%" align="stretch" spacing={4}>
                  <Textarea 
                    placeholder="What did you think of this book?" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    variant="filled" 
                    bg={useColorModeValue('whiteAlpha.600', 'blackAlpha.300')}
                    _hover={{ bg: useColorModeValue('whiteAlpha.800', 'blackAlpha.400') }}
                    _focus={{ bg: useColorModeValue('white', 'gray.800'), ring: 2, ringColor: 'blue.400' }}
                    borderRadius="2xl" 
                    border="none" 
                    rows={3}
                  />
                  <Button size="md" borderRadius="full" colorScheme="blue" alignSelf="flex-end" onClick={handlePostReview} px={8} shadow="md">Post Review</Button>
                </VStack>
              </Box>
            )}

            <VStack align="stretch" spacing={5}>
              {reviews.map((review) => (
                <Box key={review.id} p={6} borderRadius="2xl" bg={glass.bg} backdropFilter={glass.filter} shadow={glass.shadow} border={glass.border} transition="all 0.2s" _hover={{ transform: 'translateY(-2px)' }}>
                  <HStack mb={3}>
                    <Avatar size="sm" name={review.profile?.full_name} bg="purple.500" color="white" />
                    <Text fontWeight="bold" fontSize="md" color={headingColor}>{review.profile?.full_name || 'Anonymous'}</Text>
                  </HStack>
                  <Text fontSize="md" color={textColor} lineHeight="1.6">{review.comment}</Text>
                </Box>
              ))}
              {reviews.length === 0 && !user && (
                <Text color={mutedText} fontSize="lg" fontStyle="italic">No reviews yet. Log in to be the first!</Text>
              )}
            </VStack>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};