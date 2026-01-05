import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Grid, Image, Heading, Text, Button, Badge, 
  VStack, HStack, Progress, Divider, Textarea, useToast, Avatar,
  useColorModeValue, Spinner, AspectRatio, IconButton, Tooltip
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart } from 'react-icons/fa'; 
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Import local asset
import coverPlaceholder from '../assets/cover-not-found.jpg'; 

export const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [book, setBook] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rental State
  const [renting, setRenting] = useState(false);
  const [rentalStatus, setRentalStatus] = useState<string | null>(null);
  
  // Wishlist State
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Review State
  const [newComment, setNewComment] = useState('');

  // Styles
  const bgBox = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

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
    const { data: bookData, error } = await supabase
      .from('books')
      .select('*, owner:profiles(full_name)')
      .eq('id', id)
      .single();

    if (error) {
      toast({ title: 'Error loading book', status: 'error' });
      setLoading(false);
      return;
    }
    setBook(bookData);

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*, profile:profiles(full_name)')
      .eq('book_id', id)
      .order('created_at', { ascending: false });
    
    if (reviewData) setReviews(reviewData);
    setLoading(false);
  };

  const checkRentalStatus = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('status')
      .eq('book_id', id)
      .eq('user_id', user?.id)
      .in('status', ['pending', 'approved', 'active'])
      .maybeSingle(); 
    
    if (data) setRentalStatus(data.status);
  };

  const checkWishlistStatus = async () => {
    const { data } = await supabase
      .from('wishlists')
      .select('id')
      .eq('book_id', id)
      .eq('user_id', user?.id)
      .maybeSingle();

    setIsInWishlist(!!data);
  };

  const handleToggleWishlist = async () => {
    if (!user) return navigate('/login');
    setWishlistLoading(true);

    if (isInWishlist) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('book_id', id)
        .eq('user_id', user.id);

      if (!error) {
        setIsInWishlist(false);
        toast({ title: 'Removed from Wishlist', status: 'info', duration: 2000 });
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({ book_id: Number(id), user_id: user.id });

      if (!error) {
        setIsInWishlist(true);
        toast({ title: 'Added to Wishlist', status: 'success', duration: 2000 });
      }
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

    const { error } = await supabase
      .from('transactions')
      .insert({ book_id: Number(id), user_id: user.id, status: 'pending' });

    if (error) {
      toast({ title: 'Request failed', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Request sent!', description: 'Waiting for approval.', status: 'success' });
      setRentalStatus('pending');
    }
    setRenting(false);
  };

  // --- NEW: Cancel Request Logic ---
  const handleCancelRequest = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel your request?")) return;
    
    setRenting(true);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('book_id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending'); // Ensure we only delete pending ones

    if (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Request Cancelled', status: 'info' });
      setRentalStatus(null); // Reset status so "Request Rental" button reappears
    }
    setRenting(false);
  };

  const handlePostReview = async () => {
    if (!newComment.trim() || !user) return;
    const { error } = await supabase
      .from('reviews')
      .insert({ 
        book_id: Number(id), 
        user_id: user.id, 
        comment: newComment, 
        rating: 5 
      });
    
    if (!error) {
      setNewComment('');
      fetchBookData();
      toast({ title: 'Review posted!', status: 'success' });
    }
  };

  if (loading) return <Container py={10}><Spinner /></Container>;
  if (!book) return <Container py={10}>Book not found</Container>;

  const imageSource = book.image_url ? book.image_url : coverPlaceholder;

  // --- Button Rendering Logic ---
  let mainButton;

  if (rentalStatus === 'pending') {
    // Case 1: Pending -> Show Cancel Button
    mainButton = (
      <Button 
        flex={1}
        size="lg" 
        colorScheme="red" 
        variant="outline"
        onClick={handleCancelRequest} 
        isLoading={renting}
      >
        Cancel Request
      </Button>
    );
  } else if (rentalStatus === 'active' || rentalStatus === 'approved') {
    // Case 2: Active -> Show Status (Non-clickable)
    mainButton = (
      <Button flex={1} size="lg" colorScheme="green" isDisabled>
        Currently Rented
      </Button>
    );
  } else {
    // Case 3: Available/Unavailable -> Show Request or Disabled
    mainButton = (
      <Button 
        flex={1}
        size="lg" 
        colorScheme="blue" 
        onClick={handleRentRequest} 
        isLoading={renting} 
        isDisabled={book.status !== 'available'}
      >
        {book.status === 'available' ? 'Request Rental' : 'Unavailable'}
      </Button>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={10}>
        {/* Left Column */}
        <VStack spacing={4} align="stretch">
          
          <Box borderRadius="lg" overflow="hidden" shadow="xl">
            <AspectRatio ratio={2/3}>
              <Image 
                src={imageSource} 
                alt={book.title}
                objectFit="cover"
                fallbackSrc={coverPlaceholder}
              />
            </AspectRatio>
          </Box>
          
          <HStack spacing={2}>
            {mainButton}

            <Tooltip label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
              <IconButton 
                aria-label="Toggle Wishlist"
                icon={isInWishlist ? <FaHeart /> : <FaRegHeart />}
                colorScheme="pink"
                variant={isInWishlist ? 'solid' : 'outline'}
                size="lg"
                onClick={handleToggleWishlist}
                isLoading={wishlistLoading}
              />
            </Tooltip>
          </HStack>

          {/* AI Emotion Bars */}
          <Box p={4} borderRadius="md" bg={bgBox}>
            <Heading size="xs" mb={3} textTransform="uppercase" letterSpacing="wide">AI Emotional Analysis</Heading>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontSize="xs" mb={1}>Joy / Happy</Text>
                <Progress value={(book.emotion_joy || 0) * 100} colorScheme="yellow" size="sm" borderRadius="full" />
              </Box>
              <Box>
                <Text fontSize="xs" mb={1}>Sadness / Drama</Text>
                <Progress value={(book.emotion_sadness || 0) * 100} colorScheme="blue" size="sm" borderRadius="full" />
              </Box>
              <Box>
                <Text fontSize="xs" mb={1}>Suspense / Fear</Text>
                <Progress value={(book.emotion_fear || 0) * 100} colorScheme="purple" size="sm" borderRadius="full" />
              </Box>
            </VStack>
          </Box>
        </VStack>

        {/* Right Column */}
        <Box>
          <Badge colorScheme="purple" mb={2} fontSize="0.9em">{book.broad_category}</Badge>
          <Heading size="2xl" mb={2}>{book.title}</Heading>
          <Text fontSize="xl" color={textColor} mb={6}>{book.author}</Text>
          <Text fontSize="md" lineHeight="tall" mb={8}>{book.description}</Text>
          
          <Divider my={8} />
          
          <Heading size="md" mb={6}>Community Reviews ({reviews.length})</Heading>
          
          {user && (
            <HStack mb={8} align="start">
              <Avatar size="sm" name={user.email} />
              <VStack w="100%" align="stretch">
                <Textarea 
                  placeholder="What did you think of this book?" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button size="sm" alignSelf="flex-end" onClick={handlePostReview}>Post Review</Button>
              </VStack>
            </HStack>
          )}

          <VStack align="stretch" spacing={4}>
            {reviews.map((review) => (
              <Box key={review.id} p={4} borderRadius="md" borderWidth="1px" bg={bgBox}>
                <HStack mb={2}>
                  <Avatar size="xs" name={review.profile?.full_name} />
                  <Text fontWeight="bold" fontSize="sm">{review.profile?.full_name || 'Anonymous'}</Text>
                </HStack>
                <Text fontSize="sm">{review.comment}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Grid>
    </Container>
  );
};