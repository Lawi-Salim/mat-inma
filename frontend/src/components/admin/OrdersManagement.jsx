// frontend/src/components/admin/OrdersManagement.jsx
import { useEffect, useState } from 'react';

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Select,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';

import { useAppToast } from '../../hooks/useAppToast';

const ADMIN_API_BASE_URL = 'http://localhost:5000/api/admin';

const STATUS_LABELS = {
  en_attente: 'En attente',
  en_preparation: 'En préparation',
  prete: 'Prête',
  servie: 'Servie',
  annulee: 'Annulée',
};

const STATUS_COLOR = {
  en_attente: 'orange',
  en_preparation: 'yellow',
  prete: 'blue',
  servie: 'green',
  annulee: 'red',
};

function OrdersManagement({ orders: externalOrders, onAdvanceStatus }) {
  const [statusFilter, setStatusFilter] = useState('en_attente');

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.100', 'gray.600');

  const { showError, showSuccess } = useAppToast();

  const [internalOrders, setInternalOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasExternalOrders = Array.isArray(externalOrders) && externalOrders.length > 0;
  const baseOrders = hasExternalOrders ? externalOrders : internalOrders;
  const safeOrders = Array.isArray(baseOrders) ? baseOrders : [];

  useEffect(() => {
    // Si des commandes sont fournies par props, on ne fetch pas
    if (hasExternalOrders) return;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const params =
          statusFilter && statusFilter !== 'TOUTES'
            ? `?status=${encodeURIComponent(statusFilter)}`
            : '';

        const res = await fetch(`${ADMIN_API_BASE_URL}/orders${params}`);
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des commandes.');
        }

        const data = await res.json();
        setInternalOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        const message = err.message || 'Erreur lors du chargement des commandes.';
        showError('Erreur', message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, hasExternalOrders]);

  const advanceStatus = async (id) => {
    if (typeof onAdvanceStatus === 'function') {
      onAdvanceStatus(id);
      return;
    }

    const current = safeOrders.find((o) => o.id === id);
    if (!current) return;

    const flow = ['en_attente', 'en_preparation', 'prete', 'servie', 'annulee'];
    const idx = flow.indexOf(current.status);
    const nextStatus = idx < flow.length - 1 ? flow[idx + 1] : flow[idx];

    if (nextStatus === current.status) {
      return;
    }

    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du statut de la commande.');
      }

      const updated = await res.json();

      if (!hasExternalOrders) {
        setInternalOrders((prev) =>
          prev.map((order) => (order.id === updated.id ? { ...order, status: updated.status } : order))
        );
      }

      showSuccess('Commande mise à jour', `Statut: ${STATUS_LABELS[nextStatus] || nextStatus}`);
    } catch (err) {
      console.error(err);
      const message = err.message || 'Erreur lors de la mise à jour du statut de la commande.';
      showError('Erreur', message);
    }
  };

  const filteredOrders =
    statusFilter === 'TOUTES'
      ? safeOrders
      : safeOrders.filter((o) => o.status === statusFilter);

  const totalForFiltered = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <Box p={0} m={0}>
      <VStack align="flex-start" spacing={4}>
        <Heading size={{ base: 'sm', md: 'md' }}>Gestion des commandes</Heading>

        <HStack w="100%" spacing={4} align="center">
          <Tag size="md" variant="subtle" colorScheme="teal">
            <TagLabel>
              <Text as="span" display={{ base: 'inline', md: 'none' }}>
                {safeOrders.length} CMD
              </Text>
              <Text as="span" display={{ base: 'none', md: 'inline' }}>
                {safeOrders.length} commandes au total
              </Text>
            </TagLabel>
          </Tag>

          <Tag
            size="md"
            variant="subtle"
            colorScheme="purple"
            display={{ base: 'none', md: 'inline-flex' }}
          >
            <TagLabel>
              Total filtré : {totalForFiltered.toLocaleString()} KMF
            </TagLabel>
          </Tag>

          <Select
            size="sm"
            maxW={{ base: '165px', md: '180px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            h={{ base: '24px', md: '32px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TOUTES">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_preparation">En préparation</option>
            <option value="prete">Prête</option>
            <option value="servie">Servie</option>
            <option value="annulee">Annulée</option>
          </Select>
        </HStack>

        <Box w="100%">
          <HStack justify="space-between" mb={3}>
            <Heading size={{ base: 'sm', md: 'md' }}>Liste des commandes</Heading>
            {isLoading && (
              <HStack spacing={2} color="gray.500">
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
            >
              <Table size={{ base: 'sm', md: 'md' }} variant="simple" minW="650px">
                <Thead bg={tableHeaderBg}>
                  <Tr>
                    <Th>Commande</Th>
                    <Th>Table / Origine</Th>
                    <Th>Heure</Th>
                    <Th isNumeric>Total (KMF)</Th>
                    <Th>Statut</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredOrders.map((order) => (
                    <Tr key={order.id} _hover={{ bg: rowHoverBg }}>
                      <Td>{order.numero || order.id}</Td>
                      <Td>{order.table}</Td>
                      <Td>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </Td>
                      <Td isNumeric>{order.total.toLocaleString()}</Td>
                      <Td>
                        <Badge
                          colorScheme={STATUS_COLOR[order.status]}
                          variant="subtle"
                        >
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </Td>
                      <Td textAlign="right">
                        <HStack spacing={2} justify="flex-end">
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="gray"
                          >
                            Détails
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <Tr>
                      <Td colSpan={6} textAlign="center" p={4}>
                        <Text fontSize="sm" color="gray.500">
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
      </VStack>
    </Box>
  );
}

export default OrdersManagement;