import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false, // Não refaz queries ao montar componente novamente se dados estão em cache
			retry: 1,
			staleTime: 2 * 60 * 1000, // Dados considerados "frescos" por 2 minutos por padrão
			gcTime: 5 * 60 * 1000, // Mantém em cache por 5 minutos por padrão
		},
	},
});