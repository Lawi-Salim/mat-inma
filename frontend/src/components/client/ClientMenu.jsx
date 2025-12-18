// frontend/src/components/client/ClientMenu.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  SimpleGrid,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  HStack,
  Image,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Select,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { FiHeart } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ClientMenu() {
  const [plats, setPlats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategorieId, setActiveCategorieId] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const { addItem } = useCart();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const subtleText = useColorModeValue('gray.500', 'gray.400');

  const getCategoryName = (categorieId) => {
    if (!categorieId) return null;
    const cat = categories.find((c) => c.id === categorieId);
    return cat ? cat.nom : null;
  };

  const formatPrice = (value) => {
    if (value == null) return '';
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const authConfig = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined;

        const [platsRes, catRes, favRes] = await Promise.all([
          axios.get(`${API_URL}/menu/plats`, {
          params: { disponible: 'true' },
        }),
          axios.get(`${API_URL}/menu/categories`),
          axios.get(`${API_URL}/client/favorites`, authConfig),
        ]);

        setPlats(platsRes.data || []);
        setCategories(catRes.data || []);

        const favs = favRes.data?.favorites || [];
        setFavoriteIds(new Set(favs.map((p) => p.id)));
      } catch (err) {
        console.error('Erreur chargement menu client:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const toggleFavorite = async (platId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      const isFav = favoriteIds.has(platId);

      if (isFav) {
        await axios.delete(`${API_URL}/client/favorites/${platId}`, config);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(platId);
          return next;
        });
      } else {
        await axios.post(
          `${API_URL}/client/favorites`,
          { platId },
          config
        );
        setFavoriteIds((prev) => new Set(prev).add(platId));
      }
    } catch (err) {
      console.error('Erreur toggle favori:', err);
    }
  };

  const platsDisponibles = plats.filter((p) => {
    if (p.disponible === false) return false;
    if (activeCategorieId === 'all') return true;
    return p.categorie_id === activeCategorieId;
  });

  const handleTakeDish = (plat) => {
    addItem(plat);
  };

  return (
    <Box w="100%">
      <HStack justify="space-between" mb={4} flexWrap="wrap" rowGap={2}>
        <Heading size={{ base: 'sm', md: 'md' }}>Menu</Heading>
        {loading && (
          <HStack spacing={2} color={subtleText}>
            <Spinner size="sm" />
            <Text fontSize="xs">Chargement...</Text>
          </HStack>
        )}

        {error && (
          <Text fontSize="sm" color="red.400" mb={3}>
            Impossible de charger le menu pour le moment.
          </Text>
        )}

        {categories.length > 0 && (
          <Box maxW={{ base: '100%', md: '260px' }}>
            <Select
              size="sm"
              maxW={{ base: '165px', md: '180px' }}
              fontSize={{ base: 'xs', md: 'sm' }}
              h={{ base: '24px', md: '32px' }}
              value={activeCategorieId === 'all' ? '' : activeCategorieId}
              placeholder="Toutes les catégories"
              onChange={(e) => {
                const value = e.target.value || 'all';
                setActiveCategorieId(value);
              }}
              borderRadius="md"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </Select>
          </Box>
        )}
      </HStack>

      {platsDisponibles.length === 0 && !loading ? (
        <Text fontSize="sm" color={subtleText}>
          Aucun plat disponible pour le moment.
        </Text>
      ) : (
        <Box
          maxH={{ base: 'calc(100vh - 170px)', md: 'none' }}
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
            {platsDisponibles.map((plat) => (
            <Box
              key={plat.id}
              bg={cardBg}
              p={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor={cardBorder}
              _hover={{ bg: cardHoverBg, transition: 'all 0.15s ease-out' }}
              onClick={() => setSelectedPlat(plat)}
            >
              <VStack align="stretch" spacing={2}>
                {plat.image_url && (
                  <Box mb={1} borderRadius="md" overflow="hidden">
                    <Image
                      src={plat.image_url}
                      alt={plat.nom}
                      w="100%"
                      h="120px"
                      objectFit="cover"
                    />
                  </Box>
                )}
                <VStack align="flex-start" spacing={1}>
                  <HStack justify="space-between" align="center" w="100%">
                    <HStack spacing={2} align="center">
                      <Heading size="sm" noOfLines={1}>
                        {plat.nom}
                      </Heading>
                    </HStack>
                    <IconButton
                      aria-label={favoriteIds.has(plat.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      icon={
                        <FiHeart
                          style={{
                            fill: favoriteIds.has(plat.id) ? 'currentColor' : 'none',
                          }}
                        />
                      }
                      size="sm"
                      variant="ghost"
                      color={favoriteIds.has(plat.id) ? 'pink.400' : 'gray.400'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(plat.id);
                      }}
                    />
                  </HStack>
                  {getCategoryName(plat.categorie_id) && (
                    <Badge p={1} fontSize="0.6rem">{getCategoryName(plat.categorie_id)}</Badge>
                  )}
                </VStack>
                <HStack justify="space-between" pt={2} align="center">
                  <Text fontWeight="bold" fontSize={".75rem"}>{formatPrice(plat.prix)} KMF</Text>
                  <HStack spacing={2} align="center">
                    {plat.disponible === false && (
                      <Badge colorScheme="red">Indisponible</Badge>
                    )}
                    <Button
                      pl={1}
                      pr={1}
                      h="25px"
                      w="60px"
                      fontSize="0.7rem"
                      backgroundColor="teal.500"
                      color="white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTakeDish(plat);
                      }}
                    >
                      Prendre
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
            </Box>
          ))}
          </SimpleGrid>
        </Box>
      )}

      <Modal isOpen={!!selectedPlat} onClose={() => setSelectedPlat(null)} isCentered>
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader>{selectedPlat?.nom}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="flex-start" spacing={3}>
              <Text fontSize="sm" color={subtleText}>
                {selectedPlat?.description || 'Pas de description.'}
              </Text>
              <HStack spacing={2}>
                <Text fontWeight="bold">Prix :</Text>
                <Text>{selectedPlat?.prix} KMF</Text>
              </HStack>
              {selectedPlat && getCategoryName(selectedPlat.categorie_id) && (
                <HStack spacing={2}>
                  <Text fontWeight="bold">Catégorie :</Text>
                  <Badge>{getCategoryName(selectedPlat.categorie_id)}</Badge>
                </HStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setSelectedPlat(null)}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ClientMenu;
