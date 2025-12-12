import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

// Helper function to decode protobuf string value
const decodeProtobufString = (nameString) => {
  try {
    const parsed = JSON.parse(nameString);
    if (parsed.typeUrl && parsed.value) {
      // The value is a hex-encoded string
      const hexString = parsed.value;
      let result = '';
      for (let i = 0; i < hexString.length; i += 2) {
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
  
  // Relations panel state
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [relations, setRelations] = useState(null);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
    setIsPanelOpen(true);
    setRelationsLoading(true);
    setRelationsError(null);

    try {
      const response = await fetch(API_ENDPOINTS.ENTITY_RELATIONS(entity.id));
      if (!response.ok) {
        throw new Error('Failed to fetch relations');
      }
      const result = await response.json();
      setRelations(result);
    } catch (err) {
      setRelationsError(err.message);
      console.error('Error fetching relations:', err);
    } finally {
      setRelationsLoading(false);
    }
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedEntity(null);
    setRelations(null);
  };

  // Flatten relations array - each item has a body array
  const flattenedRelations = relations?.flatMap(item => item.body || []) || [];

  return (
    <div className="entities-container p-8 relative">
      {/* Header Section */}
      <div className={`entities-header mb-8 transition-opacity duration-300 ${isPanelOpen ? 'opacity-50' : 'opacity-100'}`}>
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
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-opacity duration-300 ${isPanelOpen ? 'opacity-50' : 'opacity-100'}`}>
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

      {/* Relations Side Panel */}
      {isPanelOpen && (
          <div className={`fixed top-0 left-0 h-full w-1/3 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
            isPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Relations</h2>
                  {selectedEntity && (
                    <p className="text-sm text-gray-600 mt-1">
                      {decodeProtobufString(selectedEntity.name)}
                    </p>
                  )}
                </div>
                <button
                  onClick={closePanel}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {relationsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading relations...</div>
                  </div>
                ) : relationsError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-red-500">Error: {relationsError}</div>
                  </div>
                ) : flattenedRelations.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">No relations found</div>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Entities;

