// frontend/src/components/employe/EmployeLayout.jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  Avatar,
} from '@chakra-ui/react';
import { FiSidebar, FiCheckSquare, FiDollarSign } from 'react-icons/fi';
import AdminThemeToggle from '../admin/AdminThemeToggle';
import useCurrentUser from '../../hooks/useCurrentUser';
import HeaderUserBadge from '../HeaderUserBadge';
import { clearAuthData } from '../../utils/auth';
import axios from 'axios';

function EmployeLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();

  const layoutBg = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const footerTextColor = useColorModeValue('gray.500', 'gray.400');
  const navHoverBg = useColorModeValue('gray.100', 'gray.700');
  const logoSidebarSrc = useColorModeValue(
    '/images/logo-matinma-4-black.png',
    '/images/logo-matinma-4-white.png'
  );

  const displayName = currentUser
    ? `${currentUser.nom || ''} ${currentUser.prenom || ''}`.trim() || currentUser.email || 'Employé'
    : 'Employé';

  const initials = (() => {
    if (!currentUser) return 'E';
    const parts = [currentUser.prenom, currentUser.nom].filter(Boolean);
    if (parts.length === 0 && currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return parts
      .map((p) => p.trim()[0])
      .join('')
      .toUpperCase();
  })();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <Flex h="100vh" bg={layoutBg} overflow="hidden">
      {/* Sidebar */}
      <Box
        as="nav"
        w={isSidebarCollapsed ? { base: '64px', md: '72px' } : { base: '220px', md: '200px' }}
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
                src={logoSidebarSrc}
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
                  src={logoSidebarSrc}
                  alt="Mat'inma logo"
                  boxSize="28px"
                  objectFit="contain"
                />
              </HStack>
            )}
          </Box>

          <Divider />

          <Box flex="1" w="100%" pr={4} pl={4}>
            <VStack align="stretch" spacing={2} fontSize="sm" h="100%">
              <Link
                as={NavLink}
                to="/employe/commandes"
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
                to="/employe/caisse"
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiDollarSign} />
                  {!isSidebarCollapsed && <Text>Caisse / comptoir</Text>}
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
            <Heading size="md">Espace employé</Heading>

            <HStack spacing={4} align="center">
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <AdminThemeToggle />
              </HStack>

              <HeaderUserBadge
                displayName={displayName}
                onProfile={() => setIsProfileOpen(true)}
                onLogout={async () => {
                  try {
                    const userId = localStorage.getItem('userId');
                    const tokenId = localStorage.getItem('tokenId');

                    if (userId && tokenId) {
                      await axios.post(`${API_URL}/auth/logout`, { userId, tokenId });
                    }
                  } catch (err) {
                    console.error('Erreur déconnexion backend (employe):', err);
                  } finally {
                    clearAuthData();
                    navigate('/login');
                  }
                }}
              />
            </HStack>
          </Flex>
        </Box>

        <Box as="main" flex="1" p={4} overflowY="auto">
          <Outlet />
        </Box>

        <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Profil employé</ModalHeader>
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
                  <Text>{currentUser?.role || 'employe'}</Text>
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

export default EmployeLayout;
