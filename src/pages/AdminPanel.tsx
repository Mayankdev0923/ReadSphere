import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, 
  Table, Thead, Tbody, Tr, Th, Td, Button, Image, Badge, useToast, Text,
  useColorModeValue, Tooltip, Icon, TableContainer, HStack, VStack,
  Spinner
} from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { FaShieldAlt, FaExchangeAlt, FaCalendarPlus } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- LIQUID GLASS STYLES ---
const useLiquidGlass = () => {
  const bg = useColorModeValue(
    "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%)", 
    "linear-gradient(135deg, rgba(40, 40, 40, 0.4) 0%, rgba(10, 10, 10, 0.1) 100%)"
  );
  const solidBg = useColorModeValue("rgba(255, 255, 255, 0.75)", "rgba(30, 30, 30, 0.65)");
  const shadow = useColorModeValue(
    `0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.05)`, 
    `0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.3)`
  );
  const border = useColorModeValue("1px solid rgba(255, 255, 255, 0.5)", "1px solid rgba(255, 255, 255, 0.08)");
  const filter = "blur(24px) saturate(180%)";

  return { bg, solidBg, shadow, border, filter };
};

export const AdminPanel = () => {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const glass = useLiquidGlass();
  
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const tableBorderColor = useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)');
  const theadBg = useColorModeValue('rgba(255,255,255,0.5)', 'rgba(0,0,0,0.2)');

  const orb1 = useColorModeValue("purple.200", "purple.900");
  const orb2 = useColorModeValue("teal.200", "teal.900");

  const [pendingBooks, setPendingBooks] = useState<any[]>([]);
  const [existingBooks, setExistingBooks] = useState<any[]>([]); 
  const [pendingRentals, setPendingRentals] = useState<any[]>([]);
  const [pendingReturns, setPendingReturns] = useState<any[]>([]); 
  const [activeRentals, setActiveRentals] = useState<any[]>([]); 
  const [returnHistory, setReturnHistory] = useState<any[]>([]); 
  const [allBooks, setAllBooks] = useState<any[]>([]); 

  useEffect(() => {
    if (!authLoading) {
      if (role !== 'admin') {
        navigate('/');
        toast({ title: 'Access Denied', status: 'error' });
      } else {
        fetchAllData();
      }
    }
  }, [role, authLoading]);

  const fetchAllData = async () => {
    // 1. Pending Books (Submissions)
    const { data: pBooks } = await supabase.from('books').select('*, owner:profiles(full_name, mobile_number)').eq('status', 'pending_approval');
    if (pBooks) setPendingBooks(pBooks);

    const { data: eBooks } = await supabase.from('books').select('title, isbn13').neq('status', 'pending_approval');
    if (eBooks) setExistingBooks(eBooks);

    // 2. Pending Rentals (Requests)
    const { data: rentals } = await supabase.from('transactions').select('*, book:books(title), user:profiles(full_name, email, mobile_number)').eq('status', 'pending');
    if (rentals) setPendingRentals(rentals);

    // 3. Pending Returns & Extension Requests
    const { data: returnsAndExt } = await supabase
      .from('transactions')
      .select('*, book:books(id, title), user:profiles(full_name, email, mobile_number)')
      .or('status.eq.pending_return,extension_requested.eq.true');
    if (returnsAndExt) setPendingReturns(returnsAndExt);

    // 4. Active Rentals
    const { data: active } = await supabase.from('transactions').select('*, book:books(title), user:profiles(full_name, email, mobile_number)').in('status', ['approved', 'active', 'pending_return']).order('due_date', { ascending: true });
    if (active) setActiveRentals(active);

    // 5. History
    const { data: history } = await supabase.from('transactions').select('*, book:books(title), user:profiles(full_name, email, mobile_number)').eq('status', 'returned').order('returned_at', { ascending: false });
    if (history) setReturnHistory(history);

    // 6. All Books
    const { data: library } = await supabase.from('books').select('*, owner:profiles(full_name, mobile_number)').neq('status', 'pending_approval').order('created_at', { ascending: false });
    if (library) setAllBooks(library);
  };

  const getDuplicateStatus = (book: any) => {
    if (book.isbn13) {
      const isbnMatch = existingBooks.find(b => b.isbn13 === book.isbn13);
      if (isbnMatch) return { isDup: true, reason: 'ISBN Match' };
    }
    const titleMatch = existingBooks.find(b => b.title.toLowerCase() === book.title.toLowerCase());
    if (titleMatch) return { isDup: true, reason: 'Title Match' };
    return { isDup: false, reason: '' };
  };

  const handleVerifyReturn = async (transactionId: number, bookId: number) => {
    try {
      const { error: tError } = await supabase
        .from('transactions')
        .update({ status: 'returned', returned_at: new Date().toISOString(), extension_requested: false })
        .eq('id', transactionId);

      const { error: bError } = await supabase
        .from('books')
        .update({ status: 'available' })
        .eq('id', bookId);

      if (tError || bError) throw new Error("Verification failed");

      toast({ title: 'Return Verified', status: 'success' });
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    }
  };

  // NEW: Handle Extension Requests
  const handleExtension = async (id: number, action: 'approve' | 'reject', currentDueDate: string) => {
    try {
      const updates: any = { extension_requested: false };
      
      if (action === 'approve') {
        const newDate = new Date(currentDueDate);
        newDate.setDate(newDate.getDate() + 14); // Extend by 14 days
        updates.due_date = newDate.toISOString();
      }

      const { error } = await supabase.from('transactions').update(updates).eq('id', id);
      if (error) throw error;
      
      toast({ title: `Extension ${action === 'approve' ? 'Approved' : 'Rejected'}`, status: action === 'approve' ? 'success' : 'info' });
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    }
  };

  const handleRentalAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const updates: any = { status, approval_date: new Date().toISOString() };
      
      if (action === 'approve') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); 
        updates.due_date = dueDate.toISOString();
      }

      const { error } = await supabase.from('transactions').update(updates).eq('id', id);
      if (error) throw error;
      
      if (action === 'approve') {
        const rental = pendingRentals.find(r => r.id === id);
        if (rental?.book_id) {
          await supabase.from('books').update({ status: 'rented' }).eq('id', rental.book_id);
        }
      }
      toast({ title: `Rental ${status}`, status: action === 'approve' ? 'success' : 'warning' });
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, status: 'error' });
    }
  };

  const handleBookAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await supabase.from('books').update({ status: 'available' }).eq('id', id);
        toast({ title: 'Book Published', status: 'success' });
      } else {
        await supabase.from('books').delete().eq('id', id);
        toast({ title: 'Book Rejected', status: 'info' });
      }
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, status: 'error' });
    }
  };

  const handleForceReturn = async (id: number, bookId: number) => {
    if (!window.confirm("Force return this book?")) return;
    await supabase.from('transactions').update({ status: 'returned', returned_at: new Date().toISOString(), extension_requested: false }).eq('id', id);
    await supabase.from('books').update({ status: 'available' }).eq('id', bookId);
    toast({ title: 'Book Returned', status: 'success' });
    fetchAllData();
  };

  if (authLoading) return <Container maxW="container.xl" py={12} centerContent><Spinner size="xl" /></Container>;

  return (
    <Box position="relative" w="100%" minH="100vh">
      <Box position="fixed" top="-10%" left="-5%" w={{ base: "300px", md: "500px" }} h={{ base: "300px", md: "500px" }} bg={orb1} filter="blur(120px)" opacity={0.5} borderRadius="full" zIndex={0} pointerEvents="none" />
      <Box position="fixed" bottom="-10%" right="-5%" w={{ base: "250px", md: "400px" }} h={{ base: "250px", md: "400px" }} bg={orb2} filter="blur(100px)" opacity={0.4} borderRadius="full" zIndex={0} pointerEvents="none" />

      <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
        <VStack align="start" mb={10} spacing={2}>
          <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
            <Icon as={FaShieldAlt} mr={2} /> Admin Console
          </Badge>
          <Heading size="2xl" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Management Portal
          </Heading>
        </VStack>
        
        <Tabs variant="unstyled" isLazy>
          <Box 
            bg={glass.bg} backdropFilter={glass.filter} border={glass.border} 
            borderRadius="full" p={2} mb={8} shadow={glass.shadow} 
            display="inline-block" maxW="100%" overflowX="auto"
            sx={{ scrollbarWidth: 'none', '::-webkit-scrollbar': { display: 'none' } }}
          >
            <TabList gap={2}>
              {[
                { label: 'Requests', count: pendingRentals.length, color: 'blue' },
                { label: 'Returns & Ext.', count: pendingReturns.length, color: 'orange' },
                { label: 'Submissions', count: pendingBooks.length, color: 'purple' },
                { label: 'Active', count: null, color: 'green' },
                { label: 'History', count: null, color: 'gray' },
                { label: 'All Books', count: null, color: 'teal' }
              ].map((tab, i) => (
                <Tab 
                  key={i} fontWeight="semibold" whiteSpace="nowrap" flexShrink={0} borderRadius="full" px={6} py={2}
                  color={textColor} transition="all 0.3s"
                  _selected={{ bg: useColorModeValue('white', 'whiteAlpha.200'), shadow: 'sm', color: useColorModeValue(`${tab.color}.600`, `${tab.color}.200`) }}
                >
                  {tab.label} {tab.count !== null && <Badge ml={2} colorScheme={tab.color} borderRadius="full">{tab.count}</Badge>}
                </Tab>
              ))}
            </TabList>
          </Box>
          
          <TabPanels>
            {/* 1. RENTAL REQUESTS */}
            <TabPanel px={0} py={0}>
               <Box bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" shadow={glass.shadow} overflow="hidden">
                 <TableContainer>
                   <Table variant="simple" minW="800px" sx={{ 'th, td': { borderColor: tableBorderColor } }}>
                    <Thead bg={theadBg}><Tr><Th py={4}>User</Th><Th py={4}>Mobile</Th><Th py={4}>Book</Th><Th py={4}>Actions</Th></Tr></Thead>
                    <Tbody>
                      {pendingRentals.map((r) => (
                        <Tr key={r.id}>
                          <Td fontWeight="medium">{r.user?.full_name}</Td>
                          <Td color={mutedText}>{r.user?.mobile_number || 'N/A'}</Td>
                          <Td color={mutedText}>{r.book?.title}</Td>
                          <Td><HStack><Button size="sm" borderRadius="full" colorScheme="green" onClick={() => handleRentalAction(r.id, 'approve')}>Approve</Button><Button size="sm" variant="ghost" colorScheme="red" onClick={() => handleRentalAction(r.id, 'reject')}>Reject</Button></HStack></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {pendingRentals.length === 0 && <Text p={10} textAlign="center">No pending requests.</Text>}
               </Box>
            </TabPanel>

            {/* 2. RETURN & EXTENSION VERIFICATIONS */}
            <TabPanel px={0} py={0}>
               <Box bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" shadow={glass.shadow} overflow="hidden">
                 <TableContainer>
                   <Table variant="simple" minW="800px" sx={{ 'th, td': { borderColor: tableBorderColor } }}>
                    <Thead bg={theadBg}><Tr><Th py={4}>User</Th><Th py={4}>Mobile</Th><Th py={4}>Book</Th><Th py={4}>Type</Th><Th py={4}>Actions</Th></Tr></Thead>
                    <Tbody>
                      {pendingReturns.map((r) => (
                        <Tr key={r.id}>
                          <Td fontWeight="medium">{r.user?.full_name}</Td>
                          <Td color={mutedText}>{r.user?.mobile_number || 'N/A'}</Td>
                          <Td color={mutedText}>{r.book?.title}</Td>
                          <Td>
                            {r.extension_requested ? (
                              <Badge colorScheme="purple">Extension Request</Badge>
                            ) : (
                              <Badge colorScheme="orange">Pending Return</Badge>
                            )}
                          </Td>
                          <Td>
                            {r.extension_requested ? (
                              <HStack>
                                <Button size="sm" borderRadius="full" colorScheme="purple" leftIcon={<Icon as={FaCalendarPlus} />} onClick={() => handleExtension(r.id, 'approve', r.due_date)}>Approve Extension</Button>
                                <Button size="sm" borderRadius="full" colorScheme="red" variant="ghost" onClick={() => handleExtension(r.id, 'reject', r.due_date)}>Reject</Button>
                              </HStack>
                            ) : (
                              <Button size="sm" borderRadius="full" colorScheme="orange" leftIcon={<Icon as={FaExchangeAlt} />} onClick={() => handleVerifyReturn(r.id, r.book.id)}>Confirm Received</Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {pendingReturns.length === 0 && <Text p={10} textAlign="center">No returns or extensions to verify.</Text>}
               </Box>
            </TabPanel>

            {/* 3. SUBMISSIONS */}
            <TabPanel px={0} py={0}>
              <Box bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" shadow={glass.shadow} overflow="hidden">
                <TableContainer>
                  <Table variant="simple" minW="900px" sx={{ 'th, td': { borderColor: tableBorderColor } }}>
                    <Thead bg={theadBg}>
                      <Tr><Th py={5}>Cover</Th><Th py={5}>Details</Th><Th py={5}>Owner Info</Th><Th py={5}>Dup. Check</Th><Th py={5}>Actions</Th></Tr>
                    </Thead>
                    <Tbody>
                      {pendingBooks.map((b) => {
                        const { isDup, reason } = getDuplicateStatus(b);
                        return (
                          <Tr key={b.id} transition="all 0.2s" _hover={{ bg: useColorModeValue('whiteAlpha.600', 'whiteAlpha.100') }}>
                            <Td>
                              <Image src={b.image_url} h="60px" w="40px" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/40x60" shadow="sm" />
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" color={textColor}>{b.title}</Text>
                                <Text fontSize="xs" color={mutedText}>ISBN: {b.isbn13 || 'N/A'}</Text>
                                <Badge fontSize="0.7em" mt={1} borderRadius="full" px={2} colorScheme="purple">{b.broad_category}</Badge>
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" color={textColor}>{b.owner?.full_name || 'Unknown'}</Text>
                                <Text fontSize="xs" color={mutedText}>{b.owner?.mobile_number || 'No Mobile'}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              {isDup ? (
                                <Tooltip label={`Book already exists: ${reason}`}>
                                  <Badge colorScheme="red" display="flex" alignItems="center" w="fit-content" px={2} py={1} borderRadius="md" bg="red.100" color="red.700">
                                    <Icon as={WarningTwoIcon} mr={1} /> Duplicate?
                                  </Badge>
                                </Tooltip>
                              ) : (
                                <Badge colorScheme="green" variant="subtle" borderRadius="md" px={2} py={1} bg="green.100" color="green.700">Unique</Badge>
                              )}
                            </Td>
                            <Td>
                              <HStack>
                                <Button size="sm" borderRadius="full" colorScheme="green" onClick={() => handleBookAction(b.id, 'approve')}>Publish</Button>
                                <Button size="sm" borderRadius="full" colorScheme="red" variant="ghost" onClick={() => handleBookAction(b.id, 'reject')}>Reject</Button>
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
                {pendingBooks.length === 0 && <Text p={10} textAlign="center" color={mutedText} fontWeight="medium">No pending submissions.</Text>}
              </Box>
            </TabPanel>

            {/* 4. ACTIVE RENTALS */}
            <TabPanel px={0} py={0}>
               <Box bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" shadow={glass.shadow} overflow="hidden">
                 <TableContainer>
                   <Table variant="simple" minW="800px" sx={{ 'th, td': { borderColor: tableBorderColor } }}>
                    <Thead bg={theadBg}><Tr><Th py={4}>User</Th><Th py={4}>Mobile</Th><Th py={4}>Book</Th><Th py={4}>Due Date</Th><Th py={4}>Actions</Th></Tr></Thead>
                    <Tbody>
                      {activeRentals.map((r) => (
                        <Tr key={r.id}>
                          <Td fontWeight="medium">{r.user?.full_name}</Td>
                          <Td color={mutedText}>{r.user?.mobile_number || 'N/A'}</Td>
                          <Td color={mutedText}>{r.book?.title}</Td>
                          <Td>
                            {new Date(r.due_date).toLocaleDateString()}
                            {r.extension_requested && <Badge ml={2} colorScheme="purple" fontSize="0.7em">Ext. Requested</Badge>}
                          </Td>
                          <Td><Button size="sm" borderRadius="full" colorScheme="blue" variant="outline" onClick={() => handleForceReturn(r.id, r.book_id)}>Force Return</Button></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {activeRentals.length === 0 && <Text p={10} textAlign="center" color={mutedText} fontWeight="medium">No active rentals.</Text>}
               </Box>
            </TabPanel>

            {/* 5. HISTORY */}
            <TabPanel px={0} py={0}>
              <Box bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" shadow={glass.shadow} overflow="hidden">
                <TableContainer>
                  <Table variant="simple" minW="800px" sx={{ 'th, td': { borderColor: tableBorderColor } }}>
                    <Thead bg={theadBg}><Tr><Th py={4}>User</Th><Th py={4}>Mobile</Th><Th py={4}>Book</Th><Th py={4}>Rent Started</Th><Th py={4}>Returned</Th></Tr></Thead>
                    <Tbody>
                      {returnHistory.map((r) => (
                        <Tr key={r.id}>
                          <Td fontWeight="medium">{r.user?.full_name}</Td>
                          <Td color={mutedText}>{r.user?.mobile_number || 'N/A'}</Td>
                          <Td color={mutedText}>{r.book?.title}</Td>
                          <Td>{r.approval_date ? new Date(r.approval_date).toLocaleDateString() : '-'}</Td>
                          <Td>{r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '-'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {returnHistory.length === 0 && <Text p={10} textAlign="center" color={mutedText} fontWeight="medium">No history available.</Text>}
              </Box>
            </TabPanel>

            {/* 6. ALL BOOKS (NEW) */}
            <TabPanel px={0} py={0}>
              <Box bg={glass.solidBg} backdropFilter={glass.filter} border={glass.border} borderRadius="3xl" shadow={glass.shadow} overflow="hidden">
                <TableContainer>
                  <Table variant="simple" minW="900px" sx={{ 'th, td': { borderColor: tableBorderColor } }}>
                    <Thead bg={theadBg}>
                      <Tr>
                        <Th py={5}>Book</Th>
                        <Th py={5}>Owner Info</Th>
                        <Th py={5}>Status</Th>
                        <Th py={5}>Current Renter</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {allBooks.map((b) => {
                        // Dynamically find if this book is currently in an active transaction
                        const activeRental = activeRentals.find(r => r.book_id === b.id);
                        
                        return (
                          <Tr key={b.id} transition="all 0.2s" _hover={{ bg: useColorModeValue('whiteAlpha.600', 'whiteAlpha.100') }}>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" color={textColor}>{b.title}</Text>
                                <Badge fontSize="0.7em" mt={1} borderRadius="full" px={2} colorScheme="blue">{b.broad_category}</Badge>
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" color={textColor}>{b.owner?.full_name || 'Unknown'}</Text>
                                <Text fontSize="xs" color={mutedText}>{b.owner?.mobile_number || 'No Mobile'}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={b.status === 'available' ? 'green' : 'yellow'} borderRadius="full">
                                {b.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              {activeRental ? (
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium" color={useColorModeValue('blue.600', 'blue.300')}>{activeRental.user?.full_name}</Text>
                                  <Text fontSize="xs" color={mutedText}>{activeRental.user?.mobile_number || 'No Mobile'}</Text>
                                </VStack>
                              ) : (
                                <Text color={mutedText}>-</Text>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
                {allBooks.length === 0 && <Text p={10} textAlign="center" color={mutedText} fontWeight="medium">No books in the library yet.</Text>}
              </Box>
            </TabPanel>

          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
};