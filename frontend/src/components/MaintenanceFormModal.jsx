import React, { useState, useEffect } from 'react';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' },
};

const MaintenanceFormModal = ({ isOpen, onClose, onSave, vehicleId, maintenance }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    vehicle_id: vehicleId,
  });

  useEffect(() => {
    if (isOpen) {
      if (maintenance) {
        setFormData({
          date: maintenance.date,
          description: maintenance.description,
          cost: maintenance.cost,
          vehicle_id: maintenance.vehicle_id,
        });
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          cost: '',
          vehicle_id: vehicleId,
        });
      }
    }
  }, [isOpen, vehicleId, maintenance]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{maintenance ? 'Editar Manutenção' : 'Lançar Manutenção'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Data</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Descrição do Serviço</label>
            <input name="description" value={formData.description} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Custo Total (R$)</label>
            <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} required />
          </div>
          {/* ## CORREÇÃO: Linha de estilo consertada */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn">Salvar Lançamento</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceFormModal;