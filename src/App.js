// src/App.js
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Tag, Save, LogIn, LogOut, Github } from 'lucide-react';
import { db, auth, googleProvider, githubProvider } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  GithubAuthProvider,
  GoogleAuthProvider 
} from 'firebase/auth';

function App() {
  const [snippets, setSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState(null);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    description: '',
    code: '',
    tags: '',
    language: 'javascript'
  });

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchSnippets(user.uid);
      } else {
        setSnippets([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSnippets = async (userId) => {
    try {
      const q = query(
        collection(db, 'snippets'),
        where('userId', '==', userId),
        orderBy('created', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const snippetData = [];
      querySnapshot.forEach((doc) => {
        snippetData.push({ id: doc.id, ...doc.data() });
      });
      setSnippets(snippetData);
    } catch (error) {
      console.error('Error fetching snippets:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google. Please try again.');
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      if (token) {
        localStorage.setItem('github_token', token);
      }
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      alert('Error signing in with GitHub. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('github_token');
      setSnippets([]);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  const handleAddSnippet = async () => {
    if (!user || !newSnippet.title || !newSnippet.code) {
      alert('Please provide both title and code for the snippet.');
      return;
    }
    
    try {
      const snippetData = {
        ...newSnippet,
        userId: user.uid,
        created: new Date().toISOString(),
        tags: newSnippet.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      const docRef = await addDoc(collection(db, 'snippets'), snippetData);
      setSnippets([{ id: docRef.id, ...snippetData }, ...snippets]);
      
      setNewSnippet({
        title: '',
        description: '',
        code: '',
        tags: '',
        language: 'javascript'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding snippet:', error);
      alert('Error adding snippet. Please try again.');
    }
  };

  const handleDeleteSnippet = async (id) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      try {
        await deleteDoc(doc(db, 'snippets', id));
        setSnippets(snippets.filter(snippet => snippet.id !== id));
      } catch (error) {
        console.error('Error deleting snippet:', error);
        alert('Error deleting snippet. Please try again.');
      }
    }
  };

  const handleExportSnippets = () => {
    if (snippets.length === 0) {
      alert('No snippets to export.');
      return;
    }

    const dataStr = JSON.stringify(snippets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'code-snippets.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportSnippets = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedSnippets = JSON.parse(e.target.result);
          if (Array.isArray(importedSnippets)) {
            for (const snippet of importedSnippets) {
              const { id, userId, ...snippetData } = snippet;
              await addDoc(collection(db, 'snippets'), {
                ...snippetData,
                userId: user.uid,
                created: new Date().toISOString()
              });
            }
            // Refresh snippets
            fetchSnippets(user.uid);
            alert('Snippets imported successfully!');
          }
        } catch (error) {
          console.error('Error importing snippets:', error);
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
        <div className="flex gap-2 items-center">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                {user.email || user.displayName}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                <LogOut size={20} /> Sign Out
              </button>
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
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                <LogIn size={20} /> Sign in with Google
              </button>
              <button
                onClick={handleGitHubSignIn}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
              >
                <Github size={20} /> Sign in with GitHub
              </button>
            </div>
          )}
        </div>
      </div>

      {user && (
        <>
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
                    <p className="text-gray-400 text-sm">
                      Created: {new Date(snippet.created).toLocaleDateString()}
                    </p>
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
        </>
      )}
    </div>
  );
}

export default App;