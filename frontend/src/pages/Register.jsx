// frontend/src/pages -- Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    InputGroup,
    InputRightElement,
    IconButton
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Register() {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [telephone, setTelephone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/auth/register`, {
                nom,
                prenom,
                email,
                password,
                telephone,
            });

            toast({
                title: 'Inscription réussie',
                description: `Bienvenue ${res.data?.user?.prenom || ''} !`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });

            navigate('/login');
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
            toast({
                title: 'Erreur',
                description: message,
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxW="md" py={10}>
            <VStack as="form" spacing={6} align="stretch" onSubmit={handleSubmit}>
                <Heading size="lg" textAlign="center">
                    Inscription
                </Heading>

                <FormControl isRequired>
                    <FormLabel>Nom</FormLabel>
                    <Input
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Prénom</FormLabel>
                    <Input
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Téléphone</FormLabel>
                    <Input
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Mot de passe</FormLabel>
                    <InputGroup>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                                icon={showPassword ? <FaEye /> : <FaEyeSlash />}
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowPassword((prev) => !prev)}
                            />
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                >
                    S'inscrire
                </Button>

                <Box textAlign="center">
                    <Text fontSize="sm">
                        Déjà un compte ?{' '}
                        <Button as={Link} to="/login" variant="link" colorScheme="blue">
                            Se connecter
                        </Button>
                    </Text>
                </Box>
            </VStack>
        </Container>
    );
}

export default Register;