import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const HierarchyVisualization = ({ modelName, modelsHierarchy }) => {
  const cyRef = useRef(null);

  useEffect(() => {
    const generateSafeId = (name) => name.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const mainNode = { data: { id: generateSafeId(modelName), label: modelName, main: true } };

    const nodes = modelsHierarchy.subparts.flatMap((subpart) => {
      const subpartId = generateSafeId(subpart.name);
      const subNodes = subpart.subparts.map((subsubpartName) => ({
        data: { id: generateSafeId(`${subpart.name}-${subsubpartName}`), label: subsubpartName },
      }));

      return [{ data: { id: subpartId, label: subpart.name } }, ...subNodes];
    });

      const edgeSet = new Set();
      const edges = modelsHierarchy.subparts.flatMap((subpart) => {
      const subpartId = generateSafeId(subpart.name);
      
      return [
        { data: { source: generateSafeId(modelName), target: subpartId } },
        ...subpart.subparts.map((subsubpartName) => {
          const targetId = generateSafeId(`${subpart.name}-${subsubpartName}`);
          const edgeKey = `${subpartId}-${targetId}`;
          
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            return { data: { source: subpartId, target: targetId } };
          }
          return null;
        }).filter(Boolean)
      ];
    });
    const elements = [mainNode, ...nodes, ...edges];

    if (cyRef.current) cyRef.current.destroy();

    cyRef.current = cytoscape({
      container: document.getElementById('cy'),
      elements,
      minZoom: 0.1,
      maxZoom: 1.2,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0074D9',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'font-size': '10px',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'shape': 'round-rectangle',
            'width': (ele) => `${Math.min(200, 50 + ele.data('label').length * 5)}px`,
            'height': 'auto',
            'padding': '5px',
            'transition-property': 'background-color, width, height', 
            'transition-duration': '0.3s',
            'transition-timing-function': 'ease-in-out',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#87cefa',
            'target-arrow-color': '#87cefa',
            'target-arrow-shape': 'triangle',

            'curve-style': 'bezier',
            'transition-property': 'line-color, width',
            'transition-duration': '0.3s',
            'transition-timing-function': 'ease-in-out',
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR', 
        nodeSep: 30,
        edgeSep: 10, 
        rankSep: 1000, 
        directed: true,
        padding: 10
      }
    });

    return () => cyRef.current && cyRef.current.destroy();
  }, [modelName, modelsHierarchy]);

  return <div id="cy" style={{ width: '100%', height: '70dvh' }}></div>;
};

export default HierarchyVisualization;