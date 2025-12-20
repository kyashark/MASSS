import React from 'react';

const PageHeader = ({ title, description, children }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>

      {/* This container will render whatever you put inside the component tags */}
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
};

export default PageHeader;