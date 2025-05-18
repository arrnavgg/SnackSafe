import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Get the backend URL from environment variables or use default
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '/api';
  
  // Fetch prediction history from the backend
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      console.log(`Fetching history from ${backendUrl}/history`);
      const response = await fetch(`${backendUrl}/history`);
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('History data:', data);
      setHistory(data.results || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error(`Failed to load prediction history: ${error.message}`);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [backendUrl]);

  // Load prediction history on component mount
  useEffect(() => {
    // Check if the backend is accessible
    fetch(`${backendUrl}/health`)
      .then(response => {
        if (response.ok) {
          console.log('Backend health check succeeded');
          fetchHistory();
        } else {
          throw new Error(`Backend health check failed: ${response.status} ${response.statusText}`);
        }
      })
      .catch(error => {
        console.error('Error connecting to backend:', error);
        toast.error(`Cannot connect to backend: ${error.message}`);
      });
  }, [backendUrl, fetchHistory]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setResult(null); // Clear previous results
    }
  };

  // Handle file upload and prediction
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning('Please select an image first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    setIsUploading(true);
    try {
      console.log(`Uploading to ${backendUrl}/predict`);
      console.log('File being uploaded:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const response = await fetch(`${backendUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process image (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Prediction result:', data);
      setResult(data);
      
      // Refresh history after a new prediction
      setTimeout(() => fetchHistory(), 500);
      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Potato Chip Defect Detector</h1>
          <p className="mt-2 text-gray-600">Upload an image to detect defective potato chips</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
            
            <div className="space-y-4">
              {/* File Input */}
              <div className="flex justify-center">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-primary-700 rounded-lg shadow-lg tracking-wide border border-primary-500 cursor-pointer hover:bg-primary-50">
                  <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                  </svg>
                  <span className="mt-2 text-base leading-normal">Select a chip image</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isUploading}
                  />
                </label>
              </div>
              
              {/* Preview */}
              {preview && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Image Preview</h3>
                  <div className="border rounded-lg overflow-hidden w-full h-64 bg-gray-100">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="mt-4">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isUploading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Analyze Image'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Results Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
            
            {result ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${result.is_defective ? 'bg-danger-50 border border-danger-200' : 'bg-primary-50 border border-primary-200'}`}>
                  <div className="flex items-center">
                    {result.is_defective ? (
                      <svg className="w-6 h-6 text-danger-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-primary-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <h3 className="text-lg font-medium">
                      {result.is_defective ? 'Defective Chip Detected' : 'No Defects Detected'}
                    </h3>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm">
                      <span className="font-medium">Confidence:</span> {Math.round(result.confidence * 100)}%
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Analysis Time:</span> {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <img 
                        src={`data:image/jpeg;base64,${result.image_b64}`} 
                        alt="Analyzed chip" 
                        className="w-full h-48 object-contain" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2">Upload an image to see detection results</p>
              </div>
            )}
          </div>
        </div>
        
        {/* History Section */}
        <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Analysis History</h2>
            <button
              onClick={fetchHistory}
              disabled={isLoadingHistory}
              className="flex items-center text-sm text-primary-600 hover:text-primary-800"
            >
              {isLoadingHistory ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
          
          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-lg overflow-hidden shadow-sm ${item.is_defective ? 'border-danger-200' : 'border-primary-200'}`}
                >
                  <div className="h-48 bg-gray-100">
                    <img 
                      src={`data:image/jpeg;base64,${item.image_b64}`} 
                      alt="Chip" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center">
                      {item.is_defective ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                          Defective
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          Good Quality
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isLoadingHistory ? (
                <p>Loading history...</p>
              ) : (
                <p>No analysis history available</p>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Potato Chip Defect Detector © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;