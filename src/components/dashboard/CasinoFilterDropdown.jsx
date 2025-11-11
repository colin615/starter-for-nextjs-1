"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, ChevronDown } from "lucide-react";

export const CasinoFilterDropdown = ({
  isOpen,
  onClose,
  linkedServices,
  selectedCasinos,
  onCasinoSelect,
  onClearFilters,
  hasActiveFilters = false,
}) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleCasinoToggle = (casinoId) => {
    if (selectedCasinos.includes(casinoId)) {
      onCasinoSelect(selectedCasinos.filter(id => id !== casinoId));
    } else {
      onCasinoSelect([...selectedCasinos, casinoId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full left-0 mt-2 w-80 bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl z-50 transition-all duration-200 ease-out ${
        isOpen 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-[-8px] scale-95 pointer-events-none'
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Filter by Casino</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-7 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Casino List */}
        <ScrollArea className="max-h-72 pr-3">
          <div className="space-y-2">
            {linkedServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-muted/30 flex items-center justify-center">
                  <ChevronDown className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">No casinos connected</p>
                <p className="text-xs mt-1 opacity-75">Connect casinos to filter by them</p>
              </div>
            ) : (
              linkedServices.map((service, index) => {
                const isSelected = selectedCasinos.includes(service.identifier);
                return (
                  <div
                    key={service.identifier}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/40 hover:scale-[1.02] ${
                      isSelected 
                        ? 'bg-primary/5 border border-primary/20 shadow-sm' 
                        : 'hover:border-border/50'
                    }`}
                    onClick={() => handleCasinoToggle(service.identifier)}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Casino Logo */}
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg transition-all duration-200 ${
                        isSelected ? 'bg-primary/10' : 'bg-muted/20 group-hover:bg-muted/30'
                      }`}>
                        <img
                          src={`/casinos/${service.identifier}.svg`}
                          alt={service.name}
                          className="h-6 w-6"
                        />
                      </div>
                    </div>

                    {/* Casino Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{service.identifier}</p>
                    </div>

                    {/* Selection Indicator */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-lg bg-primary flex items-center justify-center shadow-sm transition-all duration-200">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-lg border-2 border-muted-foreground/30 group-hover:border-muted-foreground/50 transition-colors" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 mt-4 border-t border-border/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
              {selectedCasinos.map((casinoId) => {
                const service = linkedServices.find(s => s.identifier === casinoId);
                return (
                  <Badge
                    key={casinoId}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors text-xs h-6 px-2"
                  >
                    <img
                      src={`/casinos/${casinoId}.svg`}
                      alt={casinoId}
                      className="h-3 w-3 mr-1.5"
                    />
                    {service?.name || casinoId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
