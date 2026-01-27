import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, AlertCircle } from 'lucide-react';

export default function GeoBlock({ children }) {
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCountry = async () => {
      try {
        const response = await base44.functions.invoke('checkCountry');
        
        if (!response.data.allowed) {
          setAllowed(false);
        }
      } catch (error) {
        console.error('Erro ao verificar país:', error);
        // Em caso de erro, permite acesso
      } finally {
        setLoading(false);
      }
    };

    checkCountry();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Acesso Restrito
            </h1>
            <p className="text-gray-600">
              Desculpe, nosso serviço está disponível apenas para usuários no Brasil.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" />
            <span>Região não permitida</span>
          </div>
          
          <p className="text-xs text-gray-400 pt-4 border-t">
            Se você está no Brasil e vê esta mensagem, entre em contato conosco.
          </p>
        </div>
      </div>
    );
  }

  return children;
}