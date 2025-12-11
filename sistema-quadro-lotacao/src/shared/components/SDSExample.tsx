import React, { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { FormField, Input, Select, Textarea } from './Form';
import { useToast } from './Toast';
import { Loading } from './Loading';

const SDSExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { showToast } = useToast();

  const departmentOptions = [
    { value: 'ti', label: 'Tecnologia da Informação' },
    { value: 'rh', label: 'Recursos Humanos' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'comercial', label: 'Comercial' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.department) {
      newErrors.department = 'Departamento é obrigatório';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Mensagem é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Erro de Validação',
        message: 'Por favor, corrija os erros no formulário'
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', department: '', message: '' });
      
      showToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Formulário enviado com sucesso',
        action: {
          label: 'Ver detalhes',
          onClick: () => console.log('Ver detalhes clicado')
        }
      });
    }, 2000);
  };

  const showDifferentToasts = () => {
    showToast({
      type: 'info',
      title: 'Informação',
      message: 'Esta é uma notificação informativa'
    });
    
    setTimeout(() => {
      showToast({
        type: 'warning',
        title: 'Atenção',
        message: 'Esta é uma notificação de aviso'
      });
    }, 500);
    
    setTimeout(() => {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Esta é uma notificação de erro'
      });
    }, 1000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--sds-gray-900)' }}>
        Senior Design System - Componentes
      </h1>
      
      {/* Buttons Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--sds-gray-800)' }}>Botões</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="info">Info</Button>
          <Button variant="outline">Outline</Button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button 
            icon={<span>📧</span>} 
            iconPosition="left"
          >
            Com Ícone
          </Button>
        </div>
      </section>

      {/* Modal Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--sds-gray-800)' }}>Modal</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Abrir Modal
        </Button>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Exemplo de Modal"
          size="md"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button 
                variant="secondary" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                loading={isLoading}
              >
                Enviar
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormField
              label="Nome"
              required
              error={errors.name}
            >
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome"
                error={!!errors.name}
                fullWidth
              />
            </FormField>
            
            <FormField
              label="Email"
              required
              error={errors.email}
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite seu email"
                error={!!errors.email}
                fullWidth
                leftIcon={<span>📧</span>}
              />
            </FormField>
            
            <FormField
              label="Departamento"
              required
              error={errors.department}
            >
              <Select
                options={departmentOptions}
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Selecione um departamento"
                error={!!errors.department}
                fullWidth
              />
            </FormField>
            
            <FormField
              label="Mensagem"
              required
              error={errors.message}
              hint="Descreva sua solicitação em detalhes"
            >
              <Textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Digite sua mensagem"
                error={!!errors.message}
                fullWidth
                rows={4}
              />
            </FormField>
          </div>
        </Modal>
      </section>

      {/* Toast Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--sds-gray-800)' }}>Notificações Toast</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={showDifferentToasts}>
            Mostrar Toasts
          </Button>
          <Button 
            variant="success"
            onClick={() => showToast({
              type: 'success',
              message: 'Operação realizada com sucesso!'
            })}
          >
            Success Toast
          </Button>
        </div>
      </section>

      {/* Loading Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--sds-gray-800)' }}>Loading States</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Spinner</h3>
            <Loading variant="spinner" size="md" text="Carregando..." />
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Dots</h3>
            <Loading variant="dots" size="md" text="Processando..." />
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Pulse</h3>
            <Loading variant="pulse" size="md" text="Aguarde..." />
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Skeleton</h3>
            <Loading variant="skeleton" size="md" />
          </div>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <Button 
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 3000);
            }}
          >
            Mostrar Loading Overlay
          </Button>
          
          {isLoading && (
            <Loading 
              variant="spinner" 
              size="lg" 
              text="Processando solicitação..." 
              overlay 
            />
          )}
        </div>
      </section>

      {/* Form Components Section */}
      <section>
        <h2 style={{ marginBottom: '1rem', color: 'var(--sds-gray-800)' }}>Componentes de Formulário</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <FormField label="Input Padrão" hint="Digite qualquer texto">
              <Input placeholder="Texto aqui..." fullWidth />
            </FormField>
            
            <FormField label="Input com Ícone">
              <Input 
                placeholder="Buscar..." 
                leftIcon={<span>🔍</span>}
                fullWidth 
              />
            </FormField>
            
            <FormField label="Select">
              <Select
                options={departmentOptions}
                placeholder="Escolha uma opção"
                fullWidth
              />
            </FormField>
          </div>
          
          <div>
            <FormField label="Textarea">
              <Textarea
                placeholder="Digite uma mensagem longa..."
                rows={4}
                fullWidth
              />
            </FormField>
            
            <FormField label="Input com Erro" error="Este campo é obrigatório">
              <Input 
                placeholder="Campo obrigatório" 
                error 
                fullWidth 
              />
            </FormField>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SDSExample;