// frontend/src/hooks/useAppToast.js
import { useToast } from '@chakra-ui/react';

// Hook centralisé pour les toasts de l'application
export function useAppToast() {
  const toast = useToast();

  const showSuccess = (title, description) => {
    toast({
      title,
      description,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const showError = (title, description) => {
    toast({
      title,
      description,
      status: 'error',
      duration: 4000,
      isClosable: true,
      position: 'top-right',
    });
  };

  return {
    showSuccess,
    showError,
  };
}
