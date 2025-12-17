import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modern Custom Dropdown Component
 * Replaces native <select> elements with a beautiful, consistent UI
 * Uses React Portal to render dropdown menu outside of parent overflow constraints
 */
const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...', 
  disabled = false,
  required = false,
  label = null,
  error = null,
  helpText = null,
  searchable = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const searchInputRef = useRef(null)
  const menuRef = useRef(null)
  
  // Calculate dropdown position when opening
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const menuHeight = 280 // max-h-60 = 240px + padding
      
      // Determine if dropdown should open upward or downward
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow
      
      setDropdownPosition({
        top: openUpward ? rect.top - menuHeight + window.scrollY : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200),
        openUpward
      })
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update position on scroll or resize
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      const handleScrollResize = () => {
        updatePosition()
      }
      window.addEventListener('scroll', handleScrollResize, true)
      window.addEventListener('resize', handleScrollResize)
      return () => {
        window.removeEventListener('scroll', handleScrollResize, true)
        window.removeEventListener('resize', handleScrollResize)
      }
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [isOpen, searchable])
  
  const selectedOption = options.find(opt => String(opt.value) === String(value))
  
  const filteredOptions = searchable && searchTerm
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const handleSelect = (optValue) => {
    onChange(optValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true)
    }
  }
  
  return (
    <div ref={dropdownRef} className={`relative min-w-0 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition()
            setIsOpen(!isOpen)
          }
        }}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-3 text-left bg-white border-2 rounded-xl transition-all duration-200 flex items-center justify-between min-h-[50px]
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : disabled 
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
              : isOpen 
                ? 'border-[#7a0000] ring-2 ring-red-100 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        <span className={`flex-1 truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Portal-rendered dropdown menu */}
      {isOpen && !disabled && createPortal(
        <div 
          ref={menuRef}
          className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: 'max-content',
            maxWidth: '90vw',
            zIndex: 99999,
            animation: 'dropdownFadeIn 0.15s ease-out'
          }}
        >
          {/* Search input for searchable dropdowns */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#7a0000] focus:ring-1 focus:ring-red-100"
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm text-center">
                {searchTerm ? 'No matching options' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value ?? index}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-b-0
                    ${String(value) === String(option.value) ? 'bg-red-50 text-[#7a0000] font-medium' : 'text-gray-700'}
                  `}
                >
                  {String(value) === String(option.value) && (
                    <svg className="w-4 h-4 text-[#7a0000] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`truncate ${String(value) === String(option.value) ? '' : 'ml-7'}`}>{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
      
      {helpText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export default CustomDropdown
