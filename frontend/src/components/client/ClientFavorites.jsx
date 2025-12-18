// frontend/src/components/client/ClientFavorites.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Button,
  useToast,
  useColorModeValue,
  Image,
} from '@chakra-ui/react';
import { FiHeart } from 'react-icons/fi';
import axios from 'axios';

function ClientFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const subtleText = useColorModeValue('gray.500', 'gray.400');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      const response = await axios.get(`${API_URL}/client/favorites`, config);
      setFavorites(response.data.favorites || []);
    } catch (error) {
      toast({
        title: 'Erreur lors du chargement des favoris',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (value) => {
    if (value == null) return '';
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (platId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      await axios.delete(`${API_URL}/client/favorites/${platId}`, config);
      setFavorites((prev) => prev.filter((fav) => fav.id !== platId));
      toast({
        title: 'Favori retiré',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur lors de la suppression du favori',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      w="100%"
      h="100%"
      overflowY={{ base: 'auto', md: 'visible' }}
      pb={{ base: 4, md: 0 }}
    >
      <HStack justify="space-between" mb={4} flexWrap="wrap" rowGap={2}>
        <Heading size={{ base: 'sm', md: 'md' }}>Mes favoris</Heading>
      </HStack>

      {favorites.length === 0 && !isLoading ? (
        <Text fontSize="sm" color={subtleText}>
          Vous n'avez encore aucun plat en favori.
        </Text>
      ) : (
        <Box
          maxH={{ base: 'calc(100vh - 163px)', md: 'none' }}
          overflowY={{ base: 'auto', md: 'visible' }}
          pr={{ base: 1, md: 0 }}
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
            spacing={3}
            sx={{
              '@media (max-width: 360px)': {
                gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
              },
              '@media (min-width: 361px) and (max-width: 530px)': {
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              },
              '@media (min-width: 531px) and (max-width: 768px)': {
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {favorites.map((fav) => (
              <Box
                key={fav.id}
                bg={cardBg}
                p={4}
                borderRadius="lg"
                borderWidth="1px"
              >
                <VStack align="stretch" spacing={2}>
                  {fav.image_url && (
                    <Box mb={1} borderRadius="md" overflow="hidden">
                      <Image
                        src={fav.image_url}
                        alt={fav.nom}
                        w="100%"
                        h="140px"
                        objectFit="cover"
                      />
                    </Box>
                  )}
                  <HStack justify="space-between" align="center">
                    <Heading size="sm" noOfLines={1}>
                      {fav.nom}
                    </Heading>
                    <FiHeart
                      style={{ fill: 'currentColor' }}
                      color="pink"
                    />
                  </HStack>
                  <Text fontSize="sm" color={subtleText} noOfLines={3}>
                    {fav.description || 'Pas de description.'}
                  </Text>
                  <HStack justify="space-between" pt={2}>
                    <Text fontWeight="bold">{formatPrice(fav.prix)} KMF</Text>
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => handleRemove(fav.id)}
                    >
                      Retirer
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}

export default ClientFavorites;
