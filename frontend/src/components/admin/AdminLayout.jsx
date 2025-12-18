// frontend/src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

import { 
  FiHome, 
  FiBookOpen, 
  FiCheckSquare, 
  FiBarChart2, 
  FiSidebar,
  FiBell, 
  FiUser,
  FiUsers,
} from 'react-icons/fi';

import AdminThemeToggle from './AdminThemeToggle';
import HeaderUserBadge from '../HeaderUserBadge';
import AdminMobileBottomNav from './admin-mobile/AdminMobileBottomNav';
import AdminPlusDrawer from './admin-mobile/AdminPlusDrawer';

import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Link,
  Divider,
  HStack,
  Icon,
  Avatar,
  IconButton,
  Image,
  useColorModeValue,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';

import useCurrentUser from '../../hooks/useCurrentUser';

function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const plusDrawer = useDisclosure();

  // Couleurs adaptées au thème clair/sombre
  const layoutBg = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const footerTextColor = useColorModeValue('gray.500', 'gray.400');
  const navHoverBg = useColorModeValue('gray.100', 'gray.700');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const displayName = currentUser
    ? `${currentUser.nom || ''} ${currentUser.prenom || ''}`.trim() || currentUser.email || 'Utilisateur'
    : 'Utilisateur';

  const initials = (() => {

    if (!currentUser) return 'U';
    const parts = [currentUser.prenom, currentUser.nom].filter(Boolean);
    if (parts.length === 0 && currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return parts
      .map((p) => p.trim()[0])
      .join('')
      .toUpperCase();
  })();

  const location = useLocation();
  const isPlusActive = plusDrawer.isOpen || location.pathname.startsWith('/admin/employes');

  return (
    <Flex h="100vh" bg={layoutBg} overflow="hidden">

      {/* Sidebar - hidden on mobile, visible from md and up */}
      <Box
        as="nav"
        display={{ base: 'none', md: 'block' }}
        w={isSidebarCollapsed ? { md: '72px' } : { md: '220px', lg: '200px' }}
        bg={sidebarBg}
        borderRightWidth="1px"
        borderRightColor={sidebarBorderColor}
        pos="sticky"
        top={0}
        h="100%"
      >

        <VStack align="flex-start" spacing={4} h="full">
          <Box w="100%" p={4} pb={1}>
            {isSidebarCollapsed ? (
              <Image
                src="/images/Logo-Mat-inma.png"
                alt="Mat'inma logo"
                maxH="32px"
                mx="auto"
                objectFit="contain"
              />
            ) : (
              <HStack spacing={12} justify="center">
                <Heading size="md" noOfLines={1}>
                  Mat'inma
                </Heading>
                <Image
                  src="/images/Logo-Mat-inma.png"
                  alt="Mat'inma logo"
                  boxSize="28px"
                  objectFit="contain"
                />
              </HStack>
            )}
          </Box>

          <Divider />

          {/* Zone de navigation qui remplit l'espace entre header et footer */}
          <Box flex="1" w="100%" pr={4} pl={4}>
            <VStack align="stretch" spacing={2} fontSize="sm" h="100%">
              <Link
                as={NavLink}
                to="/admin"
                end
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiHome} />
                  {!isSidebarCollapsed && <Text>Dashboard</Text>}
                </HStack>
              </Link>

              <Link
                as={NavLink}
                to="/admin/menu"
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiBookOpen} />
                  {!isSidebarCollapsed && <Text>Gestion du menu</Text>}
                </HStack>
              </Link>

              <Link
                as={NavLink}
                to="/admin/orders"
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiCheckSquare} />
                  {!isSidebarCollapsed && <Text>Commandes</Text>}
                </HStack>
              </Link>

              <Link
                as={NavLink}
                to="/admin/stats"
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiBarChart2} />
                  {!isSidebarCollapsed && <Text>Statistiques</Text>}
                </HStack>
              </Link>

              <Link
                as={NavLink}
                to="/admin/employes"
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiUsers} />
                  {!isSidebarCollapsed && <Text>Employés</Text>}
                </HStack>
              </Link>
            </VStack>
          </Box>
          
          <Divider />

          <Box mt="auto" p={4} pt={0} fontSize="xs" color={footerTextColor} w="100%">
            {isSidebarCollapsed ? (
              <IconButton
                aria-label="Ouvrir la barre latérale"
                size="sm"
                variant="ghost"
                borderRadius="full"
                icon={<Icon as={FiSidebar} />}
                mx="auto"
                display="block"
                onClick={() => setIsSidebarCollapsed(false)}
              />
            ) : (
              <HStack justify="space-between" w="100%">
                <HStack>
                  <Text>Mat'inma-al-khayiri</Text>
                </HStack>
                <IconButton
                  aria-label="Fermer la barre latérale"
                  size="sm"
                  variant="ghost"
                  borderRadius="md"
                  icon={<Icon as={FiSidebar} />}
                  onClick={() => setIsSidebarCollapsed(true)}
                />
              </HStack>
            )}
          </Box>
        </VStack>
      </Box>

      {/* Main content area with header */}
      <Flex direction="column" flex="1" h="100%" overflow="hidden">

        <Box
          as="header"
          p={4}
          borderBottomWidth="1px"
          bg={headerBg}
        >
          <Flex align="center" justify="space-between">
            <Heading size="md">Espace administrateur</Heading>

            <HStack spacing={4} align="center">
              {/* Icônes actions (mode nuit, notifications) */}
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <AdminThemeToggle />
              </HStack>
              <Icon as={FiBell} fontSize="lg" color="gray.500" cursor="pointer" />

              <HeaderUserBadge
                displayName={displayName}
                onProfile={() => setIsProfileOpen(true)}
                onLogout={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
              />
            </HStack>
          </Flex>
        </Box>

        <Box
          as="main"
          flex="1"
          px={{ base: 3, md: 4 }}
          pt={{ base: 3, md: 4 }}
          pb={{ base: 16, md: 4 }}
          overflowY="auto"
        >
          <Outlet />
        </Box>

        {/* Mobile bottom navigation */}
        <AdminMobileBottomNav
          isPlusActive={isPlusActive}
          onOpenPlus={plusDrawer.onOpen}
        />

        {/* Drawer Plus pour les pages supplémentaires */}
        <AdminPlusDrawer plusDrawer={plusDrawer} />

        <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Profil administrateur</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="flex-start" spacing={2}>
                <HStack>
                  <Text fontWeight="medium">Nom :</Text>
                  <Text>{currentUser?.nom || '—'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="medium">Prénom :</Text>
                  <Text>{currentUser?.prenom || '—'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="medium">Email :</Text>
                  <Text>{currentUser?.email || '—'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="medium">Téléphone :</Text>
                  <Text>{currentUser?.telephone || '—'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="medium">Rôle :</Text>
                  <Text>{currentUser?.role || 'admin'}</Text>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setIsProfileOpen(false)}>Fermer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>
    </Flex>
  );
}

export default AdminLayout;