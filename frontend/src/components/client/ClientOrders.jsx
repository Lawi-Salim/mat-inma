// frontend/src/components/client/ClientOrders.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Spinner,
  Select,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ClientOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.100', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.750');
  const subtleText = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/client/orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error('Erreur chargement commandes client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.statut === statusFilter;
  });

  return (
    <VStack spacing={4} align="stretch" w="100%">
      <HStack justify="space-between" flexWrap="wrap" rowGap={2}>
        <Heading size="md">Mes commandes</Heading>

        <HStack spacing={3}>
          <Select
            size="sm"
            maxW={{ base: '150px', md: '180px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            h={{ base: '24px', md: '32px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            borderRadius="md"
          >
            <option value="all">Toutes</option>
            <option value="en_attente">En attente</option>
            <option value="en_preparation">En préparation</option>
            <option value="pret">Prêtes</option>
            <option value="livree">Livrées</option>
            <option value="annulee">Annulées</option>
          </Select>
        </HStack>
      </HStack>

      <Box w="100%">
        <HStack justify="space-between" mb={3} px={1}>
          <Heading size={{ base: 'sm', md: 'md' }}>Historique des commandes</Heading>
          {isLoading && (
            <HStack spacing={2} color={subtleText}>
              <Spinner size="sm" />
              <Text fontSize="xs">Chargement...</Text>
            </HStack>
          )}
        </HStack>

        <Box
          maxH={{ base: 'calc(100vh - 165px)', md: 'none' }}
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
          <Box
            w="100%"
            borderWidth="1px"
            borderRadius="md"
            overflowX="auto"
            bg={cardBg}
            fontSize={{ base: 'xs', md: 'xs' }}
          >
            <Table size={{ base: 'sm', md: 'md' }} variant="simple" minW="650px">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>Commande</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Statut</Th>
                <Th isNumeric>Total (KMF)</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order) => (
                <Tr key={order.id} _hover={{ bg: rowHoverBg }}>
                  <Td>
                    <VStack align="flex-start" spacing={0}>
                      <HStack spacing={2}>
                        <Text fontWeight="semibold">{order.numero}</Text>
                      </HStack>
                      <Text fontSize="xs" color={subtleText}>
                        Créée le{' '}
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString('fr-FR')
                      : '—'}
                  </Td>
                  <Td>
                    {order.type_commande === 'sur_place' && 'Sur place'}
                    {order.type_commande === 'emporter' && 'À emporter'}
                    {order.type_commande === 'livraison' && 'Livraison'}
                    {!order.type_commande && '—'}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        order.statut === 'livree'
                          ? 'green'
                          : order.statut === 'annulee'
                          ? 'red'
                          : 'orange'
                      }
                    >
                      {order.statut}
                    </Badge>
                  </Td>
                  <Td isNumeric>{order.total?.toLocaleString('fr-FR') || '—'}</Td>
                  <Td textAlign="right">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      mr={1}
                    >
                      Détails
                    </Button>
                  </Td>
                </Tr>
              ))}

              {filteredOrders.length === 0 && !isLoading && (
                <Tr>
                  <Td colSpan={5} textAlign="center" p={4}>
                    <Text fontSize="sm" color={subtleText}>
                      Aucune commande pour ce filtre.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          </Box>
        </Box>
      </Box>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader>
            <Heading size={{ base: 'sm', md: 'md' }}>
              Détails commande {selectedOrder?.numero}
            </Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder ? (
              <VStack align="stretch" spacing={3}>
                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="sm" color={subtleText}>
                    Créée le{' '}
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </Text>
                  <HStack spacing={3}>
                    <Text fontSize="sm">
                      Type :{' '}
                      {selectedOrder.type_commande === 'sur_place'
                        ? 'Sur place'
                        : selectedOrder.type_commande === 'emporter'
                        ? 'À emporter'
                        : '—'}
                    </Text>
                    {selectedOrder.type_commande === 'sur_place' && selectedOrder.numero_table && (
                      <Text fontSize="sm">Table {selectedOrder.numero_table}</Text>
                    )}
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="sm">Statut :</Text>
                    <Badge
                      colorScheme={
                        selectedOrder.statut === 'livree'
                          ? 'green'
                          : selectedOrder.statut === 'annulee'
                          ? 'red'
                          : 'orange'
                      }
                    >
                      {selectedOrder.statut}
                    </Badge>
                  </HStack>
                </VStack>

                <HStack justify="space-between">
                  <Text fontWeight="bold">Total</Text>
                  <Text fontWeight="bold">
                    {selectedOrder.total?.toLocaleString('fr-FR') || '—'} KMF
                  </Text>
                </HStack>
              </VStack>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setSelectedOrder(null)}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

export default ClientOrders;
