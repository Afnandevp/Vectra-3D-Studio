import React from 'react';
import { Header } from './components/ui/Header';
import { Sidebar } from './components/ui/Sidebar';
import { DropzoneOverlay } from './components/ui/DropzoneOverlay';
import { LogoCanvas } from './components/canvas/LogoCanvas';
import { EmptyDropzone } from './components/ui/EmptyDropzone';
import { useLogoStore } from './store/useLogoStore';
import { isValidSvgString } from './utils/svgParser';

export const App: React.FC = () => {
  const svgContent = useLogoStore((s) => s.svgContent);
  const setSvgContent = useLogoStore((s) => s.setSvgContent);

  // File upload reader pipeline
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (isValidSvgString(content)) {
        setSvgContent(content, file.name);
      } else {
        alert('Please upload a valid SVG vector file containing vector paths.');
      }
    };
    reader.readAsText(file);
  };

  return (
    // Parent Container: Strictly enforce flex-row layout with pitch black canvas and dark neutral panels
    <div className="flex flex-row h-screen w-full overflow-hidden bg-[#000000] text-white/85 select-none antialiased font-sans">
      
      {/* 1. Sidebar: Controls panel locked on the left side */}
      <Sidebar />

      {/* 2. Main Viewport: Fills remaining right space */}
      <main className="relative flex-1 h-full flex flex-col min-w-0 min-h-0 bg-[#000000] overflow-hidden">
        {/* Sleek Minimal Top Navigation Bar with centered presets */}
        <Header />

        {/* 3. Conditional 3D Canvas / Empty State Dropzone Container */}
        <div className="relative w-full h-full flex-1 overflow-hidden min-w-0 min-h-0 flex flex-col bg-[#000000]">
          {svgContent ? (
            <div className="relative w-full h-full flex-1 overflow-hidden">
              <DropzoneOverlay>
                <LogoCanvas />
              </DropzoneOverlay>
            </div>
          ) : (
            <EmptyDropzone onUpload={handleFileUpload} />
          )}
        </div>
      </main>
      
    </div>
  );
};

export default App;
