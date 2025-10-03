import React, { useState, useEffect } from 'react';

// (Você pode copiar os estilos do VehicleFormModal ou criar um CSS compartilhado)
const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' },
};

const EmployeeFormModal = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({ name: '', role: '', salary: '', status: 'ativo' });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        role: employee.role,
        salary: employee.salary || '',
        status: employee.status,
      });
    } else {
      setFormData({ name: '', role: '', salary: '', status: 'ativo' });
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Garante que o salário seja um número ou null
    const dataToSave = { ...formData, salary: formData.salary ? parseFloat(formData.salary) : null };
    onSave(dataToSave);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{employee ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Função / Cargo</label>
            <input name="role" value={formData.role} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Salário (Opcional)</label>
            <input type="number" step="0.01" name="salary" value={formData.salary} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
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

export default EmployeeFormModal;