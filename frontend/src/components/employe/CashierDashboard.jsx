// frontend/src/components/employe/CashierDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Tag,
  TagLabel,
  Select,
  Spacer,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Spinner,
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

function CashierDashboard() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPayingId, setIsPayingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { showError, showSuccess } = useAppToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/employe/cash/orders`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des commandes caisse.");
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError('Erreur', err.message || "Erreur lors du chargement des commandes caisse.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleValidateCashPayment = async (orderId) => {
    try {
      setIsPayingId(orderId);
      const res = await fetch(`${API_BASE_URL}/employe/cash/orders/${orderId}/payment`, {
        method: 'PUT',
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Erreur lors de la validation du paiement.");
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      showSuccess('Paiement validé', `La commande ${updated.numero} a été marquée comme servie.`);
    } catch (err) {
      console.error(err);
      showError('Erreur', err.message || "Erreur lors de la validation du paiement.");
    } finally {
      setIsPayingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'en_attente') return o.statut === 'en_attente' || o.statut === 'livree';
    if (statusFilter === 'servie') return o.statut === 'servie';
    return true;
  });

  return (
    <Box>
      <VStack align="flex-start" spacing={4} w="100%">
        <Heading size="md">Caisse / Comptoir</Heading>

        <Box w="100%">
          <HStack w="100%" spacing={4} align="center">
            <Tag size="md" variant="subtle" colorScheme="teal">
              <TagLabel>{orders.length} commandes du jour</TagLabel>
            </Tag>

            <Select
              size="sm"
              maxW="220px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">À encaisser</option>
              <option value="servie">Servies</option>
            </Select>

            <Spacer />

            <Button size="sm" variant="outline" onClick={fetchOrders}>
              Rafraîchir
            </Button>
          </HStack>
        </Box>

        <Box w="100%">
          <HStack justify="space-between" mb={3} px={1}>
            <Heading size="sm">Commandes du jour</Heading>
            {isLoading && (
              <HStack spacing={2} color={subtleText}>
                <Spinner size="sm" />
                <Text fontSize="xs">Chargement...</Text>
              </HStack>
            )}
          </HStack>

          <Box w="100%" borderWidth="1px" borderRadius="md" overflow="hidden" bg={cardBg}>
          <Table size="sm" variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>Commande</Th>
                <Th>Type</Th>
                <Th>Table</Th>
                <Th>Statut</Th>
                <Th isNumeric>Total (KMF)</Th>
                <Th isNumeric>Actions</Th>
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
                    {order.type_commande === 'sur_place' && 'Sur place'}
                    {order.type_commande === 'emporter' && 'À emporter'}
                    {order.type_commande === 'livraison' && 'Livraison'}
                    {!order.type_commande && '—'}
                  </Td>
                  <Td>{order.numero_table || '—'}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        order.statut === 'servie'
                          ? 'green'
                          : order.statut === 'livree'
                          ? 'blue'
                          : 'orange'
                      }
                    >
                      {order.statut}
                    </Badge>
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
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {filteredOrders.length === 0 && !isLoading && (
                <Tr>
                  <Td colSpan={6} textAlign="center" p={4}>
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
                          selectedOrder.statut === 'servie'
                            ? 'green'
                            : selectedOrder.statut === 'livree'
                            ? 'blue'
                            : 'orange'
                        }
                      >
                        {selectedOrder.statut}
                      </Badge>
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
    </Box>
  );
}

export default CashierDashboard;
