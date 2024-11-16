import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClearIcon from '@mui/icons-material/Clear';
import {
  loadWorkbook,
  getModelsAndHierarchies,
  getSheetData,
} from './../utils/excelUtils';
import HierarchyVisualization from './HierarchyVisualization';

function CameraModelGrid({ cameraDataFile }) {
  const [data, setData] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [visualizationContent, setVisualizationContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [highlightedModels, setHighlightedModels] = useState(new Set());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const workbook = await loadWorkbook(cameraDataFile);
      const { sheetNames, hierarchyData } = getModelsAndHierarchies(workbook);
      const hierarchyMap = hierarchyData.reduce((acc, item) => {
        acc[item.name] = item;
        return acc;
      }, {});
      setData({ data: sheetNames, modelsHierarchy: hierarchyMap });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const highlightModels = async () => {
      const highlightedSet = new Set();

      for (const modelName of data.data) {
        const workbook = await loadWorkbook(cameraDataFile);
        const { tableData } = getSheetData(workbook, modelName);

        const modelHasMatch = tableData.some((row) =>
          Object.values(row).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(searchQuery.toLowerCase())
          )
        );

        if (modelHasMatch) {
          highlightedSet.add(modelName);
        }
      }

      setHighlightedModels(highlightedSet);
    };

    if (searchQuery) {
      highlightModels();
    } else {
      setHighlightedModels(new Set());
    }
  }, [searchQuery, data.data, cameraDataFile]);

  const handleModelSelect = async (modelName) => {
    setIsLoading(true);
    setSelectedModel(modelName);
    setViewMode('grid');
    try {
      const workbook = await loadWorkbook(cameraDataFile);
      const { tableData } = getSheetData(workbook, modelName);

      if (tableData && tableData.length > 0) {
        setGridData(tableData);
      } else {
        console.error('No data found for the selected model.');
      }
    } catch (error) {
      console.error('Error loading model data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualizationClick = (modelName) => {
    setViewMode('visualization');
    setSelectedModel(modelName);
    const modelHierarchy = data.modelsHierarchy[modelName];
    if (modelHierarchy) {
      setVisualizationContent({
        modelName,
        modelsHierarchy: modelHierarchy,
      });
    } else {
      console.log('Hierarchia pre vybraný model nebola nájdená');
    }
  };

  const toggleRowExpand = (nazov1) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [nazov1]: !prevExpandedRows[nazov1],
    }));
  };

  const filteredGridData = searchQuery
    ? gridData.filter((row) =>
        Object.values(row).some(
          (value) =>
            value &&
            value.toString().toLowerCase() === searchQuery.toLowerCase()
        )
      )
    : gridData;

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedModel(null);
  };

  const formattedRows = filteredGridData.reduce((acc, row) => {
    const existingGroup = acc.find(
      (item) => item['Názov 1'] === row['Názov 1']
    );

    if (!existingGroup) {
      acc.push({
        ...row,
        id: row['Názov 1'],
        isGroup: true,
        'Registračné číslo 2': row['Registračné číslo 2'],
        'Celková kalkulačná cena': row['Celková kalkulačná cena'],
        'MJ evidencia': row['MJ evidencia'],
        MNF: row['MNF'],
      });
    }

    if (expandedRows[row['Názov 1']]) {
      acc.push({
        ...row,
        id: `${row['Názov 1']}-${row['Názov 2']}`,
        isGroup: false,
        'Registračné číslo 2': row['Registračné číslo 2'],
        'Celková kalkulačná cena': row['Celková kalkulačná cena'],
        'MJ evidencia': row['MJ evidencia'],
        MNF: row['MNF'],
      });
    }

    return acc;
  }, []);

  const columns = [
    {
      field: 'Názov 1',
      headerName: 'Názov 1',
      flex: 1,
      filterable: true,
      renderCell: (params) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => toggleRowExpand(params.row['Názov 1'])}
        >
          {expandedRows[params.row['Názov 1']] ? (
            <ExpandLessIcon style={{ marginRight: 8 }} />
          ) : (
            <ExpandMoreIcon style={{ marginRight: 8 }} />
          )}
          {params.row.isGroup ? params.row['Názov 1'] : null}
        </div>
      ),
    },
    {
      field: 'Názov 2',
      headerName: 'Názov 2',
      flex: 1,
      hide: true,
      filterable: true,
      renderCell: (params) => {
        if (!params.row.isGroup && expandedRows[params.row['Názov 1']]) {
          return params.row['Názov 2'];
        }
        return null;
      },
    },
    {
      field: 'Registračné číslo 2',
      headerName: 'Registračné číslo 2',
      flex: 0.7,
      renderCell: (params) => {
        if (!params.row.isGroup && expandedRows[params.row['Názov 1']]) {
          return params.row['Registračné číslo 2'] || '-';
        }
        return null;
      },
    },
    {
      field: 'MNF',
      headerName: 'MNF',
      flex: 0.2,
      filterable: true,
      renderCell: (params) => {
        if (!params.row.isGroup && expandedRows[params.row['Názov 1']]) {
          return params.row['MNF'] || '-';
        }
        return null;
      },
    },
    {
      field: 'MJ evidencia',
      headerName: 'MJ evidencia',
      flex: 0.2,
      filterable: true,
      renderCell: (params) => {
        if (!params.row.isGroup && expandedRows[params.row['Názov 1']]) {
          return params.row['MJ evidencia'] || '-';
        }
        return null;
      },
    },
    {
      field: 'Celková kalkulačná cena',
      headerName: 'Celková kalkulačná cena',
      flex: 0.3,
      filterable: true,
      renderCell: (params) => {
        if (!params.row.isGroup && expandedRows[params.row['Názov 1']]) {
          return params.row['Celková kalkulačná cena'] || '-';
        }
        return null;
      },
    },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-center items-start p-2 md:p-6 space-y-4 md:space-y-0 md:space-x-8">
      <div className="w-full md:w-1/4 bg-white rounded-lg shadow-md p-4 space-y-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700">
          Kamery
        </h2>
        <ul>
          {data.data &&
            data.data.map((modelName) => (
              <li
                key={modelName}
                className="flex flex-col md:flex-row md:flex-wrap md:space-x-2 justify-between items-center py-1 md:py-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-2 sm:space-y-0">
                  <span
                    className={`block flex-grow text-left py-2 px-2 rounded-lg hover:bg-gray-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      highlightedModels.has(modelName)
                        ? 'bg-blue-100'
                        : selectedModel === modelName && viewMode === 'grid'
                        ? 'bg-orange'
                        : ''
                    }`}
                    onClick={() => handleModelSelect(modelName)}
                  >
                    {modelName}
                  </span>
                  <button
                    onClick={() => handleVisualizationClick(modelName)}
                    className={`w-full sm:w-auto sm:ml-2 px-4 py-1 rounded-lg shadow-md transition-all duration-300 ${
                      selectedModel === modelName &&
                      viewMode === 'visualization'
                        ? 'bg-orange text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Vizualizácia
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>

      <div className="w-full md:w-3/4  bg-white rounded-lg shadow-lg p-4 md:p-6">
        {viewMode === 'grid' && (
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Vyhľadávanie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        )}

        {viewMode === 'visualization' ? (
          visualizationContent ? (
            <HierarchyVisualization
              modelName={visualizationContent.modelName}
              modelsHierarchy={visualizationContent.modelsHierarchy}
            />
          ) : (
            ''
          )
        ) : (
          <div className="overflow-x-auto ">
            <DataGrid
              rows={formattedRows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              loading={isLoading}
              disableSelectionOnClick
              disableExtendRowFullWidth
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraModelGrid;
