import React, { useEffect, useState } from 'react';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '480px' },
};

const EmployeeSalaryModal = ({ isOpen, onClose, employees, onSave }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [salary, setSalary] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setEmployeeId('');
    setSalary('');
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!employeeId) {
      setError('Selecione um funcionário.');
      return;
    }
    if (!salary) {
      setError('Informe o salário.');
      return;
    }
    onSave({ employeeId, salary });
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">Vincular Salário</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Funcionário</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">Selecione um funcionário</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.salary ? `(R$ ${emp.salary})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Salário (R$)</label>
            <input
              type="number"
              step="0.01"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeSalaryModal;
