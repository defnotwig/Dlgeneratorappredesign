import { useState, useMemo } from 'react';
import { Building2, Search } from 'lucide-react';

interface ClientSelectorProps {
  selectedClient: string;
  setSelectedClient: (client: string) => void;
}

const clients = [
  { id: 'bpi', name: 'BPI', fullName: 'Bank of the Philippine Islands' },
  { id: 'bpi-banko', name: 'BPI BANKO', fullName: 'BPI Direct BanKo' },
  { id: 'eon-bank', name: 'EON BANK', fullName: 'EON Bank' },
  { id: 'usb-plc', name: 'USB PLC', fullName: 'Union Bank of the Philippines' },
  { id: 'citibank', name: 'Citibank', fullName: 'Citibank N.A.' },
  { id: 'hsbc', name: 'HSBC', fullName: 'HSBC Philippines' },
];

export function ClientSelector({ selectedClient, setSelectedClient }: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fix: Maintain selection state independently from search filter
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Building2 size={18} className="text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Client Selection</h3>
          <p className="text-sm text-gray-500">Select the client folder for each tracking</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Client List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No clients found</p>
        ) : (
          filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selectedClient === client.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedClient === client.id ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}
                >
                  <Building2
                    size={20}
                    className={selectedClient === client.id ? 'text-emerald-600' : 'text-gray-600'}
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      selectedClient === client.id ? 'text-emerald-900' : 'text-gray-900'
                    }`}
                  >
                    {client.name}
                  </h4>
                  <p
                    className={`text-xs ${
                      selectedClient === client.id ? 'text-emerald-700' : 'text-gray-500'
                    }`}
                  >
                    {client.fullName}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}