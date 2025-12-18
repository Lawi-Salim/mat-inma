// frontend/src/components/admin/MenuManagement.jsx
import { useEffect, useRef, useState } from 'react';

import {
  Box, Heading,
  Text, VStack,
  HStack, Button,
  Tag, TagLabel,
  Table, Thead,
  Tbody, Tr,
  Th, Td,
  Badge, Spacer,
  Select, FormControl,
  FormLabel, Input,
  NumberInput, NumberInputField,
  Switch, Modal,
  ModalOverlay, ModalContent,
  ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton,
  useColorModeValue, IconButton,
  Image, SimpleGrid,
  Icon,
} from '@chakra-ui/react';

import { FaPenAlt, FaTrash, FaPlus } from 'react-icons/fa';
import { FiCoffee, FiGrid } from 'react-icons/fi';

import { useAppToast } from '../../hooks/useAppToast';

const API_BASE_URL = 'http://localhost:5000/api/menu';

function MenuManagement() {
  const { showSuccess, showError } = useAppToast();

  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newDish, setNewDish] = useState({
    name: '',
    categoryId: '',
    price: '',
    available: true,
    description: '',
    imageUrl: '',
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editDish, setEditDish] = useState({
    id: '',
    name: '',
    categoryId: '',
    price: '',
    available: true,
    description: '',
    imageUrl: '',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);

  const newDishFileInputRef = useRef(null);
  const editDishFileInputRef = useRef(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesRes, platsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/plats`),
        ]);

        if (!categoriesRes.ok || !platsRes.ok) {
          throw new Error('Erreur lors du chargement du menu.');
        }

        const categoriesData = await categoriesRes.json();
        const platsData = await platsRes.json();

        setCategories(categoriesData);

        const mappedDishes = platsData.map((plat) => ({
          id: plat.id,
          name: plat.nom,
          categoryId: plat.categorie_id,
          price: Number(plat.prix),
          available: plat.disponible,
          description: plat.description || '',
          imageUrl: plat.image_url || '',
        }));

        setDishes(mappedDishes);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Erreur inattendue.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = () => {
    setNewDish({
      name: '',
      categoryId: '',
      price: '',
      available: true,
      description: '',
      imageUrl: '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openCategoryModal = () => {
    setNewCategory({ name: '', description: '' });
    setError(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  const openEditModal = (dish) => {
    setEditDish({
      id: dish.id,
      name: dish.name,
      categoryId: dish.categoryId || '',
      price: dish.price.toString(),
      available: dish.available,
      description: dish.description || '',
      imageUrl: dish.imageUrl || '',
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const openDeleteModal = (dish) => {
    setDishToDelete(dish);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleSubmitNewDish = async (e) => {
    e.preventDefault();
    if (!newDish.name || !newDish.price || !newDish.imageUrl) {
      setError('Nom, prix et image sont obligatoires.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const body = {
        nom: newDish.name,
        description: newDish.description || null,
        prix: Number(newDish.price),
        categorie_id: newDish.categoryId || null,
        disponible: newDish.available,
        image_url: newDish.imageUrl || null,
      };

      const res = await fetch(`${API_BASE_URL}/plats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la création du plat.");
      }

      const created = await res.json();

      const mapped = {
        id: created.id,
        name: created.nom,
        categoryId: created.categorie_id,
        price: Number(created.prix),
        available: created.disponible,
        description: created.description || '',
        imageUrl: created.image_url || '',
      };

      setDishes((prev) => [...prev, mapped]);
      closeModal();
      showSuccess('Plat ajouté', `Le plat "${mapped.name}" a été ajouté.`);
    } catch (err) {
      console.error(err);
      const message = err.message || 'Erreur lors de la création du plat.';
      setError(message);
      showError('Erreur', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEditDish = async (e) => {
    e.preventDefault();
    if (!editDish.name || !editDish.price || !editDish.imageUrl) {
      setError('Nom, prix et image sont obligatoires.');
      return;
    }

    try {
      setIsEditSubmitting(true);
      setError(null);

      const body = {
        nom: editDish.name,
        description: editDish.description || null,
        prix: Number(editDish.price),
        categorie_id: editDish.categoryId || null,
        disponible: editDish.available,
        image_url: editDish.imageUrl || null,
      };

      const res = await fetch(`${API_BASE_URL}/plats/${editDish.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du plat.');
      }

      const updated = await res.json();

      setDishes((prev) =>
        prev.map((d) =>
          d.id === updated.id
            ? {
                id: updated.id,
                name: updated.nom,
                categoryId: updated.categorie_id,
                price: Number(updated.prix),
                available: updated.disponible,
                description: updated.description || '',
                imageUrl: updated.image_url || '',
              }
            : d
        )
      );

      closeEditModal();
      showSuccess('Plat modifié', `Le plat "${updated.nom}" a été mis à jour.`);
    } catch (err) {
      console.error(err);
      const message = err.message || 'Erreur lors de la mise à jour du plat.';
      setError(message);
      showError('Erreur', message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleConfirmDeleteDish = async () => {
    if (!dishToDelete) return;

    try {
      setIsDeleteSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/plats/${dishToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression du plat.');
      }

      setDishes((prev) => prev.filter((d) => d.id !== dishToDelete.id));
      showSuccess('Plat supprimé', `Le plat "${dishToDelete.name}" a été supprimé.`);
      closeDeleteModal();
      setDishToDelete(null);
    } catch (err) {
      console.error(err);
      const message = err.message || 'Erreur lors de la suppression du plat.';
      setError(message);
      showError('Erreur', message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleSubmitNewCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }

    try {
      setIsCategorySubmitting(true);
      setError(null);

      const body = {
        nom: newCategory.name,
        description: newCategory.description || null,
      };

      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la création de la catégorie.");
      }

      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      closeCategoryModal();
      showSuccess('Catégorie ajoutée', `La catégorie "${created.nom}" a été ajoutée.`);
    } catch (err) {
      console.error(err);
      const message = err.message || 'Erreur lors de la création de la catégorie.';
      setError(message);
      showError('Erreur', message);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const filteredDishes =
    categoryFilter === 'ALL'
      ? dishes
      : dishes.filter((dish) => dish.categoryId === categoryFilter);

  const categoriesById = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.nom;
    return acc;
  }, {});

  const readImageFile = (file, setStateFn) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setStateFn((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleNewDishImageChange = (e) => {
    const file = e.target.files[0];
    readImageFile(file, setNewDish);
  };

  const handleEditDishImageChange = (e) => {
    const file = e.target.files[0];
    readImageFile(file, setEditDish);
  };

  const handleNewDishDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    readImageFile(file, setNewDish);
  };

  const handleEditDishDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    readImageFile(file, setEditDish);
  };

  const preventDefaultDrag = (e) => {
    e.preventDefault();
  };

  return (
    <Box p={0} m={0}>
      <VStack align="flex-start" spacing={4}>
        <Heading size={{ base: 'sm', md: 'md' }}>Gestion du menu</Heading>

        <HStack w="100%" spacing={4} align="center">
          <Tag
            size="md"
            variant="subtle"
            colorScheme="teal"
            display={{ base: 'none', md: 'inline-flex' }}
          >
            <TagLabel>{dishes.length} plats</TagLabel>
          </Tag>

          <Select
            size="sm"
            maxW={{ base: '165px', md: '180px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            h={{ base: '24px', md: '32px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nom}
              </option>
            ))}
          </Select>

          <Spacer />

          <HStack spacing={2}>
            <Button 
              size={{ base: 'xs', md: 'sm' }}
              fontSize={{ base: 'xs', md: 'sm' }} 
              colorScheme="teal" 
              variant="outline" 
              onClick={openCategoryModal}
            >
              <HStack spacing={1}>
                <Icon as={FaPlus} boxSize={{ base: 3, md: 4 }} />
                <Icon as={FiGrid} boxSize={{ base: 3, md: 0 }} display={{ base: 'inline-flex', md: 'none' }} />
                <Text display={{ base: 'none', md: 'inline' }}>
                  Ajouter une catégorie
                </Text>
              </HStack>
            </Button>
            <Button 
              size={{ base: 'xs', md: 'sm' }}
              fontSize={{ base: 'xs', md: 'sm' }}
              colorScheme="teal" 
              variant="solid" 
              onClick={openModal}
            >
              <HStack spacing={1}>
                <Icon as={FaPlus} boxSize={{ base: 3, md: 4 }} />
                <Icon as={FiCoffee} boxSize={{ base: 3, md: 0 }} display={{ base: 'inline-flex', md: 'none' }} />
                <Text display={{ base: 'none', md: 'inline' }}>
                  Ajouter un plat
                </Text>
              </HStack>
            </Button>
          </HStack>
        </HStack>

        

        <Box w="100%">
          <HStack justify="space-between" mb={3} px={1}>
            <Heading size={{ base: 'sm', md: 'md' }}>Liste du menu</Heading>
            <HStack spacing={3}>
              {error && (
                <Text fontSize="sm" color="red.400">
                  {error}
                </Text>
              )}
              {isLoading && (
                <Text fontSize="sm" color="gray.500">
                  Chargement du menu...
                </Text>
              )}
            </HStack>
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
              fontSize="xs"
            >
              <Table size={{ base: 'sm', md: 'md' }} variant="simple" minW="650px">
                <Thead bg={tableHeaderBg}>
                  <Tr>
                    <Th>Nom</Th>
                    <Th>Catégorie</Th>
                    <Th isNumeric>Prix (KMF)</Th>
                    <Th>Statut</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredDishes.map((dish) => (
                    <Tr key={dish.id} _hover={{ bg: rowHoverBg }}>
                      <Td>
                        <HStack spacing={3}>
                          {dish.imageUrl && (
                            <Image
                              src={dish.imageUrl}
                              alt={dish.name}
                              boxSize="32px"
                              borderRadius="md"
                              objectFit="cover"
                            />
                          )}
                          <Text>{dish.name}</Text>
                        </HStack>
                      </Td>

                      <Td>{categoriesById[dish.categoryId] || '—'}</Td>
                      <Td isNumeric>{dish.price.toLocaleString()}</Td>

                      <Td>
                        <Badge
                          colorScheme={dish.available ? 'green' : 'red'}
                          variant="subtle"
                        >
                          {dish.available ? 'Disponible' : 'Rupture'}
                        </Badge>
                      </Td>
                      <Td textAlign="right">
                        <HStack spacing={2} justify="flex-end">
                          <IconButton
                            size="xs"
                            aria-label="Modifier le plat"
                            icon={<FaPenAlt />}
                            variant="outline"
                            colorScheme="gray"
                            onClick={() => openEditModal(dish)}
                          />
                          <IconButton
                            size="xs"
                            aria-label="Supprimer le plat"
                            icon={<FaTrash />}
                            colorScheme="red"
                            variant="solid"
                            onClick={() => openDeleteModal(dish)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                  {filteredDishes.length === 0 && (
                    <Tr>
                      <Td colSpan={5} textAlign="center" p={4}>
                        <Text fontSize="sm" color="gray.500">
                          Aucun plat pour ce filtre.
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Box>

        <Modal isOpen={isModalOpen} onClose={closeModal} isCentered>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmitNewDish}>
            <ModalHeader>
              <Heading size={{ base: 'sm', md: 'md' }}>Ajouter un plat</Heading>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Nom du plat</FormLabel>
                    <Input
                      size="sm"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      value={newDish.name}
                      onChange={(e) =>
                        setNewDish((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Catégorie</FormLabel>
                    <Select
                      size="sm"
                      maxW={{ base: '165px', md: '180px' }}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      h={{ base: '24px', md: '32px' }}
                      placeholder="Choisir une catégorie"
                      value={newDish.categoryId}
                      onChange={(e) =>
                        setNewDish((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Prix (KMF)</FormLabel>
                  <NumberInput
                    size="sm"
                    min={0}
                    value={newDish.price}
                    onChange={(valueString) =>
                      setNewDish((prev) => ({ ...prev, price: valueString }))
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Description</FormLabel>
                  <Input
                    size="sm"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    value={newDish.description}
                    onChange={(e) =>
                      setNewDish((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Image du plat</FormLabel>

                  <Box
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderRadius="md"
                    p={3}
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => newDishFileInputRef.current?.click()}
                    onDrop={handleNewDishDrop}
                    onDragOver={preventDefaultDrag}
                    onDragEnter={preventDefaultDrag}
                  >
                    <Input
                      ref={newDishFileInputRef}
                      type="file"
                      accept="image/*"
                      display="none"
                      onChange={handleNewDishImageChange}
                    />
                    {newDish.imageUrl ? (
                      <Image
                        src={newDish.imageUrl}
                        alt={newDish.name || 'Aperçu du plat'}
                        boxSize="75px"
                        borderRadius="md"
                        objectFit="cover"
                        mx="auto"
                      />
                    ) : (
                      <Text fontSize="sm" color="gray.400">
                        Glissez-déposez une image ici ou cliquez pour choisir un fichier
                      </Text>
                    )}
                  </Box>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0" fontSize={{ base: 'xs', md: 'sm' }}>Disponible</FormLabel>
                  <Switch
                    isChecked={newDish.available}
                    onChange={(e) =>
                      setNewDish((prev) => ({ ...prev, available: e.target.checked }))
                    }
                    colorScheme="teal"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="ghost" 
                mr={3} 
                onClick={closeModal} 
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                Annuler
              </Button>
              <Button
                colorScheme="teal"
                type="submit"
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
                isLoading={isSubmitting}
              >
                Enregistrer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} isCentered>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmitEditDish}>
            <ModalHeader>
              <Heading size={{ base: 'sm', md: 'md' }}>Modifier le plat</Heading>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Nom du plat</FormLabel>
                    <Input
                      size="sm"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      value={editDish.name}
                      onChange={(e) =>
                        setEditDish((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Catégorie</FormLabel>
                    <Select
                      size="sm"
                      maxW={{ base: '165px', md: '180px' }}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      h={{ base: '24px', md: '32px' }}
                      placeholder="Choisir une catégorie"
                      value={editDish.categoryId}
                      onChange={(e) =>
                        setEditDish((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Prix (KMF)</FormLabel>
                  <NumberInput
                    size="sm"
                    min={0}
                    value={editDish.price}
                    onChange={(valueString) =>
                      setEditDish((prev) => ({ ...prev, price: valueString }))
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Description</FormLabel>
                  <Input
                    size="sm"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    value={editDish.description}
                    onChange={(e) =>
                      setEditDish((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Image du plat</FormLabel>

                  <Box
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderRadius="md"
                    p={3}
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => editDishFileInputRef.current?.click()}
                    onDrop={handleEditDishDrop}
                    onDragOver={preventDefaultDrag}
                    onDragEnter={preventDefaultDrag}
                  >
                    <Input
                      ref={editDishFileInputRef}
                      type="file"
                      accept="image/*"
                      display="none"
                      onChange={handleEditDishImageChange}
                    />
                    {editDish.imageUrl ? (
                      <Image
                        src={editDish.imageUrl}
                        alt={editDish.name || 'Aperçu du plat'}
                        boxSize="75px"
                        borderRadius="md"
                        objectFit="cover"
                        mx="auto"
                      />
                    ) : (
                      <Text fontSize="sm" color="gray.400">
                        Glissez-déposez une image ici ou cliquez pour choisir un fichier
                      </Text>
                    )}
                  </Box>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0" fontSize={{ base: 'xs', md: 'sm' }}>Disponible</FormLabel>
                  <Switch
                    isChecked={editDish.available}
                    onChange={(e) =>
                      setEditDish((prev) => ({ ...prev, available: e.target.checked }))
                    }
                    colorScheme="teal"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="ghost" 
                mr={3} 
                onClick={closeEditModal} 
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                Annuler
              </Button>
              <Button
                colorScheme="teal"
                type="submit"
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
                isLoading={isEditSubmitting}
              >
                Enregistrer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal} isCentered>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmitNewCategory}>
            <ModalHeader>
              <Heading size={{ base: 'sm', md: 'md' }}>Ajouter une catégorie</Heading>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Nom de la catégorie</FormLabel>
                  <Input
                    size="sm"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>Description</FormLabel>
                  <Input
                    size="sm"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="ghost" 
                mr={3} 
                onClick={closeCategoryModal} 
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                Annuler
              </Button>
              <Button
                colorScheme="teal"
                type="submit"
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: 'xs', md: 'sm' }}
                isLoading={isCategorySubmitting}
              >
                Enregistrer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}

export default MenuManagement;