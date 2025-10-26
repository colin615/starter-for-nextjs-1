"use client";

import { useState } from "react";

export const useUserSorting = () => {
  const [sortField, setSortField] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardSortField') || 'weightedWagered';
    }
    return 'weightedWagered';
  });
  const [sortDirection, setSortDirection] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardSortDirection') || 'desc';
    }
    return 'desc';
  });

  const handleSort = (field) => {
    let newDirection = 'desc';
    
    if (field === sortField) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardSortField', field);
      localStorage.setItem('dashboardSortDirection', newDirection);
    }
  };

  const getSortedUsersList = (users) => {
    const sorted = [...users].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'weightedWagered':
          aValue = a.weightedWagered;
          bValue = b.weightedWagered;
          break;
        case 'wagered':
          aValue = a.wagered;
          bValue = b.wagered;
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          aValue = a.weightedWagered;
          bValue = b.weightedWagered;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  };

  return {
    sortField,
    sortDirection,
    handleSort,
    getSortedUsersList
  };
};
