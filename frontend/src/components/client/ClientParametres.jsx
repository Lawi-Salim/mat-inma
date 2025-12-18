// frontend/src/components/client/ClientParametres.jsx
import React from 'react';
import { Box, Heading, Text, useColorModeValue, VStack } from '@chakra-ui/react';

function ClientParametres() {
  const subtleText = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box w="100%">
      <VStack align="flex-start" spacing={3} w="100%">
        <Heading size={{ base: 'sm', md: 'md' }}>Paramètres</Heading>
        <Text fontSize={{ base: 'sm', md: 'md' }} color={subtleText}>
          Cette fonctionnalité n'est pas encore disponible.
        </Text>
      </VStack>
    </Box>
  );
}

export default ClientParametres;
