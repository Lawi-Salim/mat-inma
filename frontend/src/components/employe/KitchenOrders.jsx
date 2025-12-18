// frontend/src/components/employe/KitchenOrders.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  useColorModeValue,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { useAppToast } from '../../hooks/useAppToast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function KitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null); // id en cours de maj
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { showError, showSuccess } = useAppToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/employe/kitchen/orders`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des commandes cuisine.");
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      const message = err.message || "Erreur lors du chargement des commandes cuisine.";
      setError(message);
      showError('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMarkAsDelivered = async (orderId) => {
    try {
      setIsUpdating(orderId);
      const res = await fetch(`${API_BASE_URL}/employe/kitchen/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'livree' }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du statut de la commande.");
      }

      const updated = await res.json();

      setOrders((prev) => prev.filter((order) => order.id !== updated.id));
      showSuccess('Commande livrée', `La commande ${updated.numero} a été marquée comme livrée.`);
    } catch (err) {
      console.error(err);
      const message = err.message || "Erreur lors de la mise à jour du statut.";
      showError('Erreur', message);
    } finally {
      setIsUpdating(null);
    }
  };

  const hasOrders = orders && orders.length > 0;

  return (
    <Box>
      <VStack align="flex-start" spacing={4} w="100%">
        <Heading size="md">Commandes cuisine</Heading>

        {error && (
          <Text fontSize="sm" color="red.400">
            {error}
          </Text>
        )}

        {isLoading && (
          <HStack spacing={2} color={subtleText}>
            <Spinner size="sm" />
            <Text fontSize="sm">Chargement des commandes...</Text>
          </HStack>
        )}

        {!isLoading && !hasOrders && (
          <Text fontSize="sm" color={subtleText}>
            Aucune commande en attente pour le moment.
          </Text>
        )}

        {hasOrders && (
          <Box w="100%" borderWidth="1px" borderRadius="md" overflow="hidden" bg={cardBg}>
            <Table size="sm" variant="simple">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th>Commande</Th>
                  <Th>Client</Th>
                  <Th>Table / Type</Th>
                  <Th>Statut</Th>
                  <Th isNumeric>Total (KMF)</Th>
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
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
                    <Td>{order.client_nom || '—'}</Td>
                    <Td>
                      {order.type_commande === 'sur_place' && order.numero_table && (
                        <Text fontSize="sm">Table {order.numero_table}</Text>
                      )}
                      {order.type_commande === 'emporter' && (
                        <Text fontSize="sm">À emporter</Text>
                      )}
                      {order.type_commande === 'livraison' && (
                        <Text fontSize="sm">Livraison</Text>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">en_attente</Badge>
                    </Td>
                    <Td isNumeric>{order.total.toLocaleString('fr-FR')}</Td>
                    <Td isNumeric>
                      <HStack justify="flex-end" spacing={2}>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Détails
                        </Button>
                        <Button
                          colorScheme="green"
                          size="xs"
                          onClick={() => handleMarkAsDelivered(order.id)}
                          isLoading={isUpdating === order.id}
                        >
                          Marquer comme livrée
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
        {/* Modal détails de commande */}
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} size="lg" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Détails commande {selectedOrder?.numero}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedOrder ? (
                <VStack align="stretch" spacing={3}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="sm" color={subtleText}>
                      Créée le{' '}
                      {new Date(selectedOrder.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
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
                      <Text fontSize="sm">Client : {selectedOrder.client_nom || '—'}</Text>
                      <Badge colorScheme="blue">en_attente</Badge>
                    </HStack>
                  </VStack>

                  <Box borderWidth="1px" borderRadius="md" p={3}>
                    {Array.isArray(selectedOrder.lignes) && selectedOrder.lignes.length > 0 ? (
                      <VStack align="stretch" spacing={2}>
                        {selectedOrder.lignes.map((ligne, index) => (
                          <HStack key={index} justify="space-between" align="center">
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm" fontWeight="semibold">
                                {ligne.quantite} {ligne.nomPlat || 'Plat'}
                              </Text>
                              {ligne.commentaire && (
                                <Text fontSize="xs" color={subtleText}>
                                  Note : {ligne.commentaire}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                        ))}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color={subtleText}>
                        Aucun détail de plat disponible.
                      </Text>
                    )}
                  </Box>

                  <HStack justify="space-between">
                    <Text fontWeight="bold">Total</Text>
                    <Text fontWeight="bold">
                      {selectedOrder.total.toLocaleString('fr-FR')} KMF
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
    </Box>
  );
}

export default KitchenOrders;
