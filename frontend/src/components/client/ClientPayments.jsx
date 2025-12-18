// frontend/src/components/client/ClientPayments.jsx
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
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import { FaDownload } from 'react-icons/fa';
// import TicketReceipt from './TicketReceipt'; // ancien composant d'aperçu de ticket, non utilisé

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ClientPayments() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('week');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  // const [ticketOrder, setTicketOrder] = useState(null); // plus utilisé : le ticket est directement téléchargé

  const additionDrawer = useDisclosure();
  // const ticketModal = useDisclosure(); // plus utilisé : plus de modal d'aperçu de ticket

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      const res = await fetch(`${API_URL}/client/orders`, config);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement de vos Paiements.");
      }
      const data = await res.json();
      const list = Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTicketForOrder = async (order) => {
    if (!order) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(
        `${API_URL}/client/orders/${order.id}/ticket.pdf`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Erreur lors du téléchargement du ticket PDF.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${order.numero || order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const isInPeriod = (order) => {
    const created = new Date(order.createdAt || order.createdat);
    if (Number.isNaN(created.getTime())) return false;

    const now = new Date();
    const diffMs = now - created;
    const oneDay = 24 * 60 * 60 * 1000;

    switch (periodFilter) {
      case 'day':
        return diffMs <= oneDay;
      case 'week':
        return diffMs <= 7 * oneDay;
      case 'month':
        return diffMs <= 30 * oneDay;
      case 'all':
      default:
        return true;
    }
  };

  // On ne considère que les commandes prêtes (à payer) ou déjà servies/payées pour l'historique
  const filteredOrders = orders.filter(
    (o) => (o.statut === 'prete' || o.statut === 'servie') && isInPeriod(o)
  );

  const formatPrice = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  };

  const totalAddition = filteredOrders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const preteCount = filteredOrders.filter((o) => o.statut === 'prete').length;

  const handleOpenFirstPreteAddition = () => {
    const firstPrete = filteredOrders.find((o) => o.statut === 'prete');
    if (firstPrete) {
      openAdditionForOrder(firstPrete);
    }
  };

  const openAdditionForOrder = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      const res = await fetch(`${API_URL}/client/orders/${order.id}`, config);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement du détail de la commande.");
      }
      const data = await res.json();
      setSelectedOrder(data);
      additionDrawer.onOpen();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayAddition = async () => {
    if (!selectedOrder) return;
    try {
      setIsPaying(true);
      const token = localStorage.getItem('token');
      const config = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      const res = await fetch(`${API_URL}/client/orders/${selectedOrder.id}/pay`, config);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erreur lors du paiement de l'addition.");
      }

      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, statut: updated.statut } : o))
      );
      setSelectedOrder((prev) => (prev ? { ...prev, statut: updated.statut } : prev));
      additionDrawer.onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Box>
      <VStack align="flex-start" spacing={4} w="100%">
        <Heading size={{ base: 'sm', md: 'md' }}>Mes paiements / additions</Heading>

        <Box w="100%">
          <HStack
            w="100%"
            justify="space-between"
            align="center"
            flexWrap="wrap"
            rowGap={2}
          >
            {/* Gauche : boutons Addition + Rafraîchir */}
            <HStack spacing={2}>
              <Box position="relative">
                <Button
                  size={{ base: 'xs', md: 'sm' }}
                  fontSize={{ base: 'xs', md: 'sm' }}
                  variant="outline"
                  onClick={handleOpenFirstPreteAddition}
                  isDisabled={preteCount === 0}
                >
                  Addition
                </Button>
                {preteCount > 0 && (
                  <Badge
                    position="absolute"
                    top={-1}
                    right={-1}
                    bg="teal.500"
                    color="white"
                    borderRadius="full"
                    px={1}
                    fontSize="0.6rem"
                  >
                    {preteCount}
                  </Badge>
                )}
              </Box>

              <Button
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
                variant="outline"
                onClick={fetchOrders}
              >
                Rafraîchir
              </Button>
            </HStack>

            {/* Droite : Tag + Select période */}
            <HStack spacing={2} align="center">
              <Tag
                size="md"
                variant="subtle"
                colorScheme="teal"
                display={{ base: 'none', md: 'inline-flex' }}
              >
                <TagLabel fontSize={{ base: 'xs', md: 'sm' }}>{orders.length} Paiements</TagLabel>
              </Tag>

              <Select
                size="sm"
                maxW={{ base: '150px', md: '180px' }}
                fontSize={{ base: 'xs', md: 'sm' }}
                h={{ base: '24px', md: '32px' }}
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                borderRadius="md"
              >
                <option value="day">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois-ci</option>
                <option value="all">Tout</option>
              </Select>
            </HStack>
          </HStack>
        </Box>

        <Box w="100%">
          <HStack justify="space-between" mb={3} px={1}>
            <Heading size={{ base: 'sm', md: 'md' }}>Historique de Paiements</Heading>
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
                  <Th>Type</Th>
                  <Th>Table</Th>
                  <Th>Heure</Th>
                  <Th>Statut</Th>
                  <Th isNumeric>Total (KMF)</Th>
                  <Th>Ticket</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.map((order) => (
                  <Tr key={order.id} _hover={{ bg: rowHoverBg }}>
                    <Td>{order.numero || order.id}</Td>
                    <Td>
                      {order.type_commande === 'sur_place' && 'Sur place'}
                      {order.type_commande === 'emporter' && 'À emporter'}
                      {!order.type_commande && '—'}
                    </Td>
                    <Td>{order.numero_table || '—'}</Td>
                    <Td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          order.statut === 'servie'
                            ? 'green'
                            : order.statut === 'prete'
                            ? 'blue'
                            : 'orange'
                        }
                      >
                        {order.statut === 'servie' ? 'PAYEE' : order.statut === 'prete' ? 'PRETE' : order.statut}
                      </Badge>
                    </Td>
                    <Td isNumeric>{formatPrice(order.total)}</Td>
                    <Td>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => downloadTicketForOrder(order)}
                        leftIcon={<FaDownload />}
                        isDisabled={order.statut !== 'servie'}
                      >
                        Ticket
                      </Button>
                    </Td>
                  </Tr>
                ))}
                {filteredOrders.length === 0 && !isLoading && (
                  <Tr>
                    <Td colSpan={8} textAlign="center" p={4}>
                      <Text fontSize="sm" color={subtleText}>
                        Aucune paiement pour ce filtre.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
            </Box>
          </Box>
        </Box>

        {/* Drawer Addition : détail d'une seule commande prête à être payée */}
        <Drawer isOpen={additionDrawer.isOpen} placement="right" onClose={additionDrawer.onClose} size="sm">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader>
              {selectedOrder
                ? `Addition - ${selectedOrder.numero}`
                : 'Addition'}
            </DrawerHeader>
            <DrawerBody>
              {!selectedOrder ? (
                <Text fontSize="sm" color={subtleText}>
                  Aucune commande sélectionnée pour l'addition.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Commande : {selectedOrder.numero}</Text>
                    {selectedOrder.type_commande === 'sur_place' && selectedOrder.numero_table && (
                      <Text fontSize="sm">Table {selectedOrder.numero_table}</Text>
                    )}
                  </HStack>
                  <Box borderWidth="1px" borderRadius="md" p={3}>
                    {Array.isArray(selectedOrder.lignes) && selectedOrder.lignes.length > 0 ? (
                      <VStack align="stretch" spacing={2}>
                        {selectedOrder.lignes.map((ligne, index) => (
                          <HStack key={index} justify="space-between" align="center">
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm" fontWeight="semibold">
                                {ligne.quantite} {ligne.nomPlat || 'Plat'}
                              </Text>
                            </VStack>
                            <Text fontSize="sm" fontWeight="semibold">
                              {formatPrice(ligne.totalLigne || ligne.prixUnitaire * ligne.quantite)} KMF
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color={subtleText}>
                        Aucun détail de plat disponible.
                      </Text>
                    )}
                  </Box>

                  <HStack justify="space-between" pt={2}>
                    <Text fontWeight="bold">Total addition</Text>
                    <Text fontWeight="bold">{formatPrice(selectedOrder.total)} KMF</Text>
                  </HStack>
                </VStack>
              )}
            </DrawerBody>
            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={additionDrawer.onClose}>
                Fermer
              </Button>
              <Button
                colorScheme="teal"
                onClick={handlePayAddition}
                isDisabled={!selectedOrder || selectedOrder.statut !== 'prete'}
                isLoading={isPaying}
              >
                Payer l'addition
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Modal Ticket supprimé : le bouton "Ticket" télécharge directement le PDF */}
      </VStack>
    </Box>
  );
}

export default ClientPayments;
