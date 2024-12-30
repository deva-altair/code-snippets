// src/App.js
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Tag, Save } from 'lucide-react';

function App() {
  const [snippets, setSnippets] = useState(() => {
    const savedSnippets = localStorage.getItem('codeSnippets');
    return savedSnippets ? JSON.parse(savedSnippets) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    description: '',
    code: '',
    tags: '',
    language: 'javascript'
  });

  useEffect(() => {
    localStorage.setItem('codeSnippets', JSON.stringify(snippets));
  }, [snippets]);

  const handleAddSnippet = () => {
    if (!newSnippet.title || !newSnippet.code) return;
    
    setSnippets([...snippets, {
      ...newSnippet,
      id: Date.now(),
      created: new Date().toISOString(),
      tags: newSnippet.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }]);
    
    setNewSnippet({
      title: '',
      description: '',
      code: '',
      tags: '',
      language: 'javascript'
    });
    setShowAddForm(false);
  };

  const handleDeleteSnippet = (id) => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      setSnippets(snippets.filter(snippet => snippet.id !== id));
    }
  };

  const handleExportSnippets = () => {
    const dataStr = JSON.stringify(snippets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'code-snippets.json');
    linkElement.click();
  };

  const handleImportSnippets = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSnippets = JSON.parse(e.target.result);
          if (Array.isArray(importedSnippets)) {
            setSnippets(prevSnippets => [...prevSnippets, ...importedSnippets]);
          }
        } catch (error) {
          alert('Error importing snippets. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Code Snippet Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Plus size={20} /> Add Snippet
          </button>
          <button
            onClick={handleExportSnippets}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export
          </button>
          <label className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportSnippets}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Snippet</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newSnippet.title}
                onChange={(e) => setNewSnippet({...newSnippet, title: e.target.value})}
                className="w-full p-2 border rounded"
              />
              
              <input
                type="text"
                placeholder="Description"
                value={newSnippet.description}
                onChange={(e) => setNewSnippet({...newSnippet, description: e.target.value})}
                className="w-full p-2 border rounded"
              />
              
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newSnippet.tags}
                onChange={(e) => setNewSnippet({...newSnippet, tags: e.target.value})}
                className="w-full p-2 border rounded"
              />
              
              <select
                value={newSnippet.language}
                onChange={(e) => setNewSnippet({...newSnippet, language: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="ruby">Ruby</option>
                <option value="other">Other</option>
              </select>
              
              <textarea
                placeholder="Paste your code here..."
                value={newSnippet.code}
                onChange={(e) => setNewSnippet({...newSnippet, code: e.target.value})}
                className="w-full p-2 border rounded h-48 font-mono"
              />
              
              <button
                onClick={handleAddSnippet}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <Save size={20} /> Save Snippet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredSnippets.map(snippet => (
          <div key={snippet.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">{snippet.title}</h3>
                <p className="text-gray-600">{snippet.description}</p>
                <p className="text-gray-400 text-sm">Created: {new Date(snippet.created).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleDeleteSnippet(snippet.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex gap-2 mb-2">
              {snippet.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                  <Tag size={14} />
                  {tag}
                </div>
              ))}
            </div>
            
            <pre className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
              {snippet.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;