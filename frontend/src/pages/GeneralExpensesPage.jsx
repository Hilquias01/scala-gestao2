import React, { useMemo, useState, useEffect } from 'react';
import api from '../services/api';
import GeneralExpenseFormModal from '../components/GeneralExpenseFormModal';
import TablePagination from '../components/TablePagination';

// 1. Importações do Material-UI
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const GeneralExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/general-expenses');
      setExpenses(data);
    } catch (err) {
      console.error("Falha ao carregar despesas:", err);
      alert('Falha ao carregar despesas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleOpenModal = (expense = null) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = async (formData) => {
    try {
      if (editingExpense) {
        await api.put(`/general-expenses/${editingExpense.id}`, formData);
      } else {
        await api.post('/general-expenses', formData);
      }
      fetchExpenses();
      handleCloseModal();
    } catch (err) {
      console.error("Erro ao salvar despesa:", err);
      alert('Erro ao salvar despesa.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await api.delete(`/general-expenses/${expenseId}`);
        fetchExpenses();
      } catch (err) {
        console.error("Erro ao excluir despesa:", err);
        alert('Erro ao excluir despesa.');
      }
    }
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (sortBy !== key) return '';
    return sortDir === 'asc' ? '▲' : '▼';
  };

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      if (start && expenseDate < start) return false;
      if (end && expenseDate > end) return false;
      if (!term) return true;
      const haystack = [
        expense.description,
        expense.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [expenses, searchTerm, startDate, endDate]);

  const sortedExpenses = useMemo(() => {
    const copy = [...filteredExpenses];
    copy.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      if (sortBy === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (sortBy === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      const aComparable = typeof aValue === 'number' ? aValue : String(aValue ?? '').toLowerCase();
      const bComparable = typeof bValue === 'number' ? bValue : String(bValue ?? '').toLowerCase();
      if (aComparable < bComparable) return sortDir === 'asc' ? -1 : 1;
      if (aComparable > bComparable) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredExpenses, sortBy, sortDir]);

  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedExpenses.slice(start, start + pageSize);
  }, [sortedExpenses, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate, pageSize, expenses.length]);

  if (loading) return <div>Carregando despesas...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Despesas Gerais</h1>
        <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px', width: 'auto' }}>
          Adicionar Despesa
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Buscar descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: '#666' }}>até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate || searchTerm) && (
            <button onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); }} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}>
              Limpar
            </button>
          )}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('date')}>Data <span className="sort-indicator">{sortIndicator('date')}</span></th>
              <th className="sortable" onClick={() => handleSort('description')}>Descrição <span className="sort-indicator">{sortIndicator('description')}</span></th>
              <th className="sortable" onClick={() => handleSort('category')}>Categoria <span className="sort-indicator">{sortIndicator('category')}</span></th>
              <th className="sortable" onClick={() => handleSort('amount')}>Valor <span className="sort-indicator">{sortIndicator('amount')}</span></th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.length > 0 ? (
              paginatedExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{new Date(expense.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category}</td>
                  <td>R$ {expense.amount}</td>
                  <td className="action-cell">
                    <Tooltip title="Editar Despesa">
                      <IconButton onClick={() => handleOpenModal(expense)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir Despesa">
                      <IconButton onClick={() => handleDeleteExpense(expense.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="table-empty">
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={sortedExpenses.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      <GeneralExpenseFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
};

export default GeneralExpensesPage;
