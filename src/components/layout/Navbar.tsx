import {
  Flex,
  Heading,
  Button,
  Spacer,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import { ColorModeSwitcher } from '../common/ColorModeSwitcher';
import { FaUserShield } from "react-icons/fa"; // Import Admin Icon

export const Navbar = () => {
  const { user, role, signOut } = useAuth(); // Get 'role' from AuthContext
  const navigate = useNavigate();

  // Dynamic colors for Navbar
  const bg = useColorModeValue("white", "gray.800");
  const borderBottom = useColorModeValue("gray.200", "gray.700");

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Flex
      as="nav"
      p={4}
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderBottom}
      shadow="sm"
      align="center"
      px={{ base: 4, md: 12 }}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Heading
        size="md"
        color="blue.500"
        cursor="pointer"
        onClick={() => navigate("/")}
        _hover={{ opacity: 0.8 }}
      >
        ReadSphere
      </Heading>

      <Spacer />

      <HStack gap={4}>
        {/* <ColorModeSwitcher /> */}

        <Button variant="ghost" onClick={() => navigate("/")}>
          Explore
        </Button>

        {user ? (
          <>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              My Dashboard
            </Button>

            <Button variant="ghost" onClick={() => navigate("/submit-book")}>
              List a Book
            </Button>

            {/* --- ADMIN BUTTON (Only visible to admins) --- */}
            {role === "admin" && (
              <Button
                colorScheme="purple"
                size="sm"
                leftIcon={<Icon as={FaUserShield} />}
                onClick={() => navigate("/admin")}
              >
                Admin Panel
              </Button>
            )}

            <Button
              colorScheme="gray"
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button colorScheme="blue" onClick={() => navigate("/login")}>
            Login
          </Button>
        )}
      </HStack>
    </Flex>
  );
};
