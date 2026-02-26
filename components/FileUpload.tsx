import React, { ChangeEvent, useRef } from 'react';
import { Upload, FileAudio } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center 
        transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden group
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-700' : 'border-cyan-800/40 bg-slate-900/40 hover:border-cyan-400/60 hover:bg-slate-900/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]'}
      `}
    >
      <input 
        type="file" 
        accept="audio/*" 
        className="hidden" 
        ref={inputRef} 
        onChange={handleFileChange} 
        disabled={disabled}
      />
      
      {/* Circuit lines decorative elements */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-lg group-hover:border-cyan-400 transition-colors"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-lg group-hover:border-cyan-400 transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-lg group-hover:border-cyan-400 transition-colors"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30 rounded-br-lg group-hover:border-cyan-400 transition-colors"></div>

      <div className="bg-cyan-500/10 p-4 rounded-full mb-4 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        <Upload className="w-8 h-8 text-cyan-400" />
      </div>
      
      <h3 className="text-lg font-bold text-slate-200 mb-2 tracking-wide">Upload Consultation Audio</h3>
      <p className="text-slate-400 text-center max-w-md font-light">
        Select an MP3 or WAV file of a doctor-patient interaction (max 10 MB). 
      </p>
      
      <div className="mt-6 flex items-center gap-2 text-xs text-cyan-600/70 font-mono uppercase tracking-widest font-bold">
        <FileAudio className="w-4 h-4" />
        <span>Supports MP3, WAV, AAC</span>
      </div>
    </div>
  );
};

export default FileUpload;