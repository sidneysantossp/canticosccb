import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Video, FileText, Music, X, Download, Check, CheckCheck } from 'lucide-react';
import useCopyrightClaimsStore, { CopyrightClaim, ChatMessage } from '@/stores/copyrightClaimsStore';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyrightClaimChatProps {
  claim: CopyrightClaim;
  userRole: 'admin' | 'composer';
  userId: string;
  userName: string;
}

const CopyrightClaimChat: React.FC<CopyrightClaimChatProps> = ({ claim, userRole, userId, userName }) => {
  const { sendMessage, markMessagesAsRead, uploadAttachment } = useCopyrightClaimsStore();
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Marcar mensagens como lidas quando abrir o chat
    markMessagesAsRead(claim.id, userId);
    scrollToBottom();
  }, [claim.id, userId, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [claim.chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getFileType = (mimeType: string): ChatMessage['attachments'][0]['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'pdf';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const attachments = await Promise.all(
        selectedFiles.map(async (file) => {
          const url = await uploadAttachment(claim.id, `temp_${Date.now()}`, file);
          return {
            id: `file_${Date.now()}_${Math.random()}`,
            type: getFileType(file.type),
            url,
            name: file.name,
            size: file.size
          };
        })
      );

      sendMessage(claim.id, {
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        message: message.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        claimId: claim.id
      });

      setMessage('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + 
             date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Alert */}
      <div className="bg-amber-900/20 border-b border-amber-900/30 p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-500 mt-0.5">⚠️</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-400 mb-1">Canal Exclusivo para Direitos Autorais</h4>
            <p className="text-xs text-amber-200/80">
              Este chat é exclusivo para assuntos relacionados a direitos autorais. 
              Para outras dúvidas, acesse o menu de <strong>Suporte</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {claim.chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhuma mensagem ainda</h3>
              <p className="text-gray-400 text-sm">Inicie a conversa enviando uma mensagem</p>
            </div>
          </div>
        ) : (
          <>
            {claim.chatMessages.map((msg, index) => {
              const isOwnMessage = msg.senderId === userId;
              const showDate = index === 0 || 
                new Date(claim.chatMessages[index - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

              return (
                <div key={msg.id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-400">
                        {new Date(msg.timestamp).toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwnMessage && (
                        <span className="text-xs text-gray-400 mb-1 px-1">
                          {msg.senderRole === 'admin' ? '👨‍💼 Admin' : '🎼 ' + msg.senderName}
                        </span>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-gray-800 text-white'
                      }`}>
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`space-y-2 ${msg.message ? 'mt-2' : ''}`}>
                            {msg.attachments.map((attachment) => (
                              <div key={attachment.id}>
                                {attachment.type === 'image' ? (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  />
                                ) : attachment.type === 'video' ? (
                                  <video
                                    src={attachment.url}
                                    controls
                                    className="rounded-lg max-w-full"
                                  />
                                ) : attachment.type === 'audio' ? (
                                  <audio
                                    src={attachment.url}
                                    controls
                                    className="w-full"
                                  />
                                ) : (
                                  <a
                                    href={attachment.url}
                                    download={attachment.name}
                                    className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                                  >
                                    <FileText className="w-5 h-5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm truncate">{attachment.name}</p>
                                      <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                    </div>
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                        {isOwnMessage && (
                          <>
                            {msg.read ? (
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-500" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="border-t border-gray-700 p-3 bg-gray-900/50">
          <p className="text-xs text-gray-400 mb-2">Arquivos selecionados:</p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm"
              >
                {getFileIcon(file.type)}
                <span className="text-white max-w-[150px] truncate">{file.name}</span>
                <span className="text-gray-400 text-xs">({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-700 p-4 bg-gray-900/30">
        <div className="flex items-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-amber-500 hover:bg-amber-900/20 rounded-lg transition-colors"
            title="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
              rows={1}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          <button
            type="submit"
            disabled={(!message.trim() && selectedFiles.length === 0) || uploading}
            className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar mensagem"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CopyrightClaimChat;
