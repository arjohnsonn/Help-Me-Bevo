import React from "react";

interface WrappedPopupProps {
  onShowClick: () => void;
  onHideClick: () => void;
  onClose: () => void;
}

const WrappedPopup: React.FC<WrappedPopupProps> = ({
  onShowClick,
  onHideClick,
  onClose,
}) => {
  return (
    <div className="fixed bottom-4 right-4 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 transform translate-y-0 opacity-100 transition-all duration-300 text-black dark:text-white z-[99999]">
      <h2 className="text-lg font-semibold mb-2 relative">
        Hey there!
        <button
          className="absolute top-1 right-2 bg-transparent border-none text-base cursor-pointer text-inherit"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
      </h2>
      <p className="text-sm mb-4">
        Your <span className="font-bold text-[#c65900]">Help Me Bevo: Wrapped</span>{" "}
        video is ready! Let's take a trip down this semester's memory lane.
      </p>
      <div className="flex items-center">
        <button
          className="px-2 py-1 text-xs cursor-pointer bg-[#c65900] text-white border-none rounded-lg mr-2 mb-2 hover:bg-[#c65900a0]"
          onClick={onShowClick}
        >
          Show me!
        </button>
        <button
          className="px-3 py-1 text-xs cursor-pointer bg-transparent border-none text-gray-500 rounded mb-2 hover:text-gray-800 dark:hover:text-gray-300"
          onClick={onHideClick}
        >
          Don't show again
        </button>
      </div>
    </div>
  );
};

export default WrappedPopup;