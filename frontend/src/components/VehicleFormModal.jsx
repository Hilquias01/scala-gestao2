import React, { useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask'; // Usando a biblioteca de máscara correta

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
  },
};

const VehicleFormModal = ({ isOpen, onClose, onSave, vehicle }) => {
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    manufacturer: '',
    year: '',
    initial_km: '',
    renavam: '', // 1. Adicionado o campo Renavam no estado inicial
    status: 'ativo',
  });

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        // Preenche o formulário para edição
        setFormData({
          plate: vehicle.plate,
          model: vehicle.model,
          manufacturer: vehicle.manufacturer || '',
          year: vehicle.year,
          initial_km: vehicle.initial_km,
          renavam: vehicle.renavam || '', // 2. Preenche o Renavam existente
          status: vehicle.status,
        });
      } else {
        // Limpa o formulário para criação
        setFormData({
          plate: '', model: '', manufacturer: '', year: '', initial_km: '', renavam: '', status: 'ativo',
        });
      }
    }
  }, [vehicle, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{vehicle ? 'Editar Veículo' : 'Adicionar Novo Veículo'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Placa</label>
            <IMaskInput
              mask={/^[A-Z0-9]{0,7}$/}
              prepare={(str) => str.toUpperCase()}
              value={formData.plate}
              onAccept={(value) => handleChange({ target: { name: 'plate', value } })}
              placeholder="AAA0A00"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div className="form-group">
            <label>Modelo</label>
            <input name="model" value={formData.model} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Fabricante</label>
            <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
          </div>

          {/* 3. Campo Renavam adicionado ao formulário */}
          <div className="form-group">
            <label>Renavam (11 dígitos)</label>
            <input 
              type="text" 
              name="renavam" 
              value={formData.renavam} 
              onChange={handleChange} 
              maxLength="11" 
            />
          </div>

          <div className="form-group">
            <label>Ano</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>KM Inicial</label>
            <input type="number" step="0.01" name="initial_km" value={formData.initial_km} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="manutencao">Em Manutenção</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleFormModal;