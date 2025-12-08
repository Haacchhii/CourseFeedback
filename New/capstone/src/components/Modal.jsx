import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, Trash2, UserX, AlertCircle } from 'lucide-react';

/**
 * Modern Modal Component System
 * Replaces ugly browser alert(), confirm(), and prompt() with beautiful UI
 */

export const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with fade-in animation */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container - Centered */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white text-left shadow-2xl transition-all duration-300 ease-out sm:my-8 animate-modal-appear`}
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          {children}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-appear {
          animation: modalAppear 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export const ModalHeader = ({ children, onClose, icon: Icon, iconColor = 'text-blue-600' }) => {
  return (
    <div className="relative bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-900">{children}</h3>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export const ModalBody = ({ children }) => {
  return (
    <div className="px-6 py-5 max-h-[calc(100vh-300px)] overflow-y-auto">
      {children}
    </div>
  );
};

export const ModalFooter = ({ children }) => {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      {children}
    </div>
  );
};

// Pre-built Modal Types

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger', 'warning', 'info', 'success'
  icon: CustomIcon
}) => {
  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white'
    }
  };

  const config = variants[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader icon={Icon} iconColor={config.iconColor} onClose={onClose}>
        {title}
      </ModalHeader>
      <ModalBody>
        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-all"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-5 py-2.5 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md transition-all ${config.buttonClass}`}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  variant = 'info',
  buttonText = 'OK'
}) => {
  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader icon={Icon} iconColor={config.iconColor} onClose={onClose}>
        {title}
      </ModalHeader>
      <ModalBody>
        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className={`px-5 py-2.5 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md transition-all ${config.buttonClass}`}
        >
          {buttonText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export const DeleteUserModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName,
  hasData = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader icon={UserX} iconColor="text-red-600" onClose={onClose}>
        Delete User
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{userName}</span>?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Note:</p>
                <p>
                  If this user has no evaluations or enrollments, they will be <span className="font-semibold">permanently deleted</span>. 
                  Otherwise, they will be <span className="font-semibold">deactivated</span> to preserve data integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-5 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition-all"
        >
          Delete User
        </button>
      </ModalFooter>
    </Modal>
  );
};

export const DeleteResultModal = ({ 
  isOpen, 
  onClose, 
  userName,
  deleteType, // 'hard' or 'soft'
  reason
}) => {
  const isHardDelete = deleteType === 'hard';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader 
        icon={isHardDelete ? Trash2 : UserX} 
        iconColor={isHardDelete ? "text-red-600" : "text-yellow-600"} 
        onClose={onClose}
      >
        {isHardDelete ? 'User Permanently Deleted' : 'User Deactivated'}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-gray-700">
            <span className="font-semibold">{userName}</span> has been {isHardDelete ? 'permanently deleted' : 'deactivated'}.
          </p>
          
          <div className={`${isHardDelete ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
            <div className="flex items-start space-x-3">
              {isHardDelete ? (
                <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              )}
              <div className={`text-sm ${isHardDelete ? 'text-red-800' : 'text-yellow-800'}`}>
                <p className="font-medium mb-1">Reason:</p>
                <p>{reason}</p>
              </div>
            </div>
          </div>

          {!isHardDelete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p>The user account has been deactivated but their data (evaluations, enrollments) has been preserved for data integrity.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all"
        >
          OK
        </button>
      </ModalFooter>
    </Modal>
  );
};

// Hook to use modals easily
export const useModal = () => {
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    type: null,
    props: {}
  });

  const showModal = (type, props) => {
    setModalState({ isOpen: true, type, props });
  };

  const hideModal = () => {
    setModalState({ isOpen: false, type: null, props: {} });
  };

  return { modalState, showModal, hideModal };
};

export default Modal;
