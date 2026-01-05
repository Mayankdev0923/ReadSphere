import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, 
  Table, Thead, Tbody, Tr, Th, Td, Button, Image, Badge, useToast, Text,
  useColorModeValue, Tooltip, Icon
} from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminPanel = () => {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  
  const [pendingBooks, setPendingBooks] = useState<any[]>([]);
  const [existingBooks, setExistingBooks] = useState<any[]>([]); // To check duplicates
  const [pendingRentals, setPendingRentals] = useState<any[]>([]);
  const [activeRentals, setActiveRentals] = useState<any[]>([]); 
  const [returnHistory, setReturnHistory] = useState<any[]>([]); 

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
    // 1. Pending Submissions
    const { data: pBooks } = await supabase.from('books').select('*').eq('status', 'pending_approval');
    if (pBooks) setPendingBooks(pBooks);

    // 2. Fetch ALL Active Books (for duplicate checking)
    const { data: eBooks } = await supabase.from('books').select('title, isbn13').neq('status', 'pending_approval');
    if (eBooks) setExistingBooks(eBooks);

    // 3. Rental Data
    const { data: rentals } = await supabase.from('transactions').select('*, book:books(title), user:profiles(full_name, email)').eq('status', 'pending');
    if (rentals) setPendingRentals(rentals);

    const { data: active } = await supabase.from('transactions').select('*, book:books(title), user:profiles(full_name, email)').in('status', ['approved', 'active']).order('due_date', { ascending: true });
    if (active) setActiveRentals(active);

    const { data: history } = await supabase.from('transactions').select('*, book:books(title), user:profiles(full_name, email)').eq('status', 'returned').order('returned_at', { ascending: false });
    if (history) setReturnHistory(history);
  };

  // --- DUPLICATE CHECK LOGIC ---
  const getDuplicateStatus = (book: any) => {
    // Check ISBN Match (Strongest Signal)
    if (book.isbn13) {
      const isbnMatch = existingBooks.find(b => b.isbn13 === book.isbn13);
      if (isbnMatch) return { isDup: true, reason: 'ISBN Match' };
    }
    
    // Check Title Match (Fuzzy)
    const titleMatch = existingBooks.find(b => b.title.toLowerCase() === book.title.toLowerCase());
    if (titleMatch) return { isDup: true, reason: 'Title Match' };

    return { isDup: false, reason: '' };
  };

  const handleBookAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const { error } = await supabase.from('books').update({ status: 'available' }).eq('id', id);
        if (error) throw error;
        toast({ title: 'Book Published', status: 'success' });
      } else {
        const { error } = await supabase.from('books').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Book Rejected', status: 'info' });
      }
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, status: 'error' });
    }
  };

  const handleRentalAction = async (id: number, action: 'approve' | 'reject') => {
    // ... (Keep existing rental logic identical to previous code) ...
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

  const handleForceReturn = async (id: number, bookId: number) => {
    // ... (Keep existing logic) ...
    if (!window.confirm("Force return this book?")) return;
    await supabase.from('transactions').update({ status: 'returned', returned_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('books').update({ status: 'available' }).eq('id', bookId);
    toast({ title: 'Book Returned', status: 'success' });
    fetchAllData();
  };

  if (authLoading) return <Box p={10}>Checking permissions...</Box>;

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={6}>Admin Console</Heading>
      <Tabs variant="enclosed" colorScheme="blue" isLazy>
        <TabList>
          <Tab>Requests ({pendingRentals.length})</Tab>
          <Tab>Submissions ({pendingBooks.length})</Tab> {/* Moved Submissions earlier for visibility */}
          <Tab>Active Rentals</Tab>
          <Tab>History</Tab>
        </TabList>
        <TabPanels>
          
          {/* 1. Requests */}
          <TabPanel>
             {/* ... (Same Rental Request Table as before) ... */}
             <Table variant="simple" bg={bg} borderRadius="md" shadow="sm">
              <Thead><Tr><Th>User</Th><Th>Book</Th><Th>Actions</Th></Tr></Thead>
              <Tbody>
                {pendingRentals.map((r) => (
                  <Tr key={r.id}>
                    <Td>{r.user?.full_name}</Td>
                    <Td>{r.book?.title}</Td>
                    <Td>
                      <Button size="sm" colorScheme="green" mr={2} onClick={() => handleRentalAction(r.id, 'approve')}>Approve</Button>
                      <Button size="sm" colorScheme="red" onClick={() => handleRentalAction(r.id, 'reject')}>Reject</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
             {pendingRentals.length === 0 && <Text p={4} color="gray.500">No pending requests.</Text>}
          </TabPanel>

          {/* 2. SUBMISSIONS (With Duplicate Check) */}
          <TabPanel>
            <Table variant="simple" bg={bg} borderRadius="md" shadow="sm">
              <Thead>
                <Tr>
                  <Th>Cover</Th>
                  <Th>Details</Th>
                  <Th>Dup. Check</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingBooks.map((b) => {
                  const { isDup, reason } = getDuplicateStatus(b);
                  return (
                    <Tr key={b.id}>
                      <Td>
                        <Image src={b.image_url} h="60px" w="40px" objectFit="cover" borderRadius="sm" fallbackSrc="https://via.placeholder.com/40x60" />
                      </Td>
                      <Td>
                        <Text fontWeight="bold">{b.title}</Text>
                        <Text fontSize="xs" color="gray.500">ISBN: {b.isbn13 || 'N/A'}</Text>
                        <Badge fontSize="0.7em" mt={1}>{b.broad_category}</Badge>
                      </Td>
                      <Td>
                        {isDup ? (
                          <Tooltip label={`Book already exists: ${reason}`}>
                            <Badge colorScheme="red" display="flex" alignItems="center" w="fit-content" px={2} py={1}>
                              <Icon as={WarningTwoIcon} mr={1} /> Duplicate?
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Badge colorScheme="green" variant="outline">Unique</Badge>
                        )}
                      </Td>
                      <Td>
                        <Button size="sm" colorScheme="green" mr={2} onClick={() => handleBookAction(b.id, 'approve')}>Publish</Button>
                        <Button size="sm" colorScheme="red" onClick={() => handleBookAction(b.id, 'reject')}>Reject</Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
            {pendingBooks.length === 0 && <Text p={4} color="gray.500">No pending submissions.</Text>}
          </TabPanel>

          {/* 3. Active Rentals */}
          <TabPanel>
             {/* ... (Same Active Rentals Table) ... */}
             <Table variant="simple" bg={bg} borderRadius="md" shadow="sm">
              <Thead><Tr><Th>User</Th><Th>Book</Th><Th>Due</Th><Th>Actions</Th></Tr></Thead>
              <Tbody>
                {activeRentals.map((r) => (
                  <Tr key={r.id}>
                    <Td>{r.user?.full_name}</Td>
                    <Td>{r.book?.title}</Td>
                    <Td>{new Date(r.due_date).toLocaleDateString()}</Td>
                    <Td><Button size="sm" colorScheme="blue" variant="outline" onClick={() => handleForceReturn(r.id, r.book_id)}>Force Return</Button></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

          {/* 4. History */}
          <TabPanel>
            {/* ... (Same History Table) ... */}
            <Table variant="simple" bg={bg} borderRadius="md" shadow="sm">
              <Thead><Tr><Th>User</Th><Th>Book</Th><Th>Returned</Th></Tr></Thead>
              <Tbody>
                {returnHistory.map((r) => (
                  <Tr key={r.id}>
                    <Td>{r.user?.full_name}</Td>
                    <Td>{r.book?.title}</Td>
                    <Td>{r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

        </TabPanels>
      </Tabs>
    </Container>
  );
};