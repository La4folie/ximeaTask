import * as XLSX from "xlsx";

export const loadWorkbook = async (file) => {
  const response = await fetch(file);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  return workbook;
};


export const getModelsAndHierarchies = (workbook) => {
  const sheetNames = workbook.SheetNames;

  const hierarchyData = [];
  const uniqueNamesNazov1 = new Set();
  const uniqueNamesNazov2 = new Set();
  
  const nazov1ToSheets = {};
  const nazov2ToSheets = {};

  sheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);


    const part = {
      name: sheetName,
      subparts: []
    };

    const subpartsMap = {};

    jsonData.forEach((row) => {
      const nazov1 = row["Názov 1"];
      const nazov2 = row["Názov 2"];

      if (nazov1) {
        uniqueNamesNazov1.add(nazov1);
        if (!nazov1ToSheets[nazov1]) {
          nazov1ToSheets[nazov1] = [];
        }
        nazov1ToSheets[nazov1].push(sheetName);

        if (!subpartsMap[nazov1]) {
          subpartsMap[nazov1] = { name: nazov1, subparts: [] };
          part.subparts.push(subpartsMap[nazov1]);
        }

        if (nazov2) {
          uniqueNamesNazov2.add(nazov2);
          if (!nazov2ToSheets[nazov2]) {
            nazov2ToSheets[nazov2] = [];
          }
          nazov2ToSheets[nazov2].push(sheetName);
          
          subpartsMap[nazov1].subparts.push(nazov2);
        }
      }
    });

    hierarchyData.push(part);
  });

  return {
    sheetNames,
    hierarchyData,
    uniqueNamesNazov1: Array.from(uniqueNamesNazov1),
    uniqueNamesNazov2: Array.from(uniqueNamesNazov2),
  };
};





export const getSheetData = (workbook, modelName) => {
  const worksheet = workbook.Sheets[modelName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet); 


  const headers = Object.keys(jsonData[0] || {}); 
  const tableData = jsonData.map((row, index) => ({
    id: index,
    ...row,    
  }));

  return { headers, tableData };
};