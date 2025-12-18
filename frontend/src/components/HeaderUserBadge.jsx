// frontend/src/components/HeaderUserBadge.jsx
import React from 'react';
import {
  HStack,
  Box,
  Text,
  Avatar,
  Tooltip,
  Icon,
  Button,
  VStack,
  useColorModeValue,
  useColorMode,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
} from '@chakra-ui/react';
import { FiUser } from 'react-icons/fi';

function HeaderUserBadge({ displayName, initials, roleLabel, onProfile, onLogout }) {
  const menuBg = useColorModeValue('white', 'gray.800');
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Popover placement="bottom-end" trigger="click">
      <PopoverTrigger>
        <HStack
          spacing={2}
          align="center"
          borderRadius="md"
          cursor="pointer"
          _hover={{ opacity: 0.85 }}
        >
          <Box textAlign="right" display={{ base: 'none', md: 'block' }}>
            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
              {displayName}
            </Text>
          </Box>
          <Avatar size="sm" name={displayName}>
            {initials}
          </Avatar>
          <Tooltip label="Compte" hasArrow>
            <Box as="span">
              <Icon as={FiUser} fontSize="sm" color="gray.500" />
            </Box>
          </Tooltip>
        </HStack>
      </PopoverTrigger>

      <PopoverContent w="180px" bg={menuBg} _focus={{ boxShadow: 'lg' }}>
        {/* <PopoverArrow />
        <PopoverCloseButton /> */}
        <PopoverBody>
          <VStack align="stretch" spacing={2}>
            <Button size="sm" variant="ghost" justifyContent="flex-start" onClick={onProfile}>
              Profil
            </Button>
            <Button
              size="sm"
              variant="ghost"
              justifyContent="flex-start"
              onClick={toggleColorMode}
            >
              {colorMode === 'light' ? 'Mode sombre' : 'Mode claire'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              justifyContent="flex-start"
              onClick={onLogout}
            >
              Déconnexion
            </Button>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default HeaderUserBadge;

// frontend/src/components/HeaderUserBadge.jsx