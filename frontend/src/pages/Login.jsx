// frontend/src/pages -- Login.jsx
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

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            if (res.data?.token) {
                localStorage.setItem('token', res.data.token);
            }

            const role = res.data?.user?.role;

            toast({
                title: 'Connexion réussie',
                description: `Bienvenue ${res.data?.user?.prenom || ''} !`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });

            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'employe') {
                navigate('/employe/commandes');
            } else {
                navigate('/client/menu');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la connexion';
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
                    Connexion
                </Heading>

                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                    Se connecter
                </Button>

                <Box textAlign="center">
                    <Text fontSize="sm">
                        Pas encore de compte ?{' '}
                        <Button as={Link} to="/register" variant="link" colorScheme="blue">
                            S'inscrire
                        </Button>
                    </Text>
                </Box>
            </VStack>
        </Container>
    );
}

export default Login;