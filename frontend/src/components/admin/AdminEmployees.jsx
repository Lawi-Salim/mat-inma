// frontend/src/components/admin/AdminEmployees.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  Spinner,
  Tag,
  TagLabel,
  Select,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  InputGroup,
  InputRightElement,
  Icon,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaPlus } from 'react-icons/fa';
import { FiGrid, FiUsers } from 'react-icons/fi';
import { useAppToast } from '../../hooks/useAppToast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function AdminEmployees() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  const { showError, showSuccess } = useAppToast();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [showPassword, setShowPassword] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/employes`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des employés.");
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      const message = err.message || "Erreur lors du chargement des employés.";
      showError('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nom, prenom, email, password } = form;
    if (!nom || !prenom || !email || !password) {
      showError('Champs requis', 'Nom, prénom, email et mot de passe sont obligatoires.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/employes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Erreur lors de la création de l'employé.");
      }

      const created = await res.json();
      setEmployees((prev) => [created, ...prev]);
      setForm({ nom: '', prenom: '', email: '', telephone: '', password: '' });
      showSuccess('Employé créé', "Le nouvel employé a été ajouté avec succès.");
    } catch (err) {
      console.error(err);
      const message = err.message || "Erreur lors de la création de l'employé.";
      showError('Erreur', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (employee) => {
    try {
      setTogglingId(employee.id);
      const res = await fetch(`${API_BASE_URL}/admin/employes/${employee.id}/actif`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !employee.actif }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Erreur lors de la mise à jour de l'employé.");
      }

      const updated = await res.json();
      setEmployees((prev) => prev.map((emp) => (emp.id === updated.id ? updated : emp)));
      showSuccess('Employé mis à jour', `Le compte de ${updated.prenom} ${updated.nom} a été ${updated.actif ? 'activé' : 'désactivé'}.`);
    } catch (err) {
      console.error(err);
      const message = err.message || "Erreur lors de la mise à jour de l'employé.";
      showError('Erreur', message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Box>
      <Heading size={{ base: 'sm', md: 'md' }} mb={4}> Gestion des employés</Heading>
      <Box mb={4}>
        <HStack w="100%" spacing={4} align="center">
          <Tag
            size="md"
            variant="subtle"
            colorScheme="teal"
            display={{ base: 'none', md: 'inline-flex' }}
          >
            <TagLabel>{employees.length} employés</TagLabel>
          </Tag>

          <Select
            size="sm"
            maxW={{ base: '165px', md: '180px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            h={{ base: '24px', md: '32px' }}
            placeholder="Tous les rôles"
            isDisabled
          >
            <option value="employe">Employés</option>
          </Select>

          <Spacer />

          <HStack spacing={2}>
            <Button 
              size={{ base: 'xs', md: 'sm' }}
              fontSize={{ base: 'xs', md: 'sm' }}
              colorScheme="teal" 
              variant="outline" 
              isDisabled
            >
              <HStack spacing={1}>
                <Icon as={FaPlus} boxSize={{ base: 3, md: 4 }} />
                <Icon
                  as={FiGrid}
                  boxSize={{ base: 3, md: 0 }}
                  display={{ base: 'inline-flex', md: 'none' }}
                />
                <Text display={{ base: 'none', md: 'inline' }}>
                  Ajouter un rôle
                </Text>
              </HStack>
            </Button>
            <Button 
              size={{ base: 'xs', md: 'sm' }}
              fontSize={{ base: 'xs', md: 'sm' }}
              colorScheme="teal" 
              variant="solid" 
              onClick={onOpen}
            >
              <HStack spacing={1}>
                <Icon as={FaPlus} boxSize={{ base: 3, md: 4 }} />
                <Icon
                  as={FiUsers}
                  boxSize={{ base: 3, md: 0 }}
                  display={{ base: 'inline-flex', md: 'none' }}
                />
                <Text display={{ base: 'none', md: 'inline' }}>
                  Ajouter un employé
                </Text>
              </HStack>
            </Button>
          </HStack>
        </HStack>
      </Box>

      <Box>
        <HStack justify="space-between" mb={3}>
          <Heading size={{ base: 'sm', md: 'md' }}>Liste des employés</Heading>
          {error && (
            <Text fontSize="sm" color="red.400">
                {error}
            </Text>
          )}
          {isLoading && (
            <HStack spacing={2} color={subtleText}>
              <Spinner size="sm" />
              <Text fontSize="xs">Chargement...</Text>
            </HStack>
          )}
        </HStack>

        <Box 
          w="100%" 
          borderWidth="1px" 
          borderRadius="md" 
          overflowX="auto" 
          bg={cardBg}
          fontSize="xs"
        >
            <Table size="sm" variant="simple">
                <Thead bg={tableHeaderBg}>
                    <Tr>
                    <Th>Nom</Th>
                    <Th>Prénom</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th>Statut</Th>
                    <Th isNumeric>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {employees.map((emp) => (
                        <Tr key={emp.id} _hover={{ bg: rowHoverBg }}>
                            <Td>{emp.nom}</Td>
                            <Td>{emp.prenom}</Td>
                            <Td>{emp.email}</Td>
                            <Td>{emp.telephone || '—'}</Td>
                            <Td>
                                <Badge colorScheme={emp.actif ? 'green' : 'red'}>
                                    {emp.actif ? 'Actif' : 'Inactif'}
                                </Badge>
                            </Td>
                            <Td isNumeric>
                                <Button
                                    size={{ base: 'xs', md: 'sm' }}
                                    fontSize={{ base: 'xs', md: 'sm' }}
                                    variant="outline"
                                    colorScheme={emp.actif ? 'red' : 'green'}
                                    onClick={() => handleToggleActive(emp)}
                                    isLoading={togglingId === emp.id}
                                >
                                    {emp.actif ? 'Désactiver' : 'Activer'}
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                    {employees.length === 0 && !isLoading && (
                        <Tr>
                            <Td colSpan={6} textAlign="center" p={4}>
                                <Text fontSize="sm" color={subtleText}>
                                    Aucun employé pour l'instant.
                                </Text>
                            </Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>
        </Box>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading size={{ base: 'sm', md: 'md' }}>
              Ajouter un employé
            </Heading>
          </ModalHeader>
          <ModalCloseButton />
          <form
            onSubmit={(e) => {
              handleSubmit(e);
              if (!isSubmitting) {
                onClose();
              }
            }}
          >
            <ModalBody>
              <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 2, md: 3 }}>
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Nom</FormLabel>
                    <Input
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      size="sm"
                      fontSize={{ base: 'xs', md: 'sm' }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Prénom</FormLabel>
                    <Input
                      name="prenom"
                      value={form.prenom}
                      onChange={handleChange}
                      size="sm"
                      fontSize={{ base: 'xs', md: 'sm' }}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl isRequired>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    size="sm"
                    fontSize={{ base: 'xs', md: 'sm' }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Téléphone</FormLabel>
                  <Input
                    name="telephone"
                    value={form.telephone}
                    onChange={handleChange}
                    size="sm"
                    fontSize={{ base: 'xs', md: 'sm' }}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Mot de passe</FormLabel>
                  <InputGroup size="sm">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      fontSize={{ base: 'xs', md: 'sm' }}
                    />
                    <InputRightElement h="full">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Text fontSize="xs" color={subtleText}>
                  Tous les comptes créés ici sont des employés (Grade A/B selon l&apos;organisation interne), avec le rôle système <strong>employe</strong>.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={2}>
                <Button 
                  variant="ghost" 
                  size={{ base: 'xs', md: 'sm' }}
                  fontSize={{ base: 'xs', md: 'sm' }}
                  onClick={onClose}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="teal" 
                  size={{ base: 'xs', md: 'sm' }}
                  fontSize={{ base: 'xs', md: 'sm' }}   
                  isLoading={isSubmitting}
                >
                  Ajouter
                </Button>
              </HStack>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AdminEmployees;
