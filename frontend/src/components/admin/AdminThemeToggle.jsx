// frontend/src/components/admin/AdminThemeToggle.jsx
import { IconButton, Icon, useColorMode } from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';

function AdminThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  const isLight = colorMode === 'light';

  return (
    <IconButton
      aria-label={isLight ? 'Activer le mode sombre' : 'Activer le mode clair'}
      size="sm"
      variant="ghost"
      icon={<Icon as={isLight ? FiMoon : FiSun} fontSize="lg" />}
      onClick={toggleColorMode}
    />
  );
}

export default AdminThemeToggle;
