import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, X, Move, RotateCcw, Monitor, Smartphone, Bell, Play } from "lucide-react";
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CarouselItemEditor({ featured, book, onUpdate, onClose }) {
  const [formData, setFormData] = useState({
    custom_badge: featured.custom_badge || '',
    custom_description: featured.custom_description || '',
    button_type: featured.button_type || 'read_now',
    background_image: featured.background_image || book?.cover_image_hero || '',
    background_image_mobile: featured.background_image_mobile || '',
    background_position_x: featured.background_position_x ?? 50,
    background_position_y: featured.background_position_y ?? 50,
    background_position_x_mobile: featured.background_position_x_mobile ?? 50,
    background_position_y_mobile: featured.background_position_y_mobile ?? 50
  });
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [isDraggingDesktop, setIsDraggingDesktop] = useState(false);
  const [isDraggingMobile, setIsDraggingMobile] = useState(false);
  const previewDesktopRef = useRef(null);
  const previewMobileRef = useRef(null);

  const handleDesktopImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingDesktop(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, background_image: file_url });
    } catch (error) {
      alert('Erro ao enviar imagem');
    } finally {
      setIsUploadingDesktop(false);
    }
  };

  const handleMobileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingMobile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, background_image_mobile: file_url });
    } catch (error) {
      alert('Erro ao enviar imagem');
    } finally {
      setIsUploadingMobile(false);
    }
  };

  const handleDesktopMouseDown = () => setIsDraggingDesktop(true);
  const handleDesktopMouseUp = () => setIsDraggingDesktop(false);
  const handleDesktopMouseMove = (e) => {
    if (!isDraggingDesktop || !previewDesktopRef.current) return;
    const rect = previewDesktopRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFormData({
      ...formData,
      background_position_x: Math.max(0, Math.min(100, x)),
      background_position_y: Math.max(0, Math.min(100, y))
    });
  };

  const handleMobileMouseDown = () => setIsDraggingMobile(true);
  const handleMobileMouseUp = () => setIsDraggingMobile(false);
  const handleMobileMouseMove = (e) => {
    if (!isDraggingMobile || !previewMobileRef.current) return;
    const rect = previewMobileRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFormData({
      ...formData,
      background_position_x_mobile: Math.max(0, Math.min(100, x)),
      background_position_y_mobile: Math.max(0, Math.min(100, y))
    });
  };

  const handleTouchMove = (e, isMobile) => {
    const ref = isMobile ? previewMobileRef : previewDesktopRef;
    const isDragging = isMobile ? isDraggingMobile : isDraggingDesktop;
    if (!isDragging || !ref.current) return;
    
    const touch = e.touches[0];
    const rect = ref.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    if (isMobile) {
      setFormData({
        ...formData,
        background_position_x_mobile: Math.max(0, Math.min(100, x)),
        background_position_y_mobile: Math.max(0, Math.min(100, y))
      });
    } else {
      setFormData({
        ...formData,
        background_position_x: Math.max(0, Math.min(100, x)),
        background_position_y: Math.max(0, Math.min(100, y))
      });
    }
  };

  const resetDesktopPosition = () => {
    setFormData({ ...formData, background_position_x: 50, background_position_y: 50 });
  };

  const resetMobilePosition = () => {
    setFormData({ ...formData, background_position_x_mobile: 50, background_position_y_mobile: 50 });
  };

  const handleSave = () => {
    onUpdate(featured.id, formData);
    onClose();
  };

  const renderImageUploader = (type) => {
    const isMobile = type === 'mobile';
    const imageKey = isMobile ? 'background_image_mobile' : 'background_image';
    const posXKey = isMobile ? 'background_position_x_mobile' : 'background_position_x';
    const posYKey = isMobile ? 'background_position_y_mobile' : 'background_position_y';
    const isUploading = isMobile ? isUploadingMobile : isUploadingDesktop;
    const isDragging = isMobile ? isDraggingMobile : isDraggingDesktop;
    const previewRef = isMobile ? previewMobileRef : previewDesktopRef;
    const handleUpload = isMobile ? handleMobileImageUpload : handleDesktopImageUpload;
    const handleMouseDown = isMobile ? handleMobileMouseDown : handleDesktopMouseDown;
    const handleMouseUp = isMobile ? handleMobileMouseUp : handleDesktopMouseUp;
    const handleMouseMove = isMobile ? handleMobileMouseMove : handleDesktopMouseMove;
    const resetPosition = isMobile ? resetMobilePosition : resetDesktopPosition;
    const aspectRatio = isMobile ? 'aspect-[9/16]' : 'aspect-[16/9]';
    const sizeHint = isMobile ? '800x1200px (vertical)' : '1920x800px (horizontal)';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile ? <Smartphone className="w-4 h-4 text-gray-500" /> : <Monitor className="w-4 h-4 text-gray-500" />}
            <label className="text-sm font-medium text-gray-700">
              {isMobile ? 'Imagem Mobile' : 'Imagem Desktop'}
            </label>
          </div>
          {formData[imageKey] && (
            <Button variant="ghost" size="sm" onClick={resetPosition} className="text-gray-500">
              <RotateCcw className="w-4 h-4 mr-1" />
              Centralizar
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          Tamanho recomendado: <span className="font-medium">{sizeHint}</span>
        </p>

        {formData[imageKey] ? (
          <div className="space-y-3">
            <div 
              ref={previewRef}
              className={`relative ${aspectRatio} ${isMobile ? 'max-w-[200px] mx-auto' : 'w-full'} rounded-xl overflow-hidden border-2 border-dashed border-gray-300 cursor-move select-none`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={(e) => handleTouchMove(e, isMobile)}
              onTouchEnd={handleMouseUp}
            >
              <div 
                className="absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `url(${formData[imageKey]})`,
                  backgroundPosition: `${formData[posXKey]}% ${formData[posYKey]}%`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div 
                className="absolute w-8 h-8 border-2 border-white rounded-full shadow-lg pointer-events-none flex items-center justify-center"
                style={{
                  left: `${formData[posXKey]}%`,
                  top: `${formData[posYKey]}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <Move className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs bg-[#FF0864] px-2 py-1 rounded-full">
                  {formData.custom_badge || 'Destaque'}
                </span>
                <h3 className="text-sm font-bold mt-2 truncate">{book?.title}</h3>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <Move className="w-4 h-4" />
              Arraste para ajustar posição
            </p>

            <label className="block">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
              <Button variant="outline" asChild className="w-full" disabled={isUploading}>
                <span>
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Trocar Imagem
                </span>
              </Button>
            </label>
          </div>
        ) : (
          <label className="block">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
            <div className={`${aspectRatio} ${isMobile ? 'max-w-[200px] mx-auto' : 'w-full'} rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#3065DF] hover:bg-[#E8EEFB]/30 transition-colors`}>
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-[#3065DF] animate-spin mb-2" />
                  <p className="text-sm text-gray-600">Enviando...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 text-center px-2">Clique para enviar</p>
                  <p className="text-xs text-gray-500 mt-1">{sizeHint}</p>
                </>
              )}
            </div>
          </label>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Destaque</h2>
            <p className="text-sm text-gray-500">{book?.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Tabs */}
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile
              </TabsTrigger>
            </TabsList>
            <TabsContent value="desktop" className="mt-4">
              {renderImageUploader('desktop')}
            </TabsContent>
            <TabsContent value="mobile" className="mt-4">
              {renderImageUploader('mobile')}
              {!formData.background_image_mobile && formData.background_image && (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg mt-3">
                  ⚠️ Sem imagem mobile, será usada a imagem desktop (pode não ficar ideal em celulares)
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Button Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tipo de Botão</Label>
            <Select value={formData.button_type} onValueChange={(value) => setFormData({ ...formData, button_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read_now">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Ler Agora (livro publicado)
                  </div>
                </SelectItem>
                <SelectItem value="notify_launch">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Receber Aviso (lançamento futuro)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {formData.button_type === 'notify_launch' 
                ? '⚠️ Usuários serão notificados quando o livro for publicado'
                : 'Usuários poderão ler o livro imediatamente'}
            </p>
          </div>

          {/* Badge */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Badge</label>
            <Input
              value={formData.custom_badge}
              onChange={(e) => setFormData({ ...formData, custom_badge: e.target.value })}
              placeholder="Ex: Novo Lançamento, Mais Vendido"
            />
          </div>

          {/* Custom Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Descrição personalizada</label>
              <span className="text-xs text-gray-500">{formData.custom_description.length}/180</span>
            </div>
            <Textarea
              value={formData.custom_description}
              onChange={(e) => setFormData({ ...formData, custom_description: e.target.value })}
              placeholder="Deixe em branco para usar a descrição do livro"
              rows={3}
              maxLength={180}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-[#FF0864] hover:bg-[#D10050]">
            Salvar Alterações
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}