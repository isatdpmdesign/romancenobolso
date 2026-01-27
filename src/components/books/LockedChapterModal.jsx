import React from 'react';
import { X, Lock, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { biblioteca } from '@/data/livros'; // Importa seu cardápio

export default function LockedChapterModal({ isOpen, onClose, bookTitle, bookPrice, bookId }) {
  if (!isOpen) return null;

  // --- LÓGICA DE DETETIVE REVERSA (INFALÍVEL) ---
  // 1. Pega todos os IDs que você cadastrou no livros.js
  const idsCadastrados = Object.keys(biblioteca);

  // 2. Verifica se algum desses IDs está escondido na URL do navegador
  // (Isso funciona não importa onde o ID esteja no link)
  let currentId = idsCadastrados.find(id => window.location.href.includes(id));

  // 3. Se não achou na URL, tenta usar o ID que veio por propriedade (fallback)
  if (!currentId) {
    currentId = bookId || "ID_NAO_ENCONTRADO";
  }

  // Pega o link correspondente
  const dadosLivro = biblioteca[currentId];
  const linkStripe = dadosLivro?.linkStripe;

  // Debug no console (F12)
  console.log("URL Atual:", window.location.href);
  console.log("ID Detectado:", currentId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center space-y-4 mt-2">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Você chegou ao final desta amostra!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Para continuar a leitura, adquira o livro completo <span className="font-semibold">{bookTitle}</span>
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Adquira o livro completo e tenha acesso a todos os capítulos!
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500 line-through">De R$ {((bookPrice || 6.90) * 1.5).toFixed(2)}</span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  R$ {(bookPrice || 6.90).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              
              {/* LINK DIRETO */}
              {linkStripe ? (
                <a 
                  href={linkStripe}
                  className="block w-full"
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Comprar Livro Completo
                  </Button>
                </a>
              ) : (
                /* Aviso de Erro (Só aparece se o ID não estiver no livros.js) */
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-left text-yellow-800 break-words">
                  <div className="font-bold flex items-center gap-1 mb-1">
                     <AlertTriangle className="w-4 h-4"/> ID não encontrado!
                  </div>
                  1. Verifique se o ID abaixo está no seu arquivo <code>src/data/livros.js</code>.<br/>
                  2. ID na URL: <strong>{window.location.href.split('/').pop()}</strong><br/>
                </div>
              )}

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Voltar aos Capítulos
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}