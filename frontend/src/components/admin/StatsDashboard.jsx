// frontend/src/components/admin/StatsDashboard.jsx
import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  List,
  ListItem,
  ListIcon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';

import { FiStar } from 'react-icons/fi';

import { useAppToast } from '../../hooks/useAppToast';

const ADMIN_API_BASE_URL = 'http://localhost:5000/api/admin';

function StatsDashboard({ stats }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const helperTextColor = useColorModeValue('gray.600', 'gray.300');
  const { showError } = useAppToast();

  const [localStats, setLocalStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (stats) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${ADMIN_API_BASE_URL}/dashboard`);
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des statistiques.');
        }

        const data = await res.json();
        setLocalStats(data.stats || null);
      } catch (err) {
        console.error(err);
        const message = err.message || 'Erreur lors du chargement des statistiques.';
        setError(message);
        showError('Erreur', message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [stats]);

  const effectiveStats = stats || localStats || {};

  const safeStats = {
    revenueToday: effectiveStats.revenueToday ?? 0,
    ordersToday: effectiveStats.ordersToday ?? 0,
    averageTicket: effectiveStats.averageTicket ?? 0,
    occupancyRate: effectiveStats.occupancyRate ?? 0,
    topDishes: Array.isArray(effectiveStats.topDishes) ? effectiveStats.topDishes : [],
  };

  return (
    <Box p={0} m={0}>
      <VStack align="flex-start" spacing={4}>
        <Heading size={{ base: 'sm', md: 'md' }}>Statistiques des ventes</Heading>

        {error && (
          <Text fontSize="sm" color="red.400">
            {error}
          </Text>
        )}

        {isLoading && (
          <Text fontSize="sm" color={helperTextColor}>
            Chargement des statistiques...
          </Text>
        )}

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
          <Stat borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>CA du jour</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }}>{safeStats.revenueToday.toLocaleString()} KMF</StatNumber>
            <StatHelpText fontSize={{ base: 'xs', md: 'sm' }} color={helperTextColor}>
              par rapport à hier
            </StatHelpText>
          </Stat>

          <Stat borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Commandes du jour</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }}>{safeStats.ordersToday}</StatNumber>
            <StatHelpText fontSize={{ base: 'xs', md: 'sm' }} color={helperTextColor}>
              Ticket moyen : {safeStats.averageTicket.toLocaleString()} KMF
            </StatHelpText>
          </Stat>

          <Box borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <Heading size={{ base: 'xs', md: 'md' }}>Taux d'occupation</Heading>

            <Text fontSize="xs" color={helperTextColor} mt={1}>
              Estimation sur les dernières 2 heures.
            </Text>

            <Progress
              mt={3}
              value={safeStats.occupancyRate}
              colorScheme="teal"
              borderRadius="full"
            />
            <Text mt={2} fontSize="sm">
              {safeStats.occupancyRate}% des tables occupées
            </Text>
          </Box>
        </SimpleGrid>

        <Box w="100%" borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
          <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
            Top plats du jour
          </Heading>
          <Text fontSize="xs" color={helperTextColor} mb={3}>
            Basé sur le nombre de commandes.
          </Text>

          <Divider mb={3} />
          {safeStats.topDishes.length === 0 ? (
            <Text fontSize="sm" color={helperTextColor} textAlign="center" p={4}>
              Aucune donnée disponible pour le moment.
            </Text>
          ) : (
            <List spacing={2}>
              {safeStats.topDishes.map((dish) => (
                <ListItem key={dish.name} display="flex" justifyContent="space-between">
                  <Box>
                    <ListIcon as={FiStar} color="yellow.400" />
                    <Text as="span" fontWeight="medium">
                      {dish.name}
                    </Text>
                  </Box>
                  <Text fontSize="sm" color={helperTextColor}>
                    {dish.orders} commandes
                  </Text>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

export default StatsDashboard;