import React from 'react';
import './Layout.css';

const Layout = ({ leftPanel, rightPanel }) => {
  return (
    <div className="app-container">
      <div className="left-panel">
        {leftPanel}
      </div>
      <div className="right-panel">
        {rightPanel}
      </div>
    </div>
  );
};

export default Layout;
