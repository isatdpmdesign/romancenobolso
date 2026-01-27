import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Página desativada - Redireciona para o Admin
export default function ManageCarousel() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/Admin');
  }, [navigate]);

  return null;
}