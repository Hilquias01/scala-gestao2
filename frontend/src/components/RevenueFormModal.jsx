import React, { useState, useEffect } from 'react';
import api from '../services/api';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' },
};

const RevenueFormModal = ({ isOpen, onClose, onSave, revenue }) => {
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', vehicle_id: '', employee_id: '' });
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]); // State para os funcionários

  useEffect(() => {
    if (isOpen) {
      // Busca veículos E funcionários quando o modal abre
      const fetchData = async () => {
        try {
          const [vehiclesRes, employeesRes] = await Promise.all([
            api.get('/vehicles'),
            api.get('/employees')
          ]);
          setVehicles(vehiclesRes.data);
          setEmployees(employeesRes.data);
        } catch (error) { console.error("Falha ao carregar dados", error); }
      };
      fetchData();
    }
    
    if (revenue) {
      setFormData({ date: revenue.date, description: revenue.description, amount: revenue.amount, vehicle_id: revenue.vehicle_id || '', employee_id: revenue.employee_id || '' });
    } else {
      setFormData({ date: new Date().toISOString().split('T')[0], description: '', amount: '', vehicle_id: '', employee_id: '' });
    }
  }, [revenue, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employee_id) { // Validação
      alert('Por favor, selecione o funcionário responsável.');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{revenue ? 'Editar Receita' : 'Adicionar Nova Receita'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Data</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
          <div className="form-group"><label>Descrição</label><input name="description" value={formData.description} onChange={handleChange} required /></div>
          <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required /></div>
           <div className="form-group">
            <label>Funcionário Responsável</label>
            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
              <option value="">Selecione um funcionário</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Vincular a um Veículo (Opcional)</label>
            <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange}>
              <option value="">Nenhum</option>
              {vehicles.map(v => ( <option key={v.id} value={v.id}>{v.plate} - {v.model}</option> ))}
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

export default RevenueFormModal;