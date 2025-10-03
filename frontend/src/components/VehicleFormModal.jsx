import React, { useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask'; // Import the mask component

// Estilos CSS para o modal (adicionados diretamente para simplicidade)
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
    status: 'ativo',
  });

  // useEffect para preencher o formulário quando um veículo é passado para edição
  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate,
        model: vehicle.model,
        manufacturer: vehicle.manufacturer || '',
        year: vehicle.year,
        initial_km: vehicle.initial_km,
        status: vehicle.status,
      });
    } else {
      // Limpa o formulário se não houver veículo (modo de criação)
      setFormData({
        plate: '', model: '', manufacturer: '', year: '', initial_km: '', status: 'ativo',
      });
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
            {/* ## MASK ADDED HERE ## */}
            <IMaskInput
              mask={/^[A-Z0-9]{0,7}$/}
              prepare={(str) => str.toUpperCase()}
              value={formData.plate}
              onAccept={(value) => handleChange({ target: { name: 'plate', value } })}
              placeholder="AAA0A00"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }}
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