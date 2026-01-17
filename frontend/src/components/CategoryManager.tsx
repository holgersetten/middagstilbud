import { useState, useEffect } from 'react';
import { offersApi } from '../services/api';
import type { CategoryHierarchy } from '../types/offer';
import './CategoryManager.css';

function CategoryManager() {
  const [categories, setCategories] = useState<CategoryHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Underkategori state
  const [selectedMain, setSelectedMain] = useState<string>('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [renameMode, setRenameMode] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  
  // Hovedkategori state
  const [newMainCategory, setNewMainCategory] = useState('');
  const [renameMainMode, setRenameMainMode] = useState<string | null>(null);
  const [newMainName, setNewMainName] = useState('');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await offersApi.getCategories();
      setCategories(data.categories);
    } catch (err) {
      setError('Kunne ikke hente kategorier');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMain || !newSubCategory.trim()) {
      alert('Velg hovedkategori og skriv inn navn på underkategori');
      return;
    }

    try {
      setSaving(true);
      const result = await offersApi.addSubCategory(selectedMain, newSubCategory.trim());
      alert(`✅ ${result.message}\n\n⚠️ ${result.note}`);
      setNewSubCategory('');
      await loadCategories();
    } catch (err: any) {
      alert(`❌ Feil: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSubCategory = async (mainCat: string, subCat: string) => {
    if (subCat === 'Annet') {
      alert('Kan ikke fjerne "Annet" kategorien');
      return;
    }

    if (!confirm(`Er du sikker på at du vil fjerne "${subCat}" fra "${mainCat}"?`)) {
      return;
    }

    try {
      setSaving(true);
      const result = await offersApi.removeSubCategory(mainCat, subCat);
      alert(`✅ ${result.message}\n\n⚠️ ${result.note}`);
      await loadCategories();
    } catch (err: any) {
      alert(`❌ Feil: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRenameSubCategory = async (mainCat: string, oldName: string) => {
    if (!newName.trim()) {
      alert('Skriv inn nytt navn');
      return;
    }

    try {
      setSaving(true);
      const result = await offersApi.renameSubCategory(mainCat, oldName, newName.trim());
      alert(`✅ ${result.message}\n\n⚠️ ${result.note}`);
      setRenameMode(null);
      setNewName('');
      await loadCategories();
    } catch (err: any) {
      alert(`❌ Feil: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMainCategory.trim()) {
      alert('Skriv inn navn på ny hovedkategori');
      return;
    }

    try {
      setSaving(true);
      const result = await offersApi.addMainCategory(newMainCategory.trim());
      alert(`✅ ${result.message}\n\n⚠️ ${result.note}`);
      setNewMainCategory('');
      await loadCategories();
    } catch (err: any) {
      alert(`❌ Feil: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMainCategory = async (mainCat: string) => {
    if (!confirm(`Er du sikker på at du vil fjerne "${mainCat}" og alle dens underkategorier?`)) {
      return;
    }

    try {
      setSaving(true);
      const result = await offersApi.removeMainCategory(mainCat);
      alert(`✅ ${result.message}\n\n⚠️ ${result.note}`);
      await loadCategories();
    } catch (err: any) {
      alert(`❌ Feil: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRenameMainCategory = async (oldName: string) => {
    if (!newMainName.trim()) {
      alert('Skriv inn nytt navn');
      return;
    }

    try {
      setSaving(true);
      const result = await offersApi.renameMainCategory(oldName, newMainName.trim());
      alert(`✅ ${result.message}\n\n⚠️ ${result.note}`);
      setRenameMainMode(null);
      setNewMainName('');
      await loadCategories();
    } catch (err: any) {
      alert(`❌ Feil: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="category-manager loading">Laster kategorier...</div>;
  }

  if (error) {
    return (
      <div className="category-manager error">
        <p>{error}</p>
        <button onClick={loadCategories}>Prøv igjen</button>
      </div>
    );
  }

  return (
    <div className="category-manager">
      <div className="header">
        <h1>🏷️ Kategoristruktur</h1>
        <p className="subtitle">Administrer hovedkategorier og underkategorier</p>
      </div>

      <div className="content-grid">
        {/* Venstre side: Legg til */}
        <div className="add-section card">
          {/* Legg til hovedkategori */}
          <h2>➕ Legg til hovedkategori</h2>
          <form onSubmit={handleAddMainCategory} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Ny hovedkategori</label>
              <input
                type="text"
                value={newMainCategory}
                onChange={(e) => setNewMainCategory(e.target.value)}
                placeholder="f.eks. 'Fryste varer', 'Husholdning'"
                disabled={saving}
                required
              />
            </div>
            <button type="submit" disabled={saving}>
              {saving ? 'Lagrer...' : '✅ Legg til hovedkategori'}
            </button>
          </form>

          <hr style={{ margin: '2rem 0', border: '1px solid #ddd' }} />

          {/* Legg til underkategori */}
          <h2>➕ Legg til underkategori</h2>
          <form onSubmit={handleAddSubCategory}>
            <div className="form-group">
              <label>Hovedkategori</label>
              <select
                value={selectedMain}
                onChange={(e) => setSelectedMain(e.target.value)}
                disabled={saving}
                required
              >
                <option value="">Velg kategori...</option>
                {Object.keys(categories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ny underkategori</label>
              <input
                type="text"
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                placeholder="f.eks. 'Laks', 'Supper', 'Proteinbarer'"
                disabled={saving}
                required
              />
            </div>

            <button type="submit" disabled={saving || !selectedMain}>
              {saving ? 'Lagrer...' : '✅ Legg til underkategori'}
            </button>
          </form>

          <div className="warning">
            <strong>⚠️ Viktig:</strong> Backend må restartes etter endringer
          </div>
        </div>

        {/* Høyre side: Eksisterende kategorier */}
        <div className="categories-list card">
          <h2>📋 Nåværende struktur</h2>
          
          {Object.entries(categories).map(([mainCat, subCats]) => (
            <div key={mainCat} className="category-group">
              {renameMainMode === mainCat ? (
                <div className="rename-form" style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={newMainName}
                    onChange={(e) => setNewMainName(e.target.value)}
                    placeholder={mainCat}
                    autoFocus
                  />
                  <button
                    onClick={() => handleRenameMainCategory(mainCat)}
                    disabled={saving}
                    className="btn-save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setRenameMainMode(null);
                      setNewMainName('');
                    }}
                    disabled={saving}
                    className="btn-cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{mainCat}</span>
                  <div className="subcategory-actions">
                    <button
                      onClick={() => {
                        setRenameMainMode(mainCat);
                        setNewMainName(mainCat);
                      }}
                      disabled={saving}
                      className="btn-edit"
                      title="Omdøp hovedkategori"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleRemoveMainCategory(mainCat)}
                      disabled={saving}
                      className="btn-delete"
                      title="Fjern hovedkategori"
                    >
                      🗑️
                    </button>
                  </div>
                </h3>
              )}
              <ul>
                {subCats.map((subCat) => (
                  <li key={subCat} className="subcategory-item">
                    {renameMode === `${mainCat}/${subCat}` ? (
                      <div className="rename-form">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={subCat}
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameSubCategory(mainCat, subCat)}
                          disabled={saving}
                          className="btn-save"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setRenameMode(null);
                            setNewName('');
                          }}
                          disabled={saving}
                          className="btn-cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="subcategory-name">{subCat}</span>
                        <div className="subcategory-actions">
                          {subCat !== 'Annet' && (
                            <>
                              <button
                                onClick={() => {
                                  setRenameMode(`${mainCat}/${subCat}`);
                                  setNewName(subCat);
                                }}
                                disabled={saving}
                                className="btn-edit"
                                title="Omdøp"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleRemoveSubCategory(mainCat, subCat)}
                                disabled={saving}
                                className="btn-delete"
                                title="Fjern"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
