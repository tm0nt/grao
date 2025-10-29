"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Award as IdCard,
  CarIcon as CardIcon,
  Plane,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

type DocumentStatus = "pending" | "approved" | "rejected" | "not_uploaded";
type DocumentType = "rg" | "cnh" | "passport";

type DocKey =
  | "rg_front"
  | "rg_back"
  | "cnh_front"
  | "cnh_back"
  | "passport"
  | "selfie"
  | "proof_address";

type DocState = {
  status: DocumentStatus;
  file: File | null;
  filePath?: string | null;
  rejectionReason?: string | null;
};

const BASE_DOCS: Array<{ key: DocKey; label: string; required: boolean; icon: any }> = [
  { key: "selfie", label: "Selfie com documento", required: true, icon: Camera },
  { key: "proof_address", label: "Comprovante de residência", required: true, icon: FileText },
];

const MAP_BY_TYPE: Record<DocumentType, Array<{ key: DocKey; label: string; required: boolean; icon: any }>> = {
  rg: [
    { key: "rg_front", label: "RG - Frente", required: true, icon: IdCard },
    { key: "rg_back", label: "RG - Verso", required: true, icon: IdCard },
  ],
  cnh: [
    { key: "cnh_front", label: "CNH - Frente", required: true, icon: CardIcon },
    { key: "cnh_back", label: "CNH - Verso", required: true, icon: CardIcon },
  ],
  passport: [{ key: "passport", label: "Passaporte", required: true, icon: Plane }],
};

function statusIcon(status: DocumentStatus) {
  if (status === "approved") return <CheckCircle className="w-4 h-4 text-[#00D9A3]" />;
  if (status === "rejected") return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "pending") return <Clock className="w-4 h-4 text-yellow-400" />;
  return <Upload className="w-4 h-4 text-gray-400" />;
}

function statusText(status: DocumentStatus) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Rejeitado";
  if (status === "pending") return "Em análise";
  return "Não enviado";
}

function statusColor(status: DocumentStatus) {
  if (status === "approved") return "text-[#00D9A3]";
  if (status === "rejected") return "text-red-400";
  if (status === "pending") return "text-yellow-400";
  return "text-gray-400";
}

export default function KYCPage() {
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [documents, setDocuments] = useState<Record<DocKey, DocState>>({
    rg_front: { status: "not_uploaded", file: null },
    rg_back: { status: "not_uploaded", file: null },
    cnh_front: { status: "not_uploaded", file: null },
    cnh_back: { status: "not_uploaded", file: null },
    passport: { status: "not_uploaded", file: null },
    selfie: { status: "not_uploaded", file: null },
    proof_address: { status: "not_uploaded", file: null },
  });
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false); // alterna entre resumo e gerenciador de envios
  const [expandList, setExpandList] = useState(false);   // expande lista de documentos no resumo

  // carrega estado atual dos documentos
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/kyc", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar KYC");
        const data = await res.json();
        const merged = { ...documents };
        for (const item of (data.items || []) as Array<{
          key: DocKey;
          status: DocumentStatus;
          filePath?: string | null;
          rejectionReason?: string | null;
        }>) {
          merged[item.key] = {
            status: item.status,
            file: null,
            filePath: item.filePath ?? null,
            rejectionReason: item.rejectionReason ?? null,
          };
        }
        if (alive) setDocuments(merged);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar KYC");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); 

  // agregados
  const counts = useMemo(() => {
    const vals = Object.values(documents);
    return {
      approved: vals.filter(v => v.status === "approved").length,
      pending: vals.filter(v => v.status === "pending").length,
      rejected: vals.filter(v => v.status === "rejected").length,
      uploaded: vals.filter(v => v.status !== "not_uploaded").length,
      total: vals.length,
    };
  }, [documents]); 

  // decide se mostra resumo ao invés do seletor
  const showSummaryInsteadOfSelector = useMemo(() => {
    // Se já enviou algo e não há rejeição, mostra resumo “aguardando aprovação”
    if (counts.uploaded > 0 && counts.rejected === 0 && !showManager) return true;
    return false;
  }, [counts, showManager]); 

  const progress = useMemo(() => {
    const requiredTotal = selectedDocType ? (MAP_BY_TYPE[selectedDocType].length + BASE_DOCS.length) : BASE_DOCS.length;
    const approved = counts.approved;
    return requiredTotal > 0 ? Math.round((approved / requiredTotal) * 100) : 0;
  }, [selectedDocType, counts]); 

  const documentFields = useMemo(() => {
    if (!selectedDocType) return BASE_DOCS;
    return [...MAP_BY_TYPE[selectedDocType], ...BASE_DOCS];
  }, [selectedDocType]); 

  const handleFileUpload = async (docKey: DocKey, file: File | null) => {
    if (!file) return;
    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
      toast.error("Envie uma imagem ou PDF válido");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 10MB");
      return;
    }

    try {
      setDocuments(prev => ({ ...prev, [docKey]: { ...prev[docKey], file, status: "pending" } }));
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docKey", docKey);

      const res = await fetch("/api/kyc/upload", { method: "POST", body: fd }); // envio multipart para Route Handler [web:294]
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Falha ao enviar documento");

      setDocuments(prev => ({
        ...prev,
        [docKey]: {
          ...prev[docKey],
          status: (j?.status as DocumentStatus) || "pending",
          filePath: j?.filePath || null,
          rejectionReason: null,
        },
      }));

      // Ao enviar com sucesso, se estava no resumo, mantém; se estava rejeitado, continua podendo reenviar
      toast.success("Documento enviado! Aguardando análise.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar documento");
    }
  }; 

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-64">
      <DesktopSidebar />

      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Verificação KYC</h1>
          <p className="text-gray-400 text-sm">Complete sua verificação de identidade para liberar todas as funcionalidades</p>
        </motion.div>

        {/* Progresso agregado */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold mb-1">Progresso da verificação</h3>
              <p className="text-gray-400 text-sm">
                {counts.approved} aprovados • {counts.pending} em análise • {counts.rejected} reprovados
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#00D9A3]">{progress}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full bg-gradient-to-r from-[#00D9A3] to-[#00b386] rounded-full" />
          </div>
        </motion.div>

        {/* Resumo ou seletor */}
        {!showManager && showSummaryInsteadOfSelector && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white font-semibold mb-2">Aguardando aprovação</h2>
                <p className="text-gray-400 text-sm">
                  {counts.pending > 0
                    ? `Há ${counts.pending} documento(s) em análise. Você será notificado quando a revisão for concluída.`
                    : counts.approved > 0
                    ? `Seus documentos enviados estão aprovados.`
                    : `Envio registrado, aguarde atualização do status.`}
                </p>
              </div>
              {counts.rejected > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">Há documento(s) reprovado(s)</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                className="text-xs text-gray-400 flex items-center gap-1 hover:text-white transition-colors"
                onClick={() => setExpandList(!expandList)}
              >
                {expandList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expandList ? "Ocultar" : "Exibir"} lista de documentos
              </button>

              <AnimatePresence>
                {expandList && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3 space-y-2">
                    {Object.entries(documents)
                      .filter(([, v]) => v.status !== "not_uploaded")
                      .map(([k, v]) => (
                        <div key={k} className="bg-[#2a2a2a] rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusIcon(v.status)}
                            <span className="text-xs text-gray-300">{k}</span>
                          </div>
                          <span className={`text-xs ${statusColor(v.status)}`}>{statusText(v.status)}</span>
                        </div>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setShowManager(true)} className="bg-[#1a1a1a] text-white hover:bg-gray-800 rounded-full border border-gray-700">
                Gerenciar envios
              </Button>
            </div>
          </motion.div>
        )}

        {/* Se houve rejeição, exibe aviso e mantém escolha de tipo */}
        {counts.rejected > 0 && !showManager && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 mb-6">
            <p className="text-sm text-red-400">
              Um ou mais documentos foram reprovados. Selecione o tipo correto e reenvi-e uma imagem legível. Você pode enviar outro tipo, se preferir. 
            </p>
            <div className="mt-3">
              <Button onClick={() => setShowManager(true)} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-full">
                Reenviar documentos
              </Button>
            </div>
          </motion.div>
        )}

        {/* Seletor e upload (Gerenciador) */}
        {(showManager || (!showSummaryInsteadOfSelector && counts.rejected === 0)) && (
          <>
            {/* Seletor de tipo */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00D9A3]" />
                  Escolha seu documento de identificação
                </h2>
                {showManager && (
                  <Button size="sm" variant="outline" className="bg-[#2a2a2a] border-gray-700 text-white hover:bg-[#333]" onClick={() => setShowManager(false)}>
                    Concluir
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["rg","cnh","passport"] as DocumentType[]).map((type) => {
                  const active = selectedDocType === type;
                  const Icon = type === "rg" ? IdCard : type === "cnh" ? CardIcon : Plane;
                  const title = type === "rg" ? "RG" : type === "cnh" ? "CNH" : "Passaporte";
                  const subtitle = type === "rg" ? "Registro Geral" : type === "cnh" ? "Carteira de Motorista" : "Documento Internacional";
                  return (
                    <motion.button key={type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedDocType(type)} className={`p-6 rounded-2xl border-2 transition-all ${
                      active ? "border-[#00D9A3] bg-[#00D9A3]/10" : "border-gray-700 bg-[#2a2a2a] hover:border-gray-600"
                    }`}>
                      <Icon className={`w-8 h-8 mx-auto mb-3 ${active ? "text-[#00D9A3]" : "text-gray-400"}`} />
                      <p className="text-white font-semibold mb-1">{title}</p>
                      <p className="text-xs text-gray-400">{subtitle}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Upload dinâmico */}
            <AnimatePresence mode="wait">
              {selectedDocType && (
                <motion.div key="document-upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: 0.1 }} className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 mb-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#00D9A3]" />
                    Envie seus documentos
                  </h2>
                  <div className="space-y-3">
                    {([...MAP_BY_TYPE[selectedDocType], ...BASE_DOCS]).map((f, index) => {
                      const doc = documents[f.key];
                      const Icon = f.icon;
                      return (
                        <motion.div key={f.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-[#2a2a2a] rounded-2xl p-4 hover:bg-[#333] transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                <Icon className="w-5 h-5 text-[#00D9A3]" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {f.label}
                                  {f.required && <span className="text-red-400 ml-1">*</span>}
                                </p>
                                <p className={`text-xs ${statusColor(doc.status)}`}>{statusText(doc.status)}</p>
                                {doc.rejectionReason && doc.status === "rejected" && (
                                  <p className="text-xs text-red-400 mt-1">Motivo: {doc.rejectionReason}</p>
                                )}
                                {doc.filePath && (
                                  <p className="text-xs text-gray-400 mt-1 break-all">Arquivo: {doc.filePath}</p>
                                )}
                              </div>
                            </div>
                            {statusIcon(doc.status)}
                          </div>

                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(f.key, e.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button className="w-full bg-[#1a1a1a] text-white hover:bg-gray-800 rounded-xl border border-gray-700 transition-all hover:border-[#00D9A3]">
                              <Upload className="w-4 h-4 mr-2" />
                              {doc.status === "not_uploaded" ? "Enviar documento" : "Reenviar documento"}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Dicas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Dicas para envio de documentos
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Certifique-se de que todos os dados estão visíveis e legíveis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Tire fotos em boa iluminação, sem reflexos ou sombras</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Documentos devem estar dentro da validade</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>A análise dos documentos leva até 48 horas úteis</span>
            </li>
          </ul>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
}
