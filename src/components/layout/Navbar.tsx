import {
  Flex,
  Heading,
  Button,
  HStack,
  Icon,
  useColorModeValue,
  Box,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaUserShield, FaBars } from "react-icons/fa"; 
import { ColorModeSwitcher } from '../common/ColorModeSwitcher';

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // --- APPLE LIQUID GLASS STYLES ---

  // 1. The Gradient: Simulates light hitting the surface diagonally
  const glassBg = useColorModeValue(
    "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.15) 100%)", 
    "linear-gradient(135deg, rgba(40, 40, 40, 0.6) 0%, rgba(10, 10, 10, 0.2) 100%)"
  );

  // 2. The Bevel & Shadow: Uses multiple inset shadows to create a 3D "lip" 
  // and a soft drop shadow for the ambient glow.
  const glassShadow = useColorModeValue(
    `0 8px 32px 0 rgba(31, 38, 135, 0.07), 
     inset 0 1px 1px rgba(255, 255, 255, 0.8), 
     inset 0 -1px 1px rgba(0, 0, 0, 0.05)`, 
    
    `0 8px 32px 0 rgba(0, 0, 0, 0.4), 
     inset 0 1px 1px rgba(255, 255, 255, 0.15), 
     inset 0 -1px 1px rgba(0, 0, 0, 0.3)`
  );

  // 3. The Refraction: High blur combined with saturation pull
  const glassFilter = "blur(24px) saturate(180%)";

  // Standard UI Colors
  const navBorder = useColorModeValue("1px solid rgba(255, 255, 255, 0.4)", "1px solid rgba(255, 255, 255, 0.05)");
  const drawerBg = useColorModeValue("white", "gray.900");
  const linkColor = useColorModeValue("gray.700", "gray.300"); 
  const linkHoverColor = useColorModeValue("black", "white");

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate("/login");
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <Box 
        position="fixed" top={{ base: 4, md: 6 }} w="100%" zIndex={100} 
        display="flex" justifyContent="center" px={4} pointerEvents="none" 
      >
        <Flex
          as="nav"
          pointerEvents="auto" 
          bg={glassBg}                    // Applied the diagonal light gradient
          backdropFilter={glassFilter}    // Applied the heavy blur & saturation
          boxShadow={glassShadow}         // Applied the 3D bevel and glow
          border={navBorder}
          borderRadius="full"
          px={{ base: 5, md: 8 }}
          py={{ base: 3, md: 4 }}
          align="center"
          justify="space-between"
          w="100%"
          maxW="900px" 
          transition="all 0.3s ease"
        >
          {/* LOGO */}
          <Heading
            size="md" fontWeight="extrabold" letterSpacing="tight"
            bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text"
            cursor="pointer" onClick={() => handleNav("/")}
            _hover={{ opacity: 0.8 }} transition="opacity 0.2s" mr={8}
          >
            ReadSphere
          </Heading>

          {/* DESKTOP LINKS */}
          <HStack gap={6} display={{ base: "none", md: "flex" }} flex={1} justify="center">
            <Button variant="link" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'none' }} fontWeight="medium" onClick={() => handleNav("/")}>
              Explore
            </Button>
            {user && (
              <>
                <Button variant="link" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'none' }} fontWeight="medium" onClick={() => handleNav("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="link" color={linkColor} _hover={{ color: linkHoverColor, textDecoration: 'none' }} fontWeight="medium" onClick={() => handleNav("/submit-book")}>
                  List a Book
                </Button>
                {role === "admin" && (
                  <Button variant="link" color="purple.500" _hover={{ color: "purple.400", textDecoration: 'none' }} fontWeight="bold" leftIcon={<Icon as={FaUserShield} />} onClick={() => handleNav("/admin")}>
                    Admin
                  </Button>
                )}
              </>
            )}
          </HStack>

          {/* DESKTOP ACTIONS */}
          <HStack gap={3} display={{ base: "none", md: "flex" }} ml={8}>
            <ColorModeSwitcher />
            {user ? (
              <Button colorScheme="gray" variant="solid" bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.200')} size="sm" borderRadius="full" px={6} onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button 
                colorScheme="blue" size="sm" borderRadius="full" px={6}
                boxShadow="0 4px 14px 0 rgba(0, 118, 255, 0.39)" 
                _hover={{ transform: 'translateY(-1px)', boxShadow: "0 6px 20px rgba(0, 118, 255, 0.23)" }}
                onClick={() => handleNav("/login")}
              >
                Login
              </Button>
            )}
          </HStack>

          {/* MOBILE NAVIGATION BUTTON */}
          <HStack display={{ base: "flex", md: "none" }} spacing={2}>
            <ColorModeSwitcher />
            <IconButton
              aria-label="Open Menu" icon={<Icon as={FaBars} />}
              variant="ghost" borderRadius="full" size="sm" onClick={onOpen}
            />
          </HStack>
        </Flex>
      </Box>

      {/* MOBILE DRAWER */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay backdropFilter="blur(8px)" />
        <DrawerContent bg={drawerBg} borderTopLeftRadius="2xl" borderBottomLeftRadius="2xl">
          <DrawerCloseButton mt={2} borderRadius="full" />
          <DrawerBody pt={12} px={6}>
            <VStack align="stretch" spacing={4}>
              <Button variant="ghost" justifyContent="flex-start" size="lg" borderRadius="xl" onClick={() => handleNav("/")}>Explore</Button>
              {user ? (
                <>
                  <Button variant="ghost" justifyContent="flex-start" size="lg" borderRadius="xl" onClick={() => handleNav("/dashboard")}>Dashboard</Button>
                  <Button variant="ghost" justifyContent="flex-start" size="lg" borderRadius="xl" onClick={() => handleNav("/submit-book")}>List a Book</Button>
                  {role === "admin" && (
                    <Button colorScheme="purple" variant="subtle" justifyContent="flex-start" size="lg" borderRadius="xl" leftIcon={<Icon as={FaUserShield} />} onClick={() => handleNav("/admin")}>Admin Panel</Button>
                  )}
                  <Box pt={4}>
                    <Button colorScheme="red" variant="outline" w="100%" size="lg" borderRadius="xl" onClick={handleLogout}>Logout</Button>
                  </Box>
                </>
              ) : (
                <Box pt={4}>
                  <Button colorScheme="blue" w="100%" size="lg" borderRadius="xl" onClick={() => handleNav("/login")}>Login / Sign Up</Button>
                </Box>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};