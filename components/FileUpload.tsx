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
        transition-all duration-300 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm'}
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
      
      <div className="bg-indigo-100 p-4 rounded-full mb-4">
        <Upload className="w-8 h-8 text-indigo-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Consultation Audio</h3>
      <p className="text-slate-500 text-center max-w-md">
        Select an MP3 or WAV file of a doctor-patient interaction. 
        CLARA will process this securely to identify clinical logic risks.
      </p>
      
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-medium">
        <FileAudio className="w-4 h-4" />
        <span>Supports MP3, WAV, AAC</span>
      </div>
    </div>
  );
};

export default FileUpload;