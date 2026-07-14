import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>
      <div className="pagination-controls">
        <button 
          className="page-arrow" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>
        <div className="page-capsule">
          {pages.map((page, index) => {
            if (page === '...') {
              return <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>;
            }
            return (
              <button
                key={page}
                className={`page-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button 
          className="page-arrow" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
