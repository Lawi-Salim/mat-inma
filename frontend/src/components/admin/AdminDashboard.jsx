// frontend/src/pages -- AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  SimpleGrid,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  Tag,
  TagLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from '@chakra-ui/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { FiMenu } from 'react-icons/fi';

import { useAppToast } from '../../hooks/useAppToast';

const ADMIN_API_BASE_URL = 'http://localhost:5000/api/admin';
function AdminDashboard({ stats, recentOrders }) {
  const { showError } = useAppToast();

  const [localStats, setLocalStats] = useState(null);
  const [localRecentOrders, setLocalRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revenueRange, setRevenueRange] = useState('week'); // 'week' | 'quarter' | 'year'
  const [ordersRange, setOrdersRange] = useState('week'); // 'week' | 'quarter' | 'year'
  const [kpiRange, setKpiRange] = useState('week'); // 'week' | 'quarter' | 'year'
  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  // Fond des graphiques : clair en mode clair, sombre en mode sombre
  const graphBg = useColorModeValue('gray.100', 'gray.900');
  // Couleurs adaptatives pour les courbes, la grille et les tooltips
  const axisTextColor = useColorModeValue('#4A5568', '#A0AEC0');
  const gridColor = useColorModeValue('#CBD5E0', '#4A5568');
  const revenueLineColor = useColorModeValue('#2C5282', '#EDF2F7');
  const ordersLineColor = useColorModeValue('#2A4365', '#E2E8F0');
  const tooltipBg = useColorModeValue('#FFFFFF', '#1A202C');
  const tooltipTextColor = useColorModeValue('#1A202C', '#E2E8F0');
  const tooltipBorderColor = useColorModeValue('#CBD5E0', 'transparent');

  const revenueMenu = useDisclosure();
  const ordersMenu = useDisclosure();

  useEffect(() => {
    // Si les données sont déjà fournies par props, ne pas refetch
    if (stats || recentOrders) return;

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${ADMIN_API_BASE_URL}/dashboard`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du tableau de bord.");
        }

        const data = await res.json();
        setLocalStats(data.stats || null);
        setLocalRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
      } catch (err) {
        console.error(err);
        const message = err.message || 'Erreur lors du chargement du tableau de bord.';
        setError(message);
        showError('Erreur', message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [stats, recentOrders]);

  const effectiveStats = stats || localStats || {};

  const safeStats = {
    revenueToday: effectiveStats.revenueToday ?? 0,
    ordersInProgress: effectiveStats.ordersInProgress ?? 0,
    ordersToday: effectiveStats.ordersToday ?? 0,
    activeDishes: effectiveStats.activeDishes ?? 0,
    clientsToday: effectiveStats.clientsToday ?? 0,
  };

  const effectiveRecentOrders = Array.isArray(recentOrders)
    ? recentOrders
    : localRecentOrders;

  const safeRecentOrders = Array.isArray(effectiveRecentOrders)
    ? effectiveRecentOrders
    : [];

  const computeKpiAggregates = (orders, range) => {
    const now = new Date();
    const start = new Date(now);

    if (range === 'week') {
      // début de la semaine (lundi)
      const day = start.getDay();
      const diff = (day + 6) % 7; // 0 (dimanche) -> 6, 1 (lundi) -> 0, ...
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'quarter') {
      // 3 derniers mois
      start.setMonth(start.getMonth() - 2, 1);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'year') {
      // depuis le début de l'année
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }

    let revenue = 0;
    let ordersCount = 0;
    let ordersInProgress = 0;
    const activeDishesSet = new Set();
    const clientsSet = new Set();

    (orders || []).forEach((o) => {
      const d = new Date(o.date);
      if (Number.isNaN(d.getTime())) return;
      if (d < start || d > now) return;

      const status = o.status;
      if (status === 'servie') {
        revenue += Number(o.amount || 0);
        ordersCount += 1;
      }

      if (status === 'en_cours' || status === 'en_preparation') {
        ordersInProgress += 1;
      }

      // Plats actifs : on compte le nombre de plats distincts apparus dans les commandes
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (item && item.dishId != null) {
            activeDishesSet.add(item.dishId);
          }
        });
      }

      // Clients distincts (si un identifiant est disponible)
      if (o.clientId != null) {
        clientsSet.add(o.clientId);
      } else if (o.clientLabel) {
        clientsSet.add(o.clientLabel);
      }
    });

    return {
      revenue,
      ordersCount,
      ordersInProgress,
      activeDishes: activeDishesSet.size || safeStats.activeDishes,
      clients: clientsSet.size,
    };
  };

  const kpiAggregates = computeKpiAggregates(safeRecentOrders, kpiRange);

  const getKpiRangeLabel = () => {
    if (kpiRange === 'week') return 'Cette semaine';
    if (kpiRange === 'quarter') return '3 derniers mois';
    if (kpiRange === 'year') return "Cette année";
    return '';
  };

  // Construire des séries temporelles pour les graphes selon la période sélectionnée
  const buildSeries = (orders, mapper, range) => {
    const now = new Date();
    const series = [];

    if (range === 'week') {
      // 7 derniers jours (par jour)
      const days = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
        });
        days.push({ key, label });
      }

      const byDay = {};
      (orders || []).forEach((o) => {
        const d = new Date(o.date);
        if (Number.isNaN(d.getTime())) return;
        const key = d.toISOString().slice(0, 10);
        const value = mapper(o);
        byDay[key] = (byDay[key] || 0) + (Number.isFinite(value) ? value : 0);
      });

      return days.map((d) => ({ name: d.label, value: byDay[d.key] || 0 }));
    }

    // Trimestriel / Annuel : agrégation par mois
    const monthsCount = range === 'quarter' ? 3 : 12;
    const buckets = [];
    for (let i = monthsCount - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${month}`;
      // Pour le trimestriel et l'annuel, on affiche seulement le mois ("janv.", "févr.", ...)
      const label = d.toLocaleDateString('fr-FR', {
        month: 'short',
      });
      buckets.push({ key, label });
    }

    const byMonth = {};
    (orders || []).forEach((o) => {
      const d = new Date(o.date);
      if (Number.isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${month}`;
      const value = mapper(o);
      byMonth[key] = (byMonth[key] || 0) + (Number.isFinite(value) ? value : 0);
    });

    return buckets.map((b) => ({ name: b.label, value: byMonth[b.key] || 0 }));
  };

  // Pour les revenus et le nombre de commandes, on ne considère que les commandes payées (statut servie)
  const revenueSeries = buildSeries(
    safeRecentOrders,
    (o) => (o.status === 'servie' ? Number(o.amount || 0) : 0),
    revenueRange,
  );
  const ordersSeries = buildSeries(
    safeRecentOrders,
    () => 1,
    ordersRange,
  );

  return (
    <Container maxW="7xl" p={0} m={0}>
      <VStack align="flex-start" spacing={4}>
        <HStack justify="space-between" w="100%">
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }}>Dashboard Administrateur</Heading>
          </Box>
          <HStack spacing={2}>
            {/* Filtres visibles sur desktop */}
            <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
              <Tag
                size="sm"
                variant={kpiRange === 'week' ? 'subtle' : 'outline'}
                colorScheme="teal"
                cursor="pointer"
                onClick={() => setKpiRange('week')}
              >
                <TagLabel>Semaine</TagLabel>
              </Tag>
              <Tag
                size="sm"
                variant={kpiRange === 'quarter' ? 'subtle' : 'outline'}
                colorScheme="teal"
                cursor="pointer"
                onClick={() => setKpiRange('quarter')}
              >
                <TagLabel>Trimestre</TagLabel>
              </Tag>
              <Tag
                size="sm"
                variant={kpiRange === 'year' ? 'subtle' : 'outline'}
                colorScheme="teal"
                cursor="pointer"
                onClick={() => setKpiRange('year')}
              >
                <TagLabel>Annuel</TagLabel>
              </Tag>
            </HStack>

            {/* Menu hamburger sur mobile */}
            <Box display={{ base: 'block', md: 'none' }}>
              <Popover
                placement="bottom-end"
                isLazy
              >
                <PopoverTrigger>
                  <IconButton
                    aria-label="Choisir la période des KPIs"
                    icon={<FiMenu />}
                    size="sm"
                    variant="ghost"
                  />
                </PopoverTrigger>
                <PopoverContent
                  bg={tooltipBg}
                  borderColor={tooltipBorderColor}
                  _focus={{ boxShadow: 'md' }}
                  w="120px"
                >
                  <PopoverArrow bg={tooltipBg} />
                  <PopoverBody>
                    <VStack align="flex-start" spacing={2}>
                      <Tag
                        size="sm"
                        variant={kpiRange === 'week' ? 'subtle' : 'outline'}
                        colorScheme="teal"
                        cursor="pointer"
                        onClick={() => setKpiRange('week')}
                      >
                        <TagLabel>Semaine</TagLabel>
                      </Tag>
                      <Tag
                        size="sm"
                        variant={kpiRange === 'quarter' ? 'subtle' : 'outline'}
                        colorScheme="teal"
                        cursor="pointer"
                        onClick={() => setKpiRange('quarter')}
                      >
                        <TagLabel>Trimestre</TagLabel>
                      </Tag>
                      <Tag
                        size="sm"
                        variant={kpiRange === 'year' ? 'subtle' : 'outline'}
                        colorScheme="teal"
                        cursor="pointer"
                        onClick={() => setKpiRange('year')}
                      >
                        <TagLabel>Annuel</TagLabel>
                      </Tag>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Box>
          </HStack>
        </HStack>

        {/* Ligne de KPIs */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} w="100%">
          <Stat borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>CA</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }}>
              {kpiAggregates.revenue.toLocaleString('fr-FR')} KMF
            </StatNumber>
            <StatHelpText fontSize={{ base: 'xs', md: 'sm' }}>{getKpiRangeLabel()}</StatHelpText>
          </Stat>

          <Stat borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Commandes</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }}>{kpiAggregates.ordersCount}</StatNumber>
            <StatHelpText fontSize={{ base: 'xs', md: 'sm' }}>
              {kpiAggregates.ordersInProgress} en cours de traitement
            </StatHelpText>
          </Stat>

          <Stat borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Plats actifs</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }}>{kpiAggregates.activeDishes}</StatNumber>
            <StatHelpText fontSize={{ base: 'xs', md: 'sm' }}>Basé sur les commandes de la période</StatHelpText>
          </Stat>

          <Stat borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Clients</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }}>{kpiAggregates.clients}</StatNumber>
            <StatHelpText fontSize={{ base: 'xs', md: 'sm' }}>Clients uniques sur la période</StatHelpText>
          </Stat>
        </SimpleGrid>

        {error && (
          <Text fontSize="sm" color="red.400">
            {error}
          </Text>
        )}

        {isLoading && (
          <Text fontSize="sm" color="gray.500">
            Chargement des statistiques...
          </Text>
        )}

        {/* Ligne Revenue / Résumé commandes */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
          <Box borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <HStack justify="space-between" mb={2}>
              <Heading size={{ base: 'sm', md: 'md' }}>Revenus</Heading>
              <HStack spacing={2}>
                {/* Filtres visibles sur desktop */}
                <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                  <Tag
                    size="sm"
                    variant={revenueRange === 'week' ? 'subtle' : 'outline'}
                    colorScheme="teal"
                    cursor="pointer"
                    onClick={() => setRevenueRange('week')}
                  >
                    <TagLabel>Semaine</TagLabel>
                  </Tag>
                  <Tag
                    size="sm"
                    variant={revenueRange === 'quarter' ? 'subtle' : 'outline'}
                    colorScheme="teal"
                    cursor="pointer"
                    onClick={() => setRevenueRange('quarter')}
                  >
                    <TagLabel>Trimestre</TagLabel>
                  </Tag>
                  <Tag
                    size="sm"
                    variant={revenueRange === 'year' ? 'subtle' : 'outline'}
                    colorScheme="teal"
                    cursor="pointer"
                    onClick={() => setRevenueRange('year')}
                  >
                    <TagLabel>Annuel</TagLabel>
                  </Tag>
                </HStack>

                {/* Menu hamburger sur mobile */}
                <Box display={{ base: 'block', md: 'none' }}>
                  <Popover
                    isOpen={revenueMenu.isOpen}
                    onOpen={revenueMenu.onOpen}
                    onClose={revenueMenu.onClose}
                    placement="bottom-end"
                    isLazy
                  >
                    <PopoverTrigger>
                      <IconButton
                        aria-label="Choisir la période des revenus"
                        icon={<FiMenu />}
                        size="sm"
                        variant="ghost"
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      bg={tooltipBg}
                      borderColor={tooltipBorderColor}
                      _focus={{ boxShadow: 'md' }}
                      w="100px"
                    >
                      <PopoverArrow bg={tooltipBg} />
                      <PopoverBody>
                        <VStack align="flex-start" spacing={2}>
                          <Tag
                            size="sm"
                            variant={revenueRange === 'week' ? 'subtle' : 'outline'}
                            colorScheme="teal"
                            cursor="pointer"
                            onClick={() => {
                              setRevenueRange('week');
                              revenueMenu.onClose();
                            }}
                          >
                            <TagLabel>Semaine</TagLabel>
                          </Tag>
                          <Tag
                            size="sm"
                            variant={revenueRange === 'quarter' ? 'subtle' : 'outline'}
                            colorScheme="teal"
                            cursor="pointer"
                            onClick={() => {
                              setRevenueRange('quarter');
                              revenueMenu.onClose();
                            }}
                          >
                            <TagLabel>Trimestre</TagLabel>
                          </Tag>
                          <Tag
                            size="sm"
                            variant={revenueRange === 'year' ? 'subtle' : 'outline'}
                            colorScheme="teal"
                            cursor="pointer"
                            onClick={() => {
                              setRevenueRange('year');
                              revenueMenu.onClose();
                            }}
                          >
                            <TagLabel>Annuel</TagLabel>
                          </Tag>
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </Box>
              </HStack>
            </HStack>
            <Text fontSize="xs" color="gray.500" mb={4}>
              Revenus sur la période sélectionnée (basé sur les commandes payées).
            </Text>
            <Box mt={2} h="200px" borderRadius="lg" overflow="hidden" bg={graphBg} px={2} py={2}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#63B3ED" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#63B3ED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: axisTextColor }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: axisTextColor }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} KMF`, 'Revenus']}
                    labelStyle={{ fontSize: 11, color: tooltipTextColor }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorderColor}`,
                      borderRadius: 8,
                      color: tooltipTextColor,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={revenueLineColor}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box borderWidth="1px" borderRadius="md" p={4} bg={cardBg}>
            <HStack justify="space-between" mb={2}>
              <Heading size={{ base: 'sm', md: 'md' }}>Résumé des commandes</Heading>
              <HStack spacing={2}>
                {/* Filtres visibles sur desktop */}
                <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                  <Tag
                    size="sm"
                    variant={ordersRange === 'week' ? 'subtle' : 'outline'}
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={() => setOrdersRange('week')}
                  >
                    <TagLabel>Semaine</TagLabel>
                  </Tag>
                  <Tag
                    size="sm"
                    variant={ordersRange === 'quarter' ? 'subtle' : 'outline'}
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={() => setOrdersRange('quarter')}
                  >
                    <TagLabel>Trimestre</TagLabel>
                  </Tag>
                  <Tag
                    size="sm"
                    variant={ordersRange === 'year' ? 'subtle' : 'outline'}
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={() => setOrdersRange('year')}
                  >
                    <TagLabel>Annuel</TagLabel>
                  </Tag>
                </HStack>

                {/* Menu hamburger sur mobile */}
                <Box display={{ base: 'block', md: 'none' }}>
                  <Popover
                    isOpen={ordersMenu.isOpen}
                    onOpen={ordersMenu.onOpen}
                    onClose={ordersMenu.onClose}
                    placement="bottom-end"
                    isLazy
                  >
                    <PopoverTrigger>
                      <IconButton
                        aria-label="Choisir la période des commandes"
                        icon={<FiMenu />}
                        size="sm"
                        variant="ghost"
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      bg={tooltipBg}
                      borderColor={tooltipBorderColor}
                      _focus={{ boxShadow: 'md' }}
                      w="100px"
                    >
                      <PopoverArrow bg={tooltipBg} />
                      <PopoverBody>
                        <VStack align="flex-start" spacing={2}>
                          <Tag
                            size="sm"
                            variant={ordersRange === 'week' ? 'subtle' : 'outline'}
                            colorScheme="blue"
                            cursor="pointer"
                            onClick={() => {
                              setOrdersRange('week');
                              ordersMenu.onClose();
                            }}
                          >
                            <TagLabel>Semaine</TagLabel>
                          </Tag>
                          <Tag
                            size="sm"
                            variant={ordersRange === 'quarter' ? 'subtle' : 'outline'}
                            colorScheme="blue"
                            cursor="pointer"
                            onClick={() => {
                              setOrdersRange('quarter');
                              ordersMenu.onClose();
                            }}
                          >
                            <TagLabel>Trimestre</TagLabel>
                          </Tag>
                          <Tag
                            size="sm"
                            variant={ordersRange === 'year' ? 'subtle' : 'outline'}
                            colorScheme="blue"
                            cursor="pointer"
                            onClick={() => {
                              setOrdersRange('year');
                              ordersMenu.onClose();
                            }}
                          >
                            <TagLabel>Annuel</TagLabel>
                          </Tag>
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </Box>
              </HStack>
            </HStack>
            <Text fontSize="xs" color="gray.500" mb={4}>
              Nombre de commandes créées sur la période sélectionnée.
            </Text>
            <Box mt={2} h="200px" borderRadius="lg" overflow="hidden" bg={graphBg} px={2} py={2}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4299E1" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#4299E1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: axisTextColor }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: axisTextColor }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('fr-FR')}`, 'Commandes']}
                    labelStyle={{ fontSize: 11, color: tooltipTextColor }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorderColor}`,
                      borderRadius: 8,
                      color: tooltipTextColor,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={ordersLineColor}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#ordersGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </SimpleGrid>

        {/* Liste des commandes récentes */}
        <HStack justify="space-between" mt={2} w="100%">
          <Heading size={{ base: 'sm', md: 'md' }}>Commandes récentes</Heading>
          <Button
            as={RouterLink}
            to="/admin/orders"
            size="xs"
            colorScheme="blue"
            variant="outline"
          >
            Voir toutes les commandes
          </Button>
        </HStack>

        <Box
          maxH={{ base: 'calc(100vh - 165px)', md: 'none' }}
          overflowY={{ base: 'auto', md: 'visible' }}
          pr={{ base: 1, md: 0 }}
          w="100%"
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
            bg={cardBg}
            overflowX="auto"
            p={0}
          >
            <Table size={{ base: 'sm', md: 'md' }} variant="simple" minW="650px">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th>No</Th>
                  <Th>ID</Th>
                  <Th>Date</Th>
                  <Th>Client / Table</Th>
                  <Th isNumeric>Montant (KMF)</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {safeRecentOrders.map((order, index) => (
                  <Tr key={order.id ?? index}>
                    <Td>{index + 1}</Td>
                    <Td>{order.id}</Td>
                    <Td>{order.date}</Td>
                    <Td>{order.clientLabel}</Td>
                    <Td isNumeric>{order.amount?.toLocaleString?.() ?? ''}</Td>
                    <Td>{order.statusLabel}</Td>
                  </Tr>
                ))}
                {safeRecentOrders.length === 0 && (
                  <Tr>
                    <Td colSpan={6} textAlign="center" p={4}>
                      <Text fontSize="sm" color="gray.500">
                        Aucune commande récente.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
}

export default AdminDashboard;
