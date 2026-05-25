import React, { useState, useEffect } from 'react';
import api from '../services/api';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' },
};

const RevenueFormModal = ({ isOpen, onClose, onSave, revenue }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    kind: 'entrega',
    pickup_location: '',
    description: '',
    amount: '',
    vehicle_id: '',
    employee_id: '',
  });
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
      const inferredKind = revenue.kind || (revenue.employee_id || revenue.vehicle_id ? 'entrega' : 'retirada');
      setFormData({
        date: revenue.date,
        kind: inferredKind,
        pickup_location: inferredKind === 'retirada' ? (revenue.pickup_location || 'deposito') : '',
        description: revenue.description,
        amount: revenue.amount,
        vehicle_id: inferredKind === 'entrega' ? (revenue.vehicle_id || '') : '',
        employee_id: inferredKind === 'entrega' ? (revenue.employee_id || '') : '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        kind: 'entrega',
        pickup_location: '',
        description: '',
        amount: '',
        vehicle_id: '',
        employee_id: '',
      });
    }
  }, [revenue, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'kind') {
      setFormData((prev) => {
        const next = { ...prev, kind: value };
        if (value === 'retirada') {
          next.employee_id = '';
          next.vehicle_id = '';
          if (!next.pickup_location) next.pickup_location = 'deposito';
        } else if (value === 'entrega') {
          next.pickup_location = '';
        }
        return next;
      });
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.kind) {
      alert('Selecione o tipo da receita.');
      return;
    }

    if (formData.kind === 'retirada') {
      if (!formData.pickup_location) {
        alert('Selecione o local de retirada.');
        return;
      }
    } else if (formData.kind === 'entrega') {
      if (!formData.employee_id) {
        alert('Selecione um motorista.');
        return;
      }
      if (!formData.vehicle_id) {
        alert('Selecione um veículo/caminhão.');
        return;
      }
    }

    onSave(formData);
  };

  const normalizeText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const isDriver = (emp) => normalizeText(emp?.role).includes('motorista');
  const activeEmployees = employees.filter((emp) => emp?.status !== 'inativo');
  const driverEmployees = activeEmployees.filter(isDriver);
  const driverOptions = driverEmployees.length > 0 ? driverEmployees : activeEmployees;
 
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{revenue ? 'Editar Receita' : 'Adicionar Nova Receita'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Data</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>

          <div className="form-group">
            <label>Tipo</label>
            <select name="kind" value={formData.kind} onChange={handleChange} required>
              <option value="entrega">Entrega</option>
              <option value="retirada">Retirada</option>
            </select>
          </div>

          {formData.kind === 'retirada' && (
            <div className="form-group">
              <label>Local de Retirada</label>
              <select name="pickup_location" value={formData.pickup_location} onChange={handleChange} required>
                <option value="">Selecione...</option>
                <option value="areial">Areial</option>
                <option value="deposito">Depósito</option>
              </select>
            </div>
          )}

          {formData.kind === 'entrega' && (
            <>
              <div className="form-group">
                <label>Motorista</label>
                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                  <option value="">Selecione um motorista</option>
                  {driverOptions.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Veículo / Caminhão</label>
                <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required>
                  <option value="">Selecione um veículo</option>
                  {vehicles.map(v => ( <option key={v.id} value={v.id}>{v.plate} - {v.model}</option> ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group"><label>Descrição</label><input name="description" value={formData.description} onChange={handleChange} required /></div>
          <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required /></div>
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
