import React from 'react';

const TablePagination = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const handlePrev = () => {
    if (safePage > 1) onPageChange(safePage - 1);
  };

  const handleNext = () => {
    if (safePage < totalPages) onPageChange(safePage + 1);
  };

  return (
    <div className="pagination">
      <div className="controls">
        <button type="button" onClick={handlePrev} disabled={safePage <= 1}>
          Anterior
        </button>
        <span>
          Página {safePage} de {totalPages}
        </span>
        <button type="button" onClick={handleNext} disabled={safePage >= totalPages}>
          Próxima
        </button>
      </div>
      <div className="controls">
        <span>Registros: {total}</span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
};

export default TablePagination;
