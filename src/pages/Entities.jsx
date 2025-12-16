import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

// Helper function to decode protobuf string value
const decodeProtobufString = (nameString) => {
  try {
    const parsed = JSON.parse(nameString);
    if (parsed.typeUrl && parsed.value) {
      // The value is a hex-encoded string with protobuf encoding
      const hexString = parsed.value;
      
      // Skip protobuf tag (0A = field 1, wire type 2) and length byte
      // Format: 0A [length] [string data]
      let startIndex = 0;
      if (hexString.startsWith('0A')) {
        // Skip the tag byte (0A = 2 hex chars)
        // Next byte is the length (varint, but for strings < 128, it's just one byte)
        // So we skip: tag (2 chars) + length (2 chars) = 4 hex characters
        startIndex = 4;
      }
      
      // Decode the actual string content
      let result = '';
      for (let i = startIndex; i < hexString.length; i += 2) {
        const hex = hexString.substr(i, 2);
        const charCode = parseInt(hex, 16);
        if (charCode > 0) {
          result += String.fromCharCode(charCode);
        }
      }
      return result;
    }
    return nameString;
  } catch (e) {
    return nameString;
  }
};

const Entities = () => {
  const [searchParams] = useSearchParams();
  const major = searchParams.get('major');
  const minor = searchParams.get('minor');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  
  // Detail view state
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [relations, setRelations] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(null);
  const [relationsError, setRelationsError] = useState(null);
  const [datasetsError, setDatasetsError] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  
  // Metadata editor state
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [metadataPairs, setMetadataPairs] = useState([{ key: '', value: '' }]);
  const [metadataSaving, setMetadataSaving] = useState(false);

  useEffect(() => {
    if (!major || !minor) {
      setError('Major and minor parameters are required');
      setLoading(false);
      return;
    }

    const fetchEntities = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.ENTITIES(major, minor, offset, limit));
        if (!response.ok) {
          throw new Error('Failed to fetch entities');
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching entities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [major, minor, offset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const handleEntityClick = async (entity) => {
    setSelectedEntity(entity);
    setShowDetailView(true);
    setMetadataError(null);
    setRelationsError(null);
    setDatasetsError(null);
    setMetadata(null);
    setRelations(null);
    setDatasets(null);

    // Fetch metadata independently
    const fetchMetadata = async () => {
      setMetadataLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.ENTITY_METADATA(entity.id));
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }
        const result = await response.json();
        setMetadata(result);
        setMetadataError(null);
      } catch (err) {
        setMetadataError(err.message);
        console.error('Error fetching metadata:', err);
      } finally {
        setMetadataLoading(false);
      }
    };

    // Fetch relations independently
    const fetchRelations = async () => {
      setRelationsLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.ENTITY_RELATIONS(entity.id));
        if (!response.ok) {
          throw new Error('Failed to fetch relations');
        }
        const result = await response.json();
        setRelations(result);
        setRelationsError(null);
      } catch (err) {
        setRelationsError(err.message);
        console.error('Error fetching relations:', err);
      } finally {
        setRelationsLoading(false);
      }
    };

    // Fetch datasets independently
    const fetchDatasets = async () => {
      setDatasetsLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.ENTITY_CATEGORIES_TREE(entity.id));
        if (!response.ok) {
          throw new Error('Failed to fetch datasets');
        }
        const result = await response.json();
        setDatasets(result);
        setDatasetsError(null);
      } catch (err) {
        setDatasetsError(err.message);
        console.error('Error fetching datasets:', err);
      } finally {
        setDatasetsLoading(false);
      }
    };

    // Call all three in parallel - they will update independently
    fetchMetadata();
    fetchRelations();
    fetchDatasets();
  };

  const closeDetailView = () => {
    setShowDetailView(false);
    setSelectedEntity(null);
    setMetadata(null);
    setRelations(null);
    setDatasets(null);
  };

  // Color scheme for different tree levels
  const levelColors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100' },      // Level 0
    { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:bg-purple-100' }, // Level 1
    { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100' },    // Level 2
    { bg: 'bg-yellow-50', border: 'border-yellow-200', hover: 'hover:bg-yellow-100' }, // Level 3
    { bg: 'bg-pink-50', border: 'border-pink-200', hover: 'hover:bg-pink-100' },      // Level 4
    { bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' }, // Level 5
    { bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:bg-orange-100' }, // Level 6
    { bg: 'bg-teal-50', border: 'border-teal-200', hover: 'hover:bg-teal-100' },      // Level 7
  ];

  // Recursive component to render tree structure
  const renderTreeItem = (item, level = 0) => {
    const indent = level * 24;
    const hasChildren = item.children && item.children.length > 0;
    const hasAttributes = item.attributes && item.attributes.length > 0;
    
    // Get color for current level (cycle through if level exceeds available colors)
    const colorScheme = levelColors[level % levelColors.length];

    return (
      <div key={item.relatedEntityId || item.entityId} className="mb-2">
        <div 
          className={`${colorScheme.bg} rounded-lg p-4 border ${colorScheme.border} ${colorScheme.hover} transition-colors`}
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="mb-2">
            <p className="text-sm font-mono text-gray-600">{item.relatedEntityId || item.entityId}</p>
          </div>
          <div className="mb-2">
            <p className="text-base font-medium text-gray-900">
              {decodeProtobufString(item.name)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              <span className="font-medium">Direction:</span> {item.direction || 'N/A'}
            </span>
            <span>
              <span className="font-medium">Start:</span> {formatDate(item.startTime)}
            </span>
            {item.endTime && (
              <span>
                <span className="font-medium">End:</span> {formatDate(item.endTime)}
              </span>
            )}
          </div>
        </div>

        {/* Render attributes if present */}
        {hasAttributes && (
          <div style={{ marginLeft: `${indent + 24}px` }}>
            {item.attributes.map((attr) => (
              <div 
                key={attr.relatedEntityId}
                className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-2"
              >
                <div className="mb-1">
                  <p className="text-xs font-mono text-gray-600">{attr.relatedEntityId}</p>
                </div>
                <div className="mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {decodeProtobufString(attr.name)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    <span className="font-medium">Direction:</span> {attr.direction || 'N/A'}
                  </span>
                  <span>
                    <span className="font-medium">Start:</span> {formatDate(attr.startTime)}
                  </span>
                  {attr.endTime && (
                    <span>
                      <span className="font-medium">End:</span> {formatDate(attr.endTime)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recursively render children */}
        {hasChildren && (
          <div>
            {item.children.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Flatten relations array - each item has a body array
  const flattenedRelations = relations?.flatMap(item => item.body || []) || [];

  const goBack = () => {
    closeDetailView();
  };

  const metadataSave = async () => {
    // Filter out empty pairs
    const validPairs = metadataPairs.filter(p => p.key.trim() && p.value.trim());
    
    if (validPairs.length === 0) {
      alert('Please add at least one key-value pair');
      return;
    }

    // Check for duplicate keys within the new pairs
    const keys = validPairs.map(p => p.key.trim());
    const duplicateKeysInNew = keys.filter((key, index) => keys.indexOf(key) !== index);
    
    if (duplicateKeysInNew.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateKeysInNew)];
      alert(`The following key(s) are duplicated in your input: ${uniqueDuplicates.join(', ')}. Please use different keys.`);
      return;
    }

    // Get existing metadata and decode values
    const existingMetadata = metadata || {};
    const decodedExistingMetadata = {};
    Object.entries(existingMetadata).forEach(([key, value]) => {
      decodedExistingMetadata[key] = decodeProtobufString(value);
    });
    
    // Check for duplicate keys against existing metadata
    const duplicateKeysInExisting = keys.filter(key => decodedExistingMetadata.hasOwnProperty(key));
    
    if (duplicateKeysInExisting.length > 0) {
      alert(`The following key(s) already exist in metadata: ${duplicateKeysInExisting.join(', ')}. Please use different keys.`);
      return;
    }

    // Merge with existing metadata (no duplicates, so safe to merge)
    const mergedMetadata = { ...decodedExistingMetadata };
    validPairs.forEach(pair => {
      mergedMetadata[pair.key.trim()] = pair.value.trim();
    });

    // Format as [{key: value}, {key: value}]
    const formattedMetadata = Object.entries(mergedMetadata).map(([key, value]) => ({
      [key]: value
    }));

    // Send to API endpoint
    if (!selectedEntity) {
      alert('No entity selected');
      return;
    }

    setMetadataSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.ENTITY_METADATA_POST(selectedEntity.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedMetadata),
      });
      console.log(formattedMetadata);

      console.log(response);

      if (!response.ok) {
        throw new Error('Failed to save metadata');
      }

      // Refresh metadata after successful save
      const fetchMetadata = async () => {
        try {
          const metadataResponse = await fetch(API_ENDPOINTS.ENTITY_METADATA(selectedEntity.id));
          if (metadataResponse.ok) {
            const result = await metadataResponse.json();
            setMetadata(result);
            setMetadataError(null);
          }
        } catch (err) {
          console.error('Error refreshing metadata:', err);
        }
      };

      await fetchMetadata();

      // Close editor and reset form
      setShowMetadataEditor(false);
      setMetadataPairs([{ key: '', value: '' }]);
    } catch (err) {
      alert(`Failed to save metadata: ${err.message}`);
      console.error('Error saving metadata:', err);
    } finally {
      setMetadataSaving(false);
    }
  };

  // If detail view is shown, display metadata
  if (showDetailView && selectedEntity) {
    return (
      <div className="entities-container p-8">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>Back to Entities</span>
        </button>

        {/* Entity Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {decodeProtobufString(selectedEntity.name)}
          </h1>
          <p className="text-sm text-gray-600 font-mono">{selectedEntity.id}</p>
        </div>

        {/* Metadata Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Metadata</h2>
            <button
              onClick={() => {
                setShowMetadataEditor(!showMetadataEditor);
                if (!showMetadataEditor) {
                  setMetadataPairs([{ key: '', value: '' }]);
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              {showMetadataEditor ? 'Cancel' : '+ Add Metadata'}
            </button>
          </div>

          {/* Metadata Editor Form */}
          {showMetadataEditor && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Metadata</h3>
              <div className="space-y-3">
                {metadataPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Key"
                      value={pair.key}
                      onChange={(e) => {
                        const newPairs = [...metadataPairs];
                        newPairs[index].key = e.target.value;
                        setMetadataPairs(newPairs);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={pair.value}
                      onChange={(e) => {
                        const newPairs = [...metadataPairs];
                        newPairs[index].value = e.target.value;
                        setMetadataPairs(newPairs);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {metadataPairs.length > 1 && (
                      <button
                        onClick={() => {
                          setMetadataPairs(metadataPairs.filter((_, i) => i !== index));
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setMetadataPairs([...metadataPairs, { key: '', value: '' }])}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  + Add Another Pair
                </button>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={metadataSave}
                    disabled={metadataSaving}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {metadataSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {metadataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-gray-500">Loading metadata...</div>
              </div>
            </div>
          ) : metadataError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">Error: {metadataError}</div>
            </div>
          ) : metadata && Object.keys(metadata).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    {key.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-gray-900 break-words">
                    {decodeProtobufString(value)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No metadata found</div>
            </div>
          )}
        </div>

        {/* Relationships Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Relationships</h2>
          
          {relationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <div className="text-gray-500">Loading relationships...</div>
              </div>
            </div>
          ) : relationsError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">Error: {relationsError}</div>
            </div>
          ) : flattenedRelations.length > 0 ? (
            <div className="space-y-4">
              {flattenedRelations.map((relation, index) => (
                <div 
                  key={`${relation.id}-${index}`}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="mb-2">
                    <p className="text-sm font-mono text-gray-600">{relation.id}</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-base font-medium text-gray-900">
                      {decodeProtobufString(relation.name)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      <span className="font-medium">Type:</span> {relation.kind?.major} - {relation.kind?.minor}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span>
                      <span className="font-medium">Created:</span> {formatDate(relation.created)}
                    </span>
                    <span>
                      <span className="font-medium">Status:</span> {relation.terminated ? formatDate(relation.terminated) : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No relationships found</div>
            </div>
          )}
        </div>

        {/* Datasets Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Datasets</h2>
          
          {datasetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <div className="text-gray-500">Loading datasets...</div>
              </div>
            </div>
          ) : datasetsError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">Error: {datasetsError}</div>
            </div>
          ) : datasets && datasets.length > 0 ? (
            <div className="space-y-4">
              {datasets.map((dataset) => renderTreeItem(dataset, 0))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No datasets found</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="entities-container p-8 relative">
      {/* Header Section */}
      <div className="entities-header mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {data.pair?.major} - {data.pair?.minor}
            </h1>
            <p className="text-gray-600">
              Showing {data.count} of {data.total} entities
            </p>
          </div>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terminated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.items?.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEntityClick(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {decodeProtobufString(item.name)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.terminated ? formatDate(item.terminated) : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {offset + 1} to {Math.min(offset + limit, data.total)} of {data.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= data.total}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entities;

