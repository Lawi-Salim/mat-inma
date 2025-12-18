// frontend/src/components/admin/admin-mobile/AdminPlusDrawer.jsx
import React from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  VStack,
  Link,
  HStack,
  Text,
  Icon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FiUsers } from 'react-icons/fi';

function AdminPlusDrawer({ plusDrawer }) {
  const drawerHoverBg = useColorModeValue('teal.100', 'teal.600');

  return (
    <Drawer
      isOpen={plusDrawer.isOpen}
      placement="right"
      onClose={plusDrawer.onClose}
      size="xs"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>Plus</DrawerHeader>

        <Divider />

        <DrawerBody>
          <VStack align="stretch" spacing={2}>
            <Link
              as={NavLink}
              to="/admin/employes"
              onClick={plusDrawer.onClose}
              px={3}
              py={2}
              borderRadius="md"
              _hover={{ bg: drawerHoverBg }}
              _activeLink={{ bg: 'teal.500', color: 'white' }}
            >
              <HStack spacing={2}>
                <Icon as={FiUsers} />
                <Text>Employés</Text>
              </HStack>
            </Link>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default AdminPlusDrawer;