// frontend/src/components/admin/admin-mobile/AdminMobileBottomNav.jsx
import React from 'react';
import { Box, VStack, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBookOpen, FiCheckSquare, FiBarChart2, FiSidebar } from 'react-icons/fi';

function AdminMobileBottomNav({ isPlusActive, onOpenPlus }) {
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
      <NavLink to="/admin" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiHome} boxSize={4} />
            <Text>Dashboard</Text>
          </VStack>
        )}
      </NavLink>

      <NavLink to="/admin/menu" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiBookOpen} boxSize={4} />
            <Text>Menu</Text>
          </VStack>
        )}
      </NavLink>

      <NavLink to="/admin/orders" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiCheckSquare} boxSize={4} />
            <Text>Commandes</Text>
          </VStack>
        )}
      </NavLink>

      <NavLink to="/admin/stats" end style={{ width: '100%' }}>
        {({ isActive }) => (
          <VStack
            spacing={1}
            fontSize="10px"
            color={isActive ? 'teal.300' : mobileNavTextColor}
          >
            <Icon as={FiBarChart2} boxSize={4} />
            <Text>Stats</Text>
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

export default AdminMobileBottomNav;

