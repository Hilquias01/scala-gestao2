import React, { useState, useEffect } from 'react';
import api from '../services/api';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' },
};

// ## CORREÇÃO: Adicione 'refueling' como uma propriedade
const RefuelingFormModal = ({ isOpen, onClose, onSave, vehicleId, refueling }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    liters: '',
    price_per_liter: '',
    total_cost: '',
    vehicle_km: '',
    employee_id: '',
    vehicle_id: vehicleId,
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          const { data } = await api.get('/employees');
          setEmployees(data);
        } catch (error) {
          console.error("Falha ao carregar funcionários", error);
        }
      };
      fetchEmployees();
      
      // ## CORREÇÃO: Lógica para modo de edição
      if (refueling) {
        setFormData({
          date: refueling.date,
          liters: refueling.liters,
          price_per_liter: refueling.price_per_liter,
          total_cost: refueling.total_cost,
          vehicle_km: refueling.vehicle_km,
          employee_id: refueling.employee_id,
          vehicle_id: refueling.vehicle_id,
        });
      } else {
        // Lógica para modo de criação (limpa o formulário)
        setFormData({
          date: new Date().toISOString().split('T')[0], liters: '', price_per_liter: '', total_cost: '', vehicle_km: '', employee_id: '', vehicle_id: vehicleId
        });
      }
    }
    // ## CORREÇÃO: Adicione 'refueling' ao array de dependências
  }, [isOpen, vehicleId, refueling]);

  // Calcula o custo total automaticamente
  useEffect(() => {
    const { liters, price_per_liter } = formData;
    if (liters > 0 && price_per_liter > 0) {
      const total = (liters * price_per_liter).toFixed(2);
      setFormData(prev => ({ ...prev, total_cost: total }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.liters, formData.price_per_liter]);


  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employee_id) {
      alert('Por favor, selecione um motorista.');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        {/* ## CORREÇÃO: Título dinâmico */}
        <h2 className="form-title">{refueling ? 'Editar Lançamento' : 'Lançar Abastecimento'}</h2>
        <form onSubmit={handleSubmit}>
          {/* O resto do formulário permanece o mesmo */}
          <div className="form-group">
            <label>Data</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Motorista</label>
            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
              <option value="">Selecione um motorista</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>KM do Veículo</label>
            <input type="number" name="vehicle_km" placeholder="KM no painel" value={formData.vehicle_km} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Litros (L)</label>
            <input type="number" step="0.01" name="liters" value={formData.liters} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Preço por Litro (R$)</label>
            <input type="number" step="0.01" name="price_per_liter" value={formData.price_per_liter} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Custo Total (R$)</label>
            <input name="total_cost" value={formData.total_cost} readOnly disabled />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn">Salvar Lançamento</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefuelingFormModal;