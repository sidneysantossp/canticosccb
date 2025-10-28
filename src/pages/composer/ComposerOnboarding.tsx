import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { categoriasApi, compositorGerentesApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContextMock';
import { apiFetch } from '@/lib/api-helper';
import {
  Music,
  Users,
  Image as ImageIcon,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Upload,
  User,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Mic2,
  Eye,
  EyeOff
} from 'lucide-react';

interface OnboardingData {
  composerType: 'solo' | 'group' | 'orchestra' | '';
  name: string;
  artisticName: string;
  bio: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  website: string;
  instagram: string;
  facebook: string;
  youtube: string;
  avatar: string | null;
  coverImage: string | null;
  genres: string[];
  documentType: 'rg' | 'passport' | 'cnh' | '';
  documentFront: File | null;
  documentBack: File | null;
  acceptedTerms: boolean;
  // Gerenciamento de conta
  hasManager: boolean;
  managerEmail: string;
  managerData: { id: number; nome: string; email: string; avatar_url?: string } | null;
}

const ComposerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    composerType: '',
    name: '',
    artisticName: '',
    bio: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    website: '',
    instagram: '',
    facebook: '',
    youtube: '',
    avatar: null,
    coverImage: null,
    genres: [],
    documentType: '',
    documentFront: null,
    documentBack: null,
    acceptedTerms: false,
    hasManager: false,
    managerEmail: '',
    managerData: null
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [cepFilled, setCepFilled] = useState(false);
  const [dragActiveFront, setDragActiveFront] = useState(false);
  const [dragActiveBack, setDragActiveBack] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [validatingDocument, setValidatingDocument] = useState(false);
  const [documentValidation, setDocumentValidation] = useState<{
    valid: boolean;
    extracted_name?: string;
    similarity?: number;
    error?: string;
  } | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [searchingManager, setSearchingManager] = useState(false);
  const [managerSearchError, setManagerSearchError] = useState('');

  const totalSteps = 7;

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

  // Carregar categorias do banco de dados
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingGenres(true);
        console.log('🎵 [Onboarding] Carregando categorias...');
        const response = await categoriasApi.list();
        console.log('🎵 [Onboarding] Resposta API:', response);
        const categories = response.data?.items || response.data || [];
        const categoriesArray = Array.isArray(categories) ? categories : [];
        console.log('🎵 [Onboarding] Categorias processadas:', categoriesArray);
        const genreNames = categoriesArray.map((cat: any) => cat.nome);
        console.log('🎵 [Onboarding] Gêneros:', genreNames);
        
        if (genreNames.length > 0) {
          setAvailableGenres(genreNames);
        } else {
          console.warn('⚠️ [Onboarding] Nenhuma categoria no banco, usando fallback');
          setAvailableGenres([
            'Hinos Clássicos',
            'Louvor',
            'Adoração',
            'Instrumental',
            'Coral',
            'Oração',
            'Evangélico',
            'Contemporâneo'
          ]);
        }
      } catch (error) {
        console.error('❌ [Onboarding] Erro ao carregar categorias:', error);
        // Fallback para categorias padrão
        setAvailableGenres([
          'Hinos Clássicos',
          'Louvor',
          'Adoração',
          'Instrumental',
          'Coral',
          'Oração',
          'Evangélico',
          'Contemporâneo'
        ]);
      } finally {
        setLoadingGenres(false);
      }
    };

    loadCategories();
  }, []);

  const brazilianStates = [
    { uf: 'AC', name: 'Acre' },
    { uf: 'AL', name: 'Alagoas' },
    { uf: 'AP', name: 'Amapá' },
    { uf: 'AM', name: 'Amazonas' },
    { uf: 'BA', name: 'Bahia' },
    { uf: 'CE', name: 'Ceará' },
    { uf: 'DF', name: 'Distrito Federal' },
    { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' },
    { uf: 'MA', name: 'Maranhão' },
    { uf: 'MT', name: 'Mato Grosso' },
    { uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'MG', name: 'Minas Gerais' },
    { uf: 'PA', name: 'Pará' },
    { uf: 'PB', name: 'Paraíba' },
    { uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' },
    { uf: 'PI', name: 'Piauí' },
    { uf: 'RJ', name: 'Rio de Janeiro' },
    { uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'RS', name: 'Rio Grande do Sul' },
    { uf: 'RO', name: 'Rondônia' },
    { uf: 'RR', name: 'Roraima' },
    { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' },
    { uf: 'SE', name: 'Sergipe' },
    { uf: 'TO', name: 'Tocantins' }
  ];

  const documentTypes = [
    { value: 'rg', label: 'RG - Registro Geral' },
    { value: 'passport', label: 'Passaporte' },
    { value: 'cnh', label: 'CNH - Carteira de Motorista' }
  ];

  const composerTypes = [
    {
      id: 'solo',
      title: 'Artista Solo',
      description: 'Compositor ou cantor individual',
      icon: User
    },
    {
      id: 'group',
      title: 'Grupo',
      description: 'Conjunto ou grupo musical',
      icon: Users
    },
    {
      id: 'orchestra',
      title: 'Orquestra/Coral',
      description: 'Grande conjunto musical',
      icon: Mic2
    }
  ];

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    }
    if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    handleInputChange('phone', formatted);
  };

  const handleNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    handleInputChange('number', cleaned);
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    handleInputChange('cep', formatted);
    
    const cleanCep = formatted.replace(/\D/g, '');
    setCepFilled(cleanCep.length === 8);
    
    if (cleanCep.length === 8) {
      searchCep(formatted);
    }
  };

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setCepError('CEP deve conter 8 dígitos');
      return;
    }

    setLoadingCep(true);
    setCepError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        setLoadingCep(false);
        setCepFilled(false);
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }));

      setCepFilled(true);

      // Focar no campo número após buscar o CEP
      setTimeout(() => {
        const numberInput = document.getElementById('number-input');
        if (numberInput) {
          numberInput.focus();
        }
      }, 100);

      setLoadingCep(false);
    } catch (error) {
      setCepError('Erro ao buscar CEP');
      setLoadingCep(false);
      setCepFilled(false);
    }
  };

  const searchManager = async (email: string) => {
    if (!email || !email.includes('@')) {
      setManagerSearchError('Digite um email válido');
      return;
    }

    setSearchingManager(true);
    setManagerSearchError('');

    try {
      const response = await compositorGerentesApi.buscarUsuario(email);
      
      if (response.error || !response.data) {
        setManagerSearchError('Usuário não encontrado com este email');
        setFormData(prev => ({ ...prev, managerData: null }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          managerData: response.data 
        }));
        setManagerSearchError('');
      }
    } catch (error) {
      console.error('Erro ao buscar gerente:', error);
      setManagerSearchError('Erro ao buscar usuário. Tente novamente.');
      setFormData(prev => ({ ...prev, managerData: null }));
    } finally {
      setSearchingManager(false);
    }
  };

  const validateDocumentFile = (file: File): { valid: boolean; error?: string } => {
    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 5MB.' };
    }

    // Validar tipo MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Formato inválido. Use JPG, PNG ou WEBP.' };
    }

    // Validar extensão do arquivo (segurança adicional)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Extensão de arquivo inválida.' };
    }

    return { valid: true };
  };

  const handleFileUpload = async (file: File, type: 'front' | 'back') => {
    const validation = validateDocumentFile(file);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (type === 'front') {
      setFormData(prev => ({ ...prev, documentFront: file }));
      
      // OCR DESABILITADO TEMPORARIAMENTE - Validação manual pelo admin
      console.log('ℹ️ Validação OCR desabilitada. Documento será revisado pelo admin.');
      setDocumentValidation({
        valid: true,
        extracted_name: 'Validação manual',
        similarity: 100,
        error: undefined
      });
    } else {
      setFormData(prev => ({ ...prev, documentBack: file }));
    }
  };

  const validateDocumentWithOCR = async (file: File) => {
    if (!formData.name || !formData.documentType) {
      console.log('Nome ou tipo de documento não definido, pulando validação OCR');
      return;
    }

    setValidatingDocument(true);
    setDocumentValidation(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('document', file);
      formDataToSend.append('expected_name', formData.name);
      formDataToSend.append('doc_type', formData.documentType);

      // Usando proxy do Vite - /api redireciona automaticamente
      const apiUrl = '/api/validate-document-simple.php';
      
      console.log('🌐 Usando proxy Vite - URL:', apiUrl);
      console.log('📦 FormData:', {
        hasDocument: formDataToSend.has('document'),
        expectedName: formDataToSend.get('expected_name'),
        docType: formDataToSend.get('doc_type')
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formDataToSend,
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const text = await response.text();
      console.log('📝 Response text:', text);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('❌ Erro ao parsear JSON:', e);
        console.log('📄 Texto recebido:', text);
        throw new Error('Resposta inválida da API');
      }

      console.log('✅ Result parsed:', result);
      setDocumentValidation(result);

      if (!result.valid && result.similarity < 60) {
        alert(
          `⚠️ ATENÇÃO: O nome no documento não corresponde ao cadastrado.\n\n` +
          `Nome esperado: ${result.expected_name}\n` +
          `Nome encontrado: ${result.extracted_name}\n` +
          `Similaridade: ${result.similarity}%\n\n` +
          `Verifique se o nome cadastrado está correto ou envie outro documento.`
        );
      }

      console.log('✅ Validação OCR:', result);
    } catch (error: any) {
      console.error('❌ Erro na validação OCR:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Não bloquear usuário se OCR falhar
      setDocumentValidation({
        valid: false,
        error: error.message || 'Não foi possível validar o documento automaticamente. Será revisado manualmente.'
      });
    } finally {
      setValidatingDocument(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'front' | 'back') => {
    e.preventDefault();
    if (type === 'front') {
      setDragActiveFront(false);
    } else {
      setDragActiveBack(false);
    }
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (type: 'front' | 'back') => {
    if (type === 'front') {
      setDragActiveFront(true);
    } else {
      setDragActiveBack(true);
    }
  };

  const handleDragLeave = (type: 'front' | 'back') => {
    if (type === 'front') {
      setDragActiveFront(false);
    } else {
      setDragActiveBack(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setCheckingEmail(true);
    try {
      const response = await apiFetch('api/usuarios/check-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setEmailExists(data.exists || false);
    } catch (error) {
      console.error('Erro ao verificar email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Função auxiliar para converter File para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFinish = async () => {
    // Verificar email duplicado antes de enviar
    if (emailExists) {
      alert('❌ Este email já está cadastrado! Use outro email ou faça login.');
      setSubmitError('Este email já está cadastrado');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 1. Converter documentos para base64
      const documents = [];
      if (formData.documentFront && formData.documentBack && formData.documentType) {
        const frontBase64 = await fileToBase64(formData.documentFront);
        const backBase64 = await fileToBase64(formData.documentBack);
        
        documents.push({
          type: formData.documentType,
          frontImage: frontBase64,
          backImage: backBase64
        });
      }
      
      // 2. Registrar compositor na API (usando proxy do Vite)
      console.log('🚀 Registrando compositor em: /api/compositores/register.php');
      
      const registerResponse = await apiFetch('api/compositores/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          artisticName: formData.artisticName,
          bio: formData.bio,
          composerType: formData.composerType,
          phone: formData.phone,
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          website: formData.website,
          instagram: formData.instagram,
          facebook: formData.facebook,
          youtube: formData.youtube,
          genres: formData.genres,
          documents: documents
        }),
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Erro ao criar conta');
      }
      
      console.log('\u2705 Compositor registrado:', registerData);
      
      // 2. Enviar convite ao gerente (se configurado)
      if (formData.hasManager && formData.managerData && registerData.compositor_id) {
        try {
          console.log('📧 Enviando convite ao gerente:', formData.managerData.email);
          const inviteResponse = await compositorGerentesApi.convidar({
            compositor_id: registerData.compositor_id,
            email_gerente: formData.managerData.email,
            notas: `Convite automático enviado durante o cadastro do compositor ${formData.artisticName}`
          });
          
          if (!inviteResponse.error) {
            console.log('✅ Convite enviado com sucesso ao gerente');
          }
        } catch (error) {
          console.error('⚠️ Erro ao enviar convite ao gerente:', error);
          // Não bloquear o cadastro se o convite falhar
        }
      }
      
      // 3. Fazer login automático
      console.log('🔑 Fazendo login automático...');
      await signIn(formData.email, formData.password);
      
      // 3. Aguardar um pouco para garantir que a autenticação foi processada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. Redirecionar para o dashboard de compositor
      // O ProtectedComposerRoute vai mostrar a mensagem "Perfil em Análise"
      console.log('✅ Login concluído, redirecionando para dashboard de compositor...');
      navigate('/composer/dashboard');
      
    } catch (error: any) {
      console.error('\u274c Erro no cadastro:', error);
      const errorMessage = error.message || 'Erro ao finalizar cadastro. Tente novamente.';
      
      // Mostrar alert para garantir que o usuário veja
      alert(`❌ ${errorMessage}`);
      
      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.composerType !== '';
      case 2:
        return formData.name && formData.artisticName && formData.bio;
      case 3:
        // Validar email, senha e endereço
        const emailValid = formData.email && formData.email.includes('@') && !emailExists;
        const passwordValid = formData.password && formData.password.length >= 6;
        const passwordMatch = formData.password === formData.passwordConfirm;
        const addressValid = formData.cep && formData.street && formData.number && formData.city && formData.state;
        
        if (!emailValid || !passwordValid || !passwordMatch || !addressValid) {
          return false;
        }
        return true;
      case 5:
        return formData.documentType !== '' && formData.documentFront !== null && formData.documentBack !== null && formData.acceptedTerms;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-primary-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Bem-vindo ao Painel de Compositor
            </h1>
            <p className="text-text-muted text-lg mb-8">
              Configure seu perfil artístico e comece a compartilhar suas composições com milhares de ouvintes
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background-secondary p-6 rounded-xl">
                <Music className="w-8 h-8 text-primary-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Publique Hinos</h3>
                <p className="text-text-muted text-sm">
                  Compartilhe suas composições com o mundo
                </p>
              </div>
              <div className="bg-background-secondary p-6 rounded-xl">
                <Users className="w-8 h-8 text-primary-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Conecte-se</h3>
                <p className="text-text-muted text-sm">
                  Alcance milhares de ouvintes fiéis
                </p>
              </div>
              <div className="bg-background-secondary p-6 rounded-xl">
                <CheckCircle className="w-8 h-8 text-primary-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Analytics</h3>
                <p className="text-text-muted text-sm">
                  Acompanhe suas estatísticas em tempo real
                </p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Qual tipo de compositor você é?
            </h2>
            <p className="text-text-muted text-center mb-8">
              Escolha a opção que melhor descreve você
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {composerTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleInputChange('composerType', type.id)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      formData.composerType === type.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-700 bg-background-secondary hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-12 h-12 mx-auto mb-4 ${
                      formData.composerType === type.id ? 'text-primary-400' : 'text-text-muted'
                    }`} />
                    <h3 className="text-white font-semibold mb-2">{type.title}</h3>
                    <p className="text-text-muted text-sm">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Informações do Perfil
            </h2>
            <p className="text-text-muted text-center mb-8">
              Conte-nos mais sobre você ou seu grupo
            </p>
            <div className="bg-background-secondary rounded-xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome ou nome do grupo"
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Nome Artístico *
                </label>
                <input
                  type="text"
                  value={formData.artisticName}
                  onChange={(e) => handleInputChange('artisticName', e.target.value)}
                  placeholder="Como você será conhecido"
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Biografia *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Conte sua história, inspirações e experiência musical..."
                  rows={5}
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-text-muted text-sm mt-2">
                  {formData.bio.length}/500 caracteres
                </p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Gêneros Musicais
                </label>
                {loadingGenres ? (
                  <p className="text-gray-400">Carregando gêneros...</p>
                ) : availableGenres.length === 0 ? (
                  <p className="text-yellow-400">⚠️ Nenhum gênero disponível. Entre em contato com o suporte.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          formData.genres.includes(genre)
                            ? 'bg-primary-500 text-black'
                            : 'bg-background-tertiary text-white hover:bg-gray-700'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Gerenciamento de Conta */}
              <div className="border-t border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasManager"
                      checked={formData.hasManager}
                      onChange={(e) => {
                        handleInputChange('hasManager', e.target.checked);
                        if (!e.target.checked) {
                          handleInputChange('managerEmail', '');
                          handleInputChange('managerData', null);
                          setManagerSearchError('');
                        }
                      }}
                      className="w-5 h-5 rounded bg-background-tertiary border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="hasManager" className="text-white font-medium cursor-pointer">
                      Minha conta será gerenciada por outra pessoa
                    </label>
                  </div>
                  {formData.hasManager && (
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('hasManager', false);
                        handleInputChange('managerEmail', '');
                        handleInputChange('managerData', null);
                        setManagerSearchError('');
                      }}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Remover gerente
                    </button>
                  )}
                </div>
                
                {formData.hasManager && (
                  <div className="bg-background-tertiary p-4 rounded-lg space-y-4">
                    <p className="text-text-muted text-sm">
                      Digite o email do gerente de conta. Ele receberá uma notificação e precisará aceitar para gerenciar seu perfil.
                    </p>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Email do Gerente de Conta
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={formData.managerEmail}
                          onChange={(e) => handleInputChange('managerEmail', e.target.value)}
                          onBlur={(e) => {
                            const email = e.target.value.trim();
                            if (email && email.includes('@')) {
                              searchManager(email);
                            }
                          }}
                          placeholder="gerente@email.com"
                          className="flex-1 px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => searchManager(formData.managerEmail)}
                          disabled={searchingManager || !formData.managerEmail}
                          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                        >
                          {searchingManager ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>
                      
                      {managerSearchError && (
                        <p className="text-red-400 text-sm mt-2">
                          {managerSearchError}
                        </p>
                      )}
                      
                      {formData.managerData && (
                        <div className="mt-4 p-4 bg-background-secondary border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            {formData.managerData.avatar_url ? (
                              <img
                                src={formData.managerData.avatar_url}
                                alt={formData.managerData.nome}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white font-medium">{formData.managerData.nome}</p>
                              <p className="text-text-muted text-sm">{formData.managerData.email}</p>
                            </div>
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="text-green-400 text-sm mt-2">
                            ✓ Usuário encontrado! Um convite será enviado após o cadastro.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Informações de Contato e Endereço
            </h2>
            <p className="text-text-muted text-center mb-8">
              Adicione seu endereço completo para contato
            </p>
            <div className="bg-background-secondary rounded-xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange('email', e.target.value);
                      setEmailExists(false);
                    }}
                    onBlur={(e) => checkEmailExists(e.target.value)}
                    placeholder="seu@email.com"
                    className={`w-full pl-10 pr-4 py-3 bg-background-tertiary border rounded-lg text-white focus:outline-none focus:ring-2 ${
                      emailExists 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-700 focus:ring-primary-500'
                    }`}
                  />
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {emailExists && (
                  <p className="text-red-400 text-sm mt-2">
                    ❌ Este email já está cadastrado. Use outro email ou <a href="/login" className="underline hover:text-red-300">faça login</a>.
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 pr-12 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formData.password && formData.password.length < 6 && (
                    <p className="text-red-400 text-sm mt-1">
                      Senha deve ter no mínimo 6 caracteres
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      value={formData.passwordConfirm}
                      onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                      placeholder="Digite a senha novamente"
                      className="w-full px-4 py-3 pr-12 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formData.password && formData.passwordConfirm && 
                   formData.password !== formData.passwordConfirm && (
                    <p className="text-red-400 text-sm mt-1">
                      As senhas não coincidem
                    </p>
                  )}
                  {formData.password && formData.passwordConfirm && 
                   formData.password === formData.passwordConfirm && 
                   formData.password.length >= 6 && (
                    <p className="text-green-400 text-sm mt-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Senhas conferem
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-white font-semibold mb-4">Endereço</h3>
                
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {loadingCep && (
                    <p className="text-primary-400 text-sm mt-1">Buscando CEP...</p>
                  )}
                  {cepError && (
                    <p className="text-red-400 text-sm mt-1">{cepError}</p>
                  )}
                </div>

                {cepFilled && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Rua/Avenida *
                      </label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        placeholder="Nome da rua"
                        className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Número *
                        </label>
                        <input
                          id="number-input"
                          type="text"
                          value={formData.number}
                          onChange={(e) => handleNumberChange(e.target.value)}
                          placeholder="123"
                          inputMode="numeric"
                          className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Complemento
                        </label>
                        <input
                          type="text"
                          value={formData.complement}
                          onChange={(e) => handleInputChange('complement', e.target.value)}
                          placeholder="Apto, Bloco, etc."
                          className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        placeholder="Bairro"
                        className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-white font-medium mb-2">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Cidade"
                          className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          UF *
                        </label>
                        <select
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Selecione</option>
                          {brazilianStates.map(state => (
                            <option key={state.uf} value={state.uf}>
                              {state.uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Redes Sociais
            </h2>
            <p className="text-text-muted text-center mb-8">
              Conecte suas redes sociais (opcional)
            </p>
            <div className="bg-background-secondary rounded-xl p-8 space-y-4">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://seusite.com"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="@seuinstagram"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  placeholder="facebook.com/seuperfil"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  placeholder="youtube.com/@seucanal"
                  className="w-full pl-10 pr-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Verificação de Identidade
            </h2>
            <p className="text-text-muted text-center mb-8">
              Envie uma foto do seu documento para verificação
            </p>
            <div className="bg-background-secondary rounded-xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleInputChange('documentType', e.target.value)}
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione o tipo de documento</option>
                  {documentTypes.map(doc => (
                    <option key={doc.value} value={doc.value}>
                      {doc.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.documentType && (
                <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Frente do Documento *
                    </label>
                    <div
                      onDrop={(e) => handleDrop(e, 'front')}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter('front')}
                      onDragLeave={() => handleDragLeave('front')}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActiveFront
                          ? 'border-primary-400 bg-primary-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {formData.documentFront ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                          <p className="text-white font-medium">{formData.documentFront.name}</p>
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, documentFront: null }))}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 text-text-muted mx-auto" />
                          <p className="text-white">Arraste a foto aqui</p>
                          <p className="text-text-muted text-sm">ou</p>
                          <label className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
                            Escolher arquivo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'front');
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Verso do Documento *
                    </label>
                    <div
                      onDrop={(e) => handleDrop(e, 'back')}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter('back')}
                      onDragLeave={() => handleDragLeave('back')}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActiveBack
                          ? 'border-primary-400 bg-primary-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {formData.documentBack ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                          <p className="text-white font-medium">{formData.documentBack.name}</p>
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, documentBack: null }))}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 text-text-muted mx-auto" />
                          <p className="text-white">Arraste a foto aqui</p>
                          <p className="text-text-muted text-sm">ou</p>
                          <label className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
                            Escolher arquivo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'back');
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback de Validação OCR */}
              {validatingDocument && (
                <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full"></div>
                    <span className="text-primary-400">Validando documento com OCR...</span>
                  </div>
                </div>
              )}

              {documentValidation && !validatingDocument && (
                <div className={`mt-6 p-4 rounded-lg ${
                  documentValidation.valid 
                    ? 'bg-green-500/10 border border-green-500/30'
                    : documentValidation.similarity && documentValidation.similarity >= 60
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {documentValidation.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {documentValidation.valid ? (
                        <>
                          <p className="text-green-400 font-medium mb-1">
                            ✅ Documento validado com sucesso!
                          </p>
                          <p className="text-green-400/80 text-sm">
                            Nome encontrado: {documentValidation.extracted_name}
                          </p>
                          <p className="text-green-400/60 text-xs mt-1">
                            Confiança: {documentValidation.similarity}%
                          </p>
                        </>
                      ) : documentValidation.similarity && documentValidation.similarity >= 60 ? (
                        <>
                          <p className="text-yellow-400 font-medium mb-1">
                            ⚠️ Documento será revisado manualmente
                          </p>
                          <p className="text-yellow-400/80 text-sm">
                            Nome esperado: {formData.name}
                          </p>
                          <p className="text-yellow-400/80 text-sm">
                            Nome encontrado: {documentValidation.extracted_name}
                          </p>
                          <p className="text-yellow-400/60 text-xs mt-1">
                            Similaridade: {documentValidation.similarity}% (Admin irá verificar)
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-medium mb-1">
                            ❌ {documentValidation.error || 'Documento não corresponde'}
                          </p>
                          {documentValidation.extracted_name && (
                            <>
                              <p className="text-red-400/80 text-sm">
                                Nome esperado: {formData.name}
                              </p>
                              <p className="text-red-400/80 text-sm">
                                Nome encontrado: {documentValidation.extracted_name}
                              </p>
                              {documentValidation.similarity && (
                                <p className="text-red-400/60 text-xs mt-1">
                                  Similaridade: {documentValidation.similarity}%
                                </p>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-700 pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => handleInputChange('acceptedTerms', e.target.checked)}
                    className="mt-1 w-5 h-5 bg-background-tertiary border-gray-700 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-text-muted">
                    Eu li e concordo com os{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      Termos e Condições
                    </Link>
                    {' '}da plataforma
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Confirmação
            </h2>
            <p className="text-text-muted text-center mb-8">
              Revise suas informações antes de finalizar
            </p>
            <div className="bg-background-secondary rounded-xl p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4 pb-6 border-b border-gray-700">
                  <div className="w-20 h-20 bg-background-tertiary rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {formData.artisticName || 'Nome Artístico'}
                    </h3>
                    <p className="text-text-muted mb-2">{formData.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Biografia</h4>
                  <p className="text-text-muted">{formData.bio || 'Nenhuma biografia fornecida'}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Tipo</h4>
                    <p className="text-text-muted">
                      {composerTypes.find(t => t.id === formData.composerType)?.title}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Endereço</h4>
                    <p className="text-text-muted">{formData.street}, {formData.number} - {formData.city}/{formData.state}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Contato</h4>
                  <p className="text-text-muted">{formData.email}</p>
                  {formData.phone && (
                    <p className="text-text-muted">{formData.phone}</p>
                  )}
                </div>

                {(formData.website || formData.instagram || formData.facebook || formData.youtube) && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Redes Sociais</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.website && (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                          Website
                        </a>
                      )}
                      {formData.instagram && (
                        <span className="text-text-muted">Instagram: {formData.instagram}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-primary-400 text-sm text-center">
                  ✓ Ao finalizar, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-primary py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Botão Voltar para Home */}
        {currentStep === 0 && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <Home className="w-5 h-5" />
            <span>Voltar para início</span>
          </Link>
        )}

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index <= currentStep
                      ? 'bg-primary-500 text-black'
                      : 'bg-background-secondary text-text-muted'
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="w-6 h-6" /> : index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-background-secondary">
                    <div
                      className={`h-full transition-all duration-300 ${
                        index < currentStep ? 'bg-primary-500' : 'bg-background-secondary'
                      }`}
                      style={{ width: index < currentStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center">
            <p className="text-text-muted">
              Etapa {currentStep + 1} de {totalSteps}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-12">{renderStep()}</div>

        {/* Mensagem de Erro */}
        {submitError && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-center">{submitError}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 0 || isSubmitting
                ? 'bg-background-secondary text-text-muted cursor-not-allowed'
                : 'bg-background-secondary text-white hover:bg-background-hover'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                !isStepValid() || isSubmitting
                  ? 'bg-gray-700 text-text-muted cursor-not-allowed'
                  : 'bg-primary-500 text-black hover:bg-primary-400'
              }`}
            >
              Próximo
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Finalizar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComposerOnboarding;
