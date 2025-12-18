// frontend/src/components/client/ClientLayout.jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  useDisclosure,
  Badge,
  FormControl,
  FormLabel,
  Input,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  FiMenu,
  FiShoppingCart,
  FiLogOut,
  FiUser,
  FiClock,
  FiHeart,
  FiDollarSign,
  FiSidebar,
  FiCoffee,
  FiSettings,
} from 'react-icons/fi';
import AdminThemeToggle from '../admin/AdminThemeToggle';
import useCurrentUser from '../../hooks/useCurrentUser';
import HeaderUserBadge from '../HeaderUserBadge';
import { CartProvider, useCart } from '../../context/CartContext';
import ClientMobileBottomNav from './client-mobile/ClientMobileBottomNav';
import ClientPlusDrawer from './client-mobile/ClientPlusDrawer';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Contenu principal avec header, Drawer de panier et modal profil.
// Défini en dehors de ClientLayout pour éviter un remount à chaque render.
function ClientMainContent({
  headerBg,
  footerTextColor,
  displayName,
  currentUser,
  navigate,
  cartDrawer,
  tableNumber,
  setTableNumber,
}) {
    const { items, totalItems, totalAmount, updateQuantity, removeItem, clearCart } = useCart();

    const formatPrice = (value) => {
      if (value == null) return '';
      const num = Number(value);
      if (Number.isNaN(num)) return value;
      return num.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
    };

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderType, setOrderType] = useState('sur_place');

    return (
      <Flex direction="column" flex="1" h="100%" overflow="hidden" pb={{ base: 16, md: 0 }}>
        <Box
          as="header"
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 4 }}
          borderBottomWidth="1px"
          bg={headerBg}
        >
          <Flex align="center" justify="space-between">
            <Heading size={"md"}>Espace client</Heading>

            <HStack spacing={4} align="center">
              <Box position="relative">
                <IconButton
                  aria-label="Panier"
                  icon={<FiShoppingCart />}
                  variant="ghost"
                  onClick={cartDrawer.onOpen}
                  h="32px"
                />
                {totalItems > 0 && (
                  <Badge
                    position="absolute"
                    top={-1}
                    right={-1}
                    bg="teal.500"
                    color="white"
                    borderRadius="full"
                    px={1}
                    fontSize="0.6rem"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Box>

              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <AdminThemeToggle />
              </HStack>

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

        <Box as="main" flex="1" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }} overflowY="auto">
          <Outlet />
        </Box>

        <Drawer isOpen={cartDrawer.isOpen} placement="right" onClose={cartDrawer.onClose} size="sm">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader>
              <HStack justify="space-between" align="center">
                <Text>Mon panier</Text>
                <IconButton
                  aria-label="Fermer le panier"
                  size="sm"
                  variant="ghost"
                  onClick={cartDrawer.onClose}
                  icon={<Icon as={FiSidebar} />}
                />
              </HStack>
            </DrawerHeader>
            <DrawerBody>
              {items.length === 0 ? (
                <Text fontSize="sm" color={footerTextColor}>
                  Votre panier est vide.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {items.map((item) => (
                    <HStack key={item.platId} justify="space-between" align="center">
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {item.nom}
                        </Text>
                        <Text fontSize="xs" color={footerTextColor}>
                          {formatPrice(item.prix)} KMF
                        </Text>
                      </VStack>
                      <HStack spacing={2} align="center">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantite}
                          onChange={(e) =>
                            updateQuantity(item.platId, Number(e.target.value) || 1)
                          }
                          w="60px"
                          size="sm"
                        />
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => removeItem(item.platId)}
                        >
                          Retirer
                        </Button>
                      </HStack>
                    </HStack>
                  ))}

                  <FormControl mt={2}>
                    <FormLabel fontSize="sm">Type de commande</FormLabel>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        variant={orderType === 'sur_place' ? 'solid' : 'outline'}
                        colorScheme="teal"
                        onClick={() => setOrderType('sur_place')}
                      >
                        Sur place
                      </Button>
                      <Button
                        size="xs"
                        variant={orderType === 'emporter' ? 'solid' : 'outline'}
                        colorScheme="teal"
                        onClick={() => setOrderType('emporter')}
                      >
                        À emporter
                      </Button>
                    </HStack>
                  </FormControl>

                  <FormControl mt={4} isDisabled={orderType === 'emporter'}>
                    <FormLabel fontSize="sm">Numéro de table</FormLabel>
                    <Input
                      size="sm"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Saisissez votre numéro de table"
                    />
                  </FormControl>

                  <HStack justify="space-between" pt={2}>
                    <Text fontWeight="bold">Total</Text>
                    <Text fontWeight="bold">{formatPrice(totalAmount)} KMF</Text>
                  </HStack>
                </VStack>
              )}
            </DrawerBody>
            <DrawerFooter>
              <HStack w="100%" justify="space-between">
                <Button variant="outline" onClick={clearCart} isDisabled={items.length === 0 || isSubmitting}>
                  Vider
                </Button>
                <Button
                  colorScheme="teal"
                  isDisabled={
                    items.length === 0 || (orderType === 'sur_place' && !tableNumber)
                  }
                  isLoading={isSubmitting}
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      const token = localStorage.getItem('token');
                      const config = {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          items: items.map((it) => ({ platId: it.platId, quantite: it.quantite })),
                          tableNumber,
                          typeCommande: orderType,
                        }),
                      };

                      const res = await fetch(`${API_URL}/client/orders`, config);
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body.message || 'Erreur lors de la création de la commande.');
                      }

                      await res.json();
                      clearCart();
                      cartDrawer.onClose();
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  Passer la commande
                </Button>
              </HStack>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent mx={{ base: 4, md: 0 }}>
            <ModalHeader>Mon profil</ModalHeader>
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
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setIsProfileOpen(false)}>Fermer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>
    );
  }

function ClientLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const cartDrawer = useDisclosure();
  const plusDrawer = useDisclosure();
  const [tableNumber, setTableNumber] = useState('');

  const layoutBg = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const footerTextColor = useColorModeValue('gray.500', 'gray.400');
  const navHoverBg = useColorModeValue('gray.100', 'gray.700');
  const mobileNavTextColor = useColorModeValue('black', footerTextColor);
  const logoSidebarSrc = useColorModeValue(
    '/images/logo-matinma-4-black.png',
    '/images/logo-matinma-4-white.png'
  );

  const displayName = currentUser
    ? `${currentUser.nom || ''} ${currentUser.prenom || ''}`.trim() || currentUser.email || 'Client'
    : 'Client';

  const initials = (() => {
    if (!currentUser) return 'C';
    const parts = [currentUser.prenom, currentUser.nom].filter(Boolean);
    if (parts.length === 0 && currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return parts
      .map((p) => p.trim()[0])
      .join('')
      .toUpperCase();
  })();

  const isMobile = useBreakpointValue({ base: true, md: false });
  const location = useLocation();

  const isPlusActive =
    plusDrawer.isOpen || location.pathname.startsWith('/client/parametres');

  return (
    <Flex h="100vh" bg={layoutBg} overflow="hidden" direction={{ base: 'column', md: 'row' }}>
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
                to='/client/menu'
                end
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white'}}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiCoffee} />
                  {!isSidebarCollapsed && <Text>Plats</Text>}
                </HStack>
              </Link>
              
              <Link
                as={NavLink}
                to="/client/commandes"
                end
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiClock} />
                  {!isSidebarCollapsed && <Text>Mes commandes</Text>}
                </HStack>
              </Link>

              <Link
                as={NavLink}
                to="/client/favoris"
                end
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiHeart} />
                  {!isSidebarCollapsed && <Text>Mes favoris</Text>}
                </HStack>
              </Link>

              <Link
                as={NavLink}
                to="/client/paiements"
                end
                px={3}
                py={2}
                borderRadius="md"
                w="100%"
                _hover={{ bg: navHoverBg }}
                _activeLink={{ bg: 'teal.500', color: 'white' }}
              >
                <HStack spacing={isSidebarCollapsed ? 0 : 2} justify={isSidebarCollapsed ? 'center' : 'flex-start'}>
                  <Icon as={FiDollarSign} />
                  {!isSidebarCollapsed && <Text>Mes paiements</Text>}
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

      {/* Main content area with header + cart */}
      <CartProvider>
        <Box flex="1" position="relative">
          <ClientMainContent
            headerBg={headerBg}
            footerTextColor={footerTextColor}
            displayName={displayName}
            currentUser={currentUser}
            navigate={navigate}
            cartDrawer={cartDrawer}
            tableNumber={tableNumber}
            setTableNumber={setTableNumber}
          />

          {/* Mobile bottom navigation */}
          <ClientMobileBottomNav
            isPlusActive={isPlusActive}
            onOpenPlus={plusDrawer.onOpen}
          />
        </Box>

        {/* Drawer pour les pages "Plus" */}
        <ClientPlusDrawer plusDrawer={plusDrawer} />
      </CartProvider>
    </Flex>
  );
}

export default ClientLayout;
