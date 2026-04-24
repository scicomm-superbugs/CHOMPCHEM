import { useEffect, useRef } from 'react';
import SmilesDrawer from 'smiles-drawer';

export default function SmilesViewer({ smiles, width = 200, height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (smiles && canvasRef.current) {
      // Initialize SmilesDrawer
      const options = { width, height };
      const drawer = new SmilesDrawer.Drawer(options);

      SmilesDrawer.parse(smiles, (tree) => {
        drawer.draw(tree, canvasRef.current, "light", false);
      }, (err) => {
        console.error("Smiles parsing error", err);
      });
    }
  }, [smiles, width, height]);

  if (!smiles) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <span style={{ color: '#888' }}>No Structure Available</span>
      </div>
    );
  }

  return (
    <canvas ref={canvasRef} width={width} height={height} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
  );
}
