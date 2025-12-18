// frontend/src/components/client/client-mobile/ClientMobileBottomNav.jsx
import React from 'react';
import { Box, VStack, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FiCoffee, FiClock, FiHeart, FiDollarSign, FiSidebar } from 'react-icons/fi';

function ClientMobileBottomNav({ isPlusActive, onOpenPlus }) {
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700');
  const footerTextColor = useColorModeValue('gray.500', 'gray.400');
  const mobileNavTextColor = useColorModeValue('black', footerTextColor);

  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={sidebarBg}
      borderTopWidth="1px"
      borderColor={sidebarBorderColor}
      display={{ base: 'flex', md: 'none' }}
      justifyContent="space-around"
      alignItems="center"
      py={2}
      px={4}
      zIndex={50}
      boxShadow="md"
    >
      <NavLink to="/client/menu" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiCoffee} boxSize={4} />
            <Text>Plats</Text>
          </VStack>
        )}
      </NavLink>

      <NavLink to="/client/commandes" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiClock} boxSize={4} />
            <Text>Commandes</Text>
          </VStack>
        )}
      </NavLink>

      <NavLink to="/client/favoris" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiHeart} boxSize={4} />
            <Text>Favoris</Text>
          </VStack>
        )}
      </NavLink>

      <NavLink to="/client/paiements" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiDollarSign} boxSize={4} />
            <Text>Paiements</Text>
          </VStack>
        )}
      </NavLink>

      <Box
        as="button"
        type="button"
        onClick={onOpenPlus}
        style={{ width: '100%' }}
      >
        <VStack
          spacing={1}
          fontSize="10px"
          color={isPlusActive ? 'teal.300' : mobileNavTextColor}
        >
          <Icon as={FiSidebar} boxSize={4} />
          <Text>Plus</Text>
        </VStack>
      </Box>
    </Box>
  );
}

export default ClientMobileBottomNav;