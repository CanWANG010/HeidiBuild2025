import React, { useEffect, useState, useCallback } from 'react';
import { Info } from 'lucide-react';
import { api } from './api';
import { cn } from './lib/utils';
import { PatientList } from './components/PatientList';
import { PatientDetail } from './components/PatientDetail';

function App() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // List vs Detail split (inside Left Panel)
  const [listWidth, setListWidth] = useState(35);
  const [isResizingList, setIsResizingList] = useState(false);

  // Left vs Right Panel split
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const [isResizingMain, setIsResizingMain] = useState(false);

  // List Resize Handlers
  const startResizingList = useCallback(() => {
    setIsResizingList(true);
  }, []);

  const stopResizingList = useCallback(() => {
    setIsResizingList(false);
  }, []);

  const resizeList = useCallback(
    (mouseMoveEvent) => {
      if (isResizingList) {
        // Calculate percentage relative to the Left Panel width
        const leftPanelPx = (window.innerWidth * leftPanelWidth) / 100;
        const newWidth = (mouseMoveEvent.clientX / leftPanelPx) * 100;
        if (newWidth >= 20 && newWidth <= 80) {
          setListWidth(newWidth);
        }
      }
    },
    [isResizingList, leftPanelWidth]
  );

  // Main Split Resize Handlers
  const startResizingMain = useCallback(() => {
    setIsResizingMain(true);
  }, []);

  const stopResizingMain = useCallback(() => {
    setIsResizingMain(false);
  }, []);

  const resizeMain = useCallback(
    (mouseMoveEvent) => {
      if (isResizingMain) {
        const newWidth = (mouseMoveEvent.clientX / window.innerWidth) * 100;
        if (newWidth >= 20 && newWidth <= 80) {
          setLeftPanelWidth(newWidth);
        }
      }
    },
    [isResizingMain]
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingList) resizeList(e);
      if (isResizingMain) resizeMain(e);
    };

    const handleMouseUp = () => {
      stopResizingList();
      stopResizingMain();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeList, resizeMain, stopResizingList, stopResizingMain, isResizingList, isResizingMain]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelect = (id, checked) => {
    const newSet = new Set(multiSelectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setMultiSelectedIds(newSet);
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans text-gray-900 select-none">
      {/* Left Panel: Patient Management */}
      <div
        style={{ width: `${leftPanelWidth}%` }}
        className="flex flex-col border-r border-gray-300 bg-white shadow-xl z-10 relative"
      >
        <div className="flex-1 flex overflow-hidden relative">
          {/* List View */}
          <div
            style={{ width: selectedId ? `${listWidth}%` : '100%' }}
            className={cn(
              "flex-col h-full bg-white border-r border-gray-200",
              isResizingList ? "transition-none" : "transition-all duration-300 ease-in-out"
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
            ) : (
              <PatientList
                patients={patients}
                selectedId={selectedId}
                onSelect={setSelectedId}
                multiSelectedIds={multiSelectedIds}
                onMultiSelect={handleMultiSelect}
                compact={!!selectedId}
              />
            )}
          </div>

          {/* List Resizer Handle */}
          {selectedId && (
            <div
              className="w-1 hover:w-1.5 -ml-0.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center z-50 transition-all delay-75"
              onMouseDown={startResizingList}
            >
              <div className="w-0.5 h-8 bg-gray-400 rounded-full" />
            </div>
          )}

          {/* Detail View */}
          {selectedId && (
            <div className="flex-1 bg-gray-50 overflow-hidden relative animate-in slide-in-from-right duration-300">
              <PatientDetail
                patientId={selectedId}
                onClose={() => setSelectedId(null)}
                onUpdate={(updatedPatient) => {
                  setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Split Resizer Handle */}
      <div
        className="w-1 hover:w-1.5 -ml-0.5 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex items-center justify-center z-50 transition-all delay-75"
        onMouseDown={startResizingMain}
      >
        <div className="w-0.5 h-12 bg-gray-500 rounded-full" />
      </div>

      {/* Right Panel: RPA Progress */}
      <div
        style={{ width: `${100 - leftPanelWidth}%` }}
        className="bg-slate-50 flex flex-col items-center justify-end pb-12 p-12 text-center border-l border-gray-200"
      >
        <div className="max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mr-2">RPA Progress Panel</h2>
            <div className="relative group">
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl z-10 text-left font-normal">
                This area will display the automation progress for selected patients.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Selected for RPA</span>
              <span className="font-semibold">{multiSelectedIds.size} patients</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
