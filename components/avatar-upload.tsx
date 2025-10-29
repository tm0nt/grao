"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatar?: string;            // ex.: "/<userId>/avatar.png"
  onAvatarChange: (avatar: string) => void; // retorna o path salvo, ex.: "/<userId>/avatar.png"
  userName: string;
}

export function AvatarUpload({ currentAvatar, onAvatarChange, userName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // inicializa preview com o path atual (se existir)
  useEffect(() => {
    if (currentAvatar && typeof currentAvatar === "string" && currentAvatar.length > 0) {
      setPreview(currentAvatar);
    } else {
      setPreview(null);
    }
  }, [currentAvatar]); // garante exibição do avatar salvo no servidor [web:108]

  const validateFile = (file: File | null) => {
    if (!file) return { ok: false, msg: "Arquivo inválido" };
    if (!file.type.startsWith("image/")) return { ok: false, msg: "Por favor, selecione uma imagem válida" };
    if (file.size > 5 * 1024 * 1024) return { ok: false, msg: "A imagem deve ter no máximo 5MB" };
    return { ok: true as const };
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: fd,
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Falha ao enviar avatar");

      // j.avatar é um path público como "/<userId>/avatar.png"
      if (typeof j?.avatar === "string" && j.avatar.length > 0) {
        setPreview(j.avatar);
        onAvatarChange(j.avatar);
        toast.success("Foto atualizada com sucesso!");
      } else {
        throw new Error("Resposta sem path de avatar");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar avatar");
    } finally {
      setIsUploading(false);
    }
  }; // envia FormData para a rota do App Router e usa o path retornado para exibir a imagem [web:324][web:108]

  const handleFileChange = (file: File | null) => {
    const v = validateFile(file);
    if (!v.ok) {
      toast.error(v.msg);
      return;
    }
    if (file) {
      // opcional: preview otimista local
      const temp = URL.createObjectURL(file);
      setPreview(temp);
      uploadFile(file).finally(() => {
        // libera o object URL após upload (evita leak)
        URL.revokeObjectURL(temp);
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeAvatar = () => {
    setPreview(null);
    onAvatarChange(""); // o backend pode interpretar string vazia como "manter" ou "limpar" conforme a sua regra
    toast.success("Foto removida");
  }; // mantém apenas o path no estado/servidor, sem base64, seguindo a decisão de salvar só o caminho [web:108]

  const getInitials = () =>
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div
          className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${
            isDragging ? "border-[#00D9A3] shadow-lg shadow-[#00D9A3]/50" : "border-gray-800 hover:border-[#00D9A3]/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#00D9A3]/20 to-[#00D9A3]/5 flex items-center justify-center">
              <span className="text-3xl font-bold text-[#00D9A3]">{getInitials()}</span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {(isHovering || isUploading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-sm"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <Camera className={`w-8 h-8 ${isUploading ? "text-gray-400 animate-pulse" : "text-white"}`} />
            </motion.div>
          )}
        </AnimatePresence>

        {preview && !isUploading && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={removeAvatar}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="bg-[#2a2a2a] border-gray-700 text-white hover:bg-[#333] hover:border-[#00D9A3] transition-all"
        disabled={isUploading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? "Enviando..." : preview ? "Alterar foto" : "Adicionar foto"}
      </Button>

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Arraste uma imagem ou clique para fazer upload. Máximo 5MB.
      </p>
    </div>
  );
}
