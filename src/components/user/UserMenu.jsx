import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Shield, HelpCircle } from "lucide-react";

export default function UserMenu({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/'); 
  };

  if (!user) {
    return (
      <Button
        onClick={() => navigate('/login')}
        className="bg-[#FF0864] hover:bg-[#D10050]"
      >
        Entrar
      </Button>
    );
  }

  // Verifica se é a dona (Admin)
  const isAdmin = user.isAdmin === true;

  const displayName = user.user_metadata?.full_name || user.full_name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url || user.avatar;
  const initial = (displayName || "U").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#FFE5EE]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center text-white font-medium">
              {initial}
            </div>
          )}
          <span className="hidden md:block max-w-[150px] truncate">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b">
          <p className="font-medium truncate">{displayName}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        
        <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))} className="whitespace-nowrap">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate(createPageUrl('Support'))} className="whitespace-nowrap">
          <HelpCircle className="w-4 h-4 mr-2" />
          Ajuda e Suporte
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin')} className="text-purple-600 font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Painel Admin
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}