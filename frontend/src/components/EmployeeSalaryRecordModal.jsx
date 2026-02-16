import React, { useEffect, useState } from 'react';
import api from '../services/api';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '520px' },
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const EmployeeSalaryRecordModal = ({ isOpen, onClose, onSave, salary }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    period: getCurrentMonth(),
    amount: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/employees');
        setEmployees(data);
      } catch (err) {
        console.error('Falha ao carregar funcionarios', err);
      }
    };
    fetchEmployees();
  }, [isOpen]);

  useEffect(() => {
    if (salary) {
      setFormData({
        employee_id: salary.employee_id || salary.employee?.id || '',
        period: salary.period,
        amount: salary.amount,
        notes: salary.notes || '',
      });
    } else {
      setFormData({
        employee_id: '',
        period: getCurrentMonth(),
        amount: '',
        notes: '',
      });
    }
  }, [salary, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.employee_id || !formData.period || !formData.amount) {
      setError('Funcionario, periodo e valor sao obrigatorios.');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{salary ? 'Editar Salario' : 'Lancar Salario'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Funcionario</label>
            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
              <option value="">Selecione um funcionario</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Periodo (mes)</label>
            <input type="month" name="period" value={formData.period} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Valor (R$)</label>
            <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Observacoes (opcional)</label>
            <input name="notes" value={formData.notes} onChange={handleChange} />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeSalaryRecordModal;
